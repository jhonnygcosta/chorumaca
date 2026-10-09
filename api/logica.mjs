// Lógica do contador de pessoas online e do chat.
// Usada pelas Funções do Netlify (com o Netlify Blobs) e pelo servidor do notebook (em memória).
//
// O armazenamento precisa de cinco operações:
//   get(chave) -> objeto ou null · set(chave, objeto) · list(prefixo) -> [chaves] · del(chave)
//   criar(chave, objeto) -> true se gravou, false se a chave já existia (atômico)
//
// Chaves usadas:
//   p/<janela>/<dono>.<id>  presença: a janela é o tempo em blocos de 30 s; o dono é um resumo
//                           da conexão (IP), pra uma pessoa não inflar o contador sozinha
//   m/<tempo>-<sorte>       mensagem do chat (a ordem alfabética das chaves é a ordem do tempo)
//   u                       chave da mensagem mais nova (evita listar tudo a cada leitura)
//   r/<bloco>/i<id>         limite de envio por pessoa (um envio por bloco de 2 s)
//   r/<bloco>/a<dono>       limite de envio por conexão

export const LIMITES = {
  nome: 20,
  cidade: 40,
  texto: 200,
  historico: 200,     // mensagens guardadas
  leitura: 50,        // mensagens devolvidas de uma vez
  janela: 30000,      // bloco de presença, em ms
  intervaloEnvio: 2000,
  porConexao: 4,      // no máximo 4 pessoas contadas por conexão no "online"
  recuo: 10000,       // a leitura volta 10 s, pra não perder mensagem gravada fora de ordem
  poda: 100,          // chaves velhas apagadas por limpeza
};

const ID_OK = /^[a-z0-9]{8,32}$/;
const CHAVE_MSG = /^m\/[0-9a-z]{10}-[0-9a-z]{1,8}$/;

// Caracteres de controle, formatação, uso privado e "letras vazias" que parecem espaço.
const INVISIVEIS = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}]/gu;
const VAZIAS = new RegExp('[' + [0x034f, 0x115f, 0x1160, 0x3164, 0xffa0, 0x2800].map((c) => String.fromCodePoint(c)).join('') + ']', 'gu');
const UNE_EMOJI = String.fromCodePoint(0x200d); // junta emojis compostos: fica
const ACENTOS_DEMAIS = /(\p{M}{2})\p{M}+/gu;
const VISIVEL = /[\p{L}\p{N}\p{S}\p{P}]/u;

// Limpa um texto: tira invisíveis, limita acentos empilhados, corta sem quebrar emoji
// e devolve vazio se não sobrar nenhuma letra, número ou símbolo visível.
export function limpar(txt, max) {
  const s = String(txt == null ? '' : txt)
    .normalize('NFC')
    .replace(INVISIVEIS, (c) => (c === UNE_EMOJI ? c : ' '))
    .replace(VAZIAS, ' ')
    .replace(ACENTOS_DEMAIS, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const r = Array.from(s).slice(0, max).join('').trim();
  return VISIVEL.test(r) ? r : '';
}

// Resumo curto de um texto (agrupa conexões sem guardar o IP).
function resumo(texto) {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// IPv6 é agrupado por /64 (uma casa costuma ter um bloco inteiro).
function donoDe(ip) {
  const v = String(ip || '');
  if (!v) return 'x';
  return resumo(v.includes(':') ? v.split(':').slice(0, 4).join(':') : v);
}

const janelaDe = (agora) => Math.floor(agora / LIMITES.janela);

function chaveMensagem(agora) {
  return 'm/' + agora.toString(36).padStart(10, '0') + '-' + Math.random().toString(36).slice(2, 8);
}

// Só o que vai pra tela de todo mundo.
function publica(m) {
  return { id: m.id, nome: m.nome, cidade: m.cidade, texto: m.texto, t: m.t };
}

async function registrarPresenca(store, id, dono, agora) {
  const j = janelaDe(agora);
  const minha = 'p/' + j + '/' + dono + '.' + id;
  const [, a, b] = await Promise.all([
    store.set(minha, { t: agora }),
    store.list('p/' + j + '/'),
    store.list('p/' + (j - 1) + '/'),
  ]);
  const porDono = new Map();
  for (const k of [...a, ...b, minha]) {
    const [d, i] = String(k.split('/')[2] || '').split('.');
    if (!d || !i) continue;
    if (!porDono.has(d)) porDono.set(d, new Set());
    porDono.get(d).add(i);
  }
  let online = 0;
  for (const s of porDono.values()) online += Math.min(LIMITES.porConexao, s.size);
  return Math.max(1, online);
}

// Batida de presença: marca a pessoa como online e devolve quantas estão.
export async function presenca(store, corpo, agora, ip = '') {
  const id = String((corpo && corpo.id) || '');
  if (!ID_OK.test(id)) return { status: 400, json: { erro: 'id inválido' } };
  const [online, u] = await Promise.all([registrarPresenca(store, id, donoDe(ip), agora), store.get('u')]);
  return { status: 200, json: { online, ultima: u && u.k ? u.k : null } };
}

// Lê mensagens. Com "depois", devolve as que vieram a partir de 10 s antes dessa chave
// (o jogo descarta as repetidas). Com "id", também marca a pessoa como online.
export async function lerChat(store, consulta, agora, ip = '') {
  const depois = String((consulta && consulta.depois) || '').slice(0, 40);
  const id = String((consulta && consulta.id) || '');
  let online;
  const presente = ID_OK.test(id)
    ? registrarPresenca(store, id, donoDe(ip), agora).then((n) => { online = n; })
    : Promise.resolve();
  let corte = '';
  if (CHAVE_MSG.test(depois)) {
    const td = parseInt(depois.slice(2, 12), 36);
    corte = 'm/' + Math.max(0, td - LIMITES.recuo).toString(36).padStart(10, '0');
  }
  if (corte) {
    const u = await store.get('u');
    if (!u || !u.k || u.k <= corte) {
      await presente;
      return { status: 200, json: { mensagens: [], online } };
    }
  }
  const chaves = (await store.list('m/')).sort();
  let alvo = chaves.slice(-LIMITES.leitura);
  if (corte) alvo = alvo.filter((k) => k > corte);
  const [msgs] = await Promise.all([Promise.all(alvo.map((k) => store.get(k))), presente]);
  return { status: 200, json: { mensagens: msgs.filter(Boolean).map(publica), online } };
}

// Envia uma mensagem. Um envio a cada 2 s por pessoa e por conexão, de forma atômica:
// pedidos ao mesmo tempo disputam a mesma chave e só um passa.
export async function enviarChat(store, corpo, agora, ip = '') {
  const id = String((corpo && corpo.id) || '');
  if (!ID_OK.test(id)) return { status: 400, json: { erro: 'id inválido' } };
  const nome = limpar(corpo.nome, LIMITES.nome);
  const cidade = limpar(corpo.cidade, LIMITES.cidade);
  const texto = limpar(corpo.texto, LIMITES.texto);
  if (!nome) return { status: 400, json: { erro: 'Escolha um nome antes de mandar mensagem.' } };
  if (!texto) return { status: 400, json: { erro: 'A mensagem está vazia.' } };
  const bloco = Math.floor(agora / LIMITES.intervaloEnvio);
  const vagas = await Promise.all([
    store.criar('r/' + bloco + '/i' + id, { t: agora }),
    ip ? store.criar('r/' + bloco + '/a' + donoDe(ip), { t: agora }) : true,
  ]);
  if (!vagas.every(Boolean)) {
    return { status: 429, json: { erro: 'Calma! Espere um pouquinho antes de mandar outra.' } };
  }
  const chave = chaveMensagem(agora);
  const msg = { id: chave, nome, cidade, texto, t: agora };
  await store.set(chave, msg);
  await store.set('u', { k: chave });
  return { status: 200, json: { mensagem: publica(msg) } };
}

// Limpeza em segundo plano: mensagens além do histórico, presenças e limites de envio velhos.
// Apaga no máximo LIMITES.poda chaves por vez.
export async function podar(store, agora) {
  const j = janelaDe(agora);
  const bloco = Math.floor(agora / LIMITES.intervaloEnvio);
  const [m, p, r] = await Promise.all([store.list('m/'), store.list('p/'), store.list('r/')]);
  const ms = m.sort();
  const velhas = [
    ...ms.slice(0, Math.max(0, ms.length - LIMITES.historico)),
    ...p.filter((k) => Number(k.split('/')[1]) < j - 2),
    ...r.filter((k) => Number(k.split('/')[1]) < bloco - 1),
  ].slice(0, LIMITES.poda);
  await Promise.all(velhas.map((k) => Promise.resolve(store.del(k)).catch(() => {})));
}

// Lê o corpo JSON de um pedido, com limite de tamanho.
export function lerCorpo(texto) {
  if (!texto || texto.length > 2000) return null;
  try {
    const o = JSON.parse(texto);
    return o && typeof o === 'object' ? o : null;
  } catch {
    return null;
  }
}

// Armazenamento em memória (servidor do notebook e testes).
export function lojaMemoria() {
  const m = new Map();
  return {
    async get(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; },
    async set(k, v) { m.set(k, JSON.stringify(v)); },
    async list(prefixo) { return [...m.keys()].filter((k) => k.startsWith(prefixo)); },
    async del(k) { m.delete(k); },
    // atômico: não há espera entre conferir e gravar
    async criar(k, v) {
      if (m.has(k)) return false;
      m.set(k, JSON.stringify(v));
      return true;
    },
    get tamanho() { return m.size; },
  };
}
