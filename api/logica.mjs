// Lógica do contador de pessoas online e do chat.
// Usada pelas Funções do Netlify (com o Netlify Blobs) e pelo servidor do notebook (em memória).
//
// O armazenamento só precisa de quatro operações:
//   get(chave) -> objeto ou null · set(chave, objeto) · list(prefixo) -> [chaves] · del(chave)
//
// Chaves usadas:
//   p/<janela>/<id>   presença: a janela é o tempo dividido em blocos de 30 s
//   m/<tempo>-<sorte> mensagem do chat (a ordem alfabética das chaves é a ordem do tempo)
//   r/<id>            hora da última mensagem de cada pessoa (limite de envio)

export const LIMITES = {
  nome: 20,
  cidade: 40,
  texto: 200,
  historico: 200,   // mensagens guardadas
  leitura: 50,      // mensagens devolvidas de uma vez
  janela: 30000,    // tamanho do bloco de presença, em ms
  intervaloEnvio: 2000,
};

const ID_OK = /^[a-z0-9]{8,32}$/;

// Caracteres de controle e invisíveis (inclusive os que invertem a direção do texto).
const INVISIVEIS = new RegExp('[' + [[0, 31], [127, 127], [0x200b, 0x200f], [0x2028, 0x202e], [0x2066, 0x2069]]
  .map(([a, b]) => String.fromCharCode(a) + '-' + String.fromCharCode(b)).join('') + ']', 'g');

export function limpar(txt, max) {
  return String(txt == null ? '' : txt)
    .replace(INVISIVEIS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

// Apelido curto e estável do autor, pra o jogo saber quais mensagens são suas
// sem expor o id que serve de controle de envio.
export function apelido(id) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function janelaDe(agora) {
  return Math.floor(agora / LIMITES.janela);
}

function chaveMensagem(agora) {
  return 'm/' + agora.toString(36).padStart(10, '0') + '-' + Math.random().toString(36).slice(2, 8);
}

async function ultimaMensagem(store) {
  const chaves = (await store.list('m/')).sort();
  return chaves.length ? chaves[chaves.length - 1] : null;
}

// Batida de presença: marca a pessoa como online e devolve quantas estão.
export async function presenca(store, corpo, agora) {
  const id = String((corpo && corpo.id) || '');
  if (!ID_OK.test(id)) return { status: 400, json: { erro: 'id inválido' } };
  const j = janelaDe(agora);
  await store.set('p/' + j + '/' + id, { t: agora });
  const ids = new Set();
  for (const pre of ['p/' + j + '/', 'p/' + (j - 1) + '/']) {
    for (const k of await store.list(pre)) ids.add(k.split('/')[2]);
  }
  // limpeza de vez em quando: apaga presenças antigas
  if (Math.random() < 0.1) {
    for (const k of await store.list('p/')) {
      if (Number(k.split('/')[1]) < j - 2) await store.del(k);
    }
  }
  return { status: 200, json: { online: Math.max(1, ids.size), ultima: await ultimaMensagem(store) } };
}

// Lê as mensagens mais recentes (ou só as que vieram depois de uma chave).
export async function lerChat(store, depois) {
  const chaves = (await store.list('m/')).sort();
  let alvo = chaves.slice(-LIMITES.leitura);
  if (depois) alvo = alvo.filter((k) => k > String(depois));
  const msgs = (await Promise.all(alvo.map((k) => store.get(k)))).filter(Boolean);
  return { status: 200, json: { mensagens: msgs } };
}

// Envia uma mensagem.
export async function enviarChat(store, corpo, agora) {
  const id = String((corpo && corpo.id) || '');
  if (!ID_OK.test(id)) return { status: 400, json: { erro: 'id inválido' } };
  const nome = limpar(corpo.nome, LIMITES.nome);
  const cidade = limpar(corpo.cidade, LIMITES.cidade);
  const texto = limpar(corpo.texto, LIMITES.texto);
  if (!nome) return { status: 400, json: { erro: 'Escolha um nome antes de mandar mensagem.' } };
  if (!texto) return { status: 400, json: { erro: 'A mensagem está vazia.' } };
  const ultimo = await store.get('r/' + id);
  if (ultimo && agora - ultimo.t < LIMITES.intervaloEnvio) {
    return { status: 429, json: { erro: 'Calma! Espere um pouquinho antes de mandar outra.' } };
  }
  await store.set('r/' + id, { t: agora });
  const chave = chaveMensagem(agora);
  const msg = { id: chave, autor: apelido(id), nome, cidade, texto, t: agora };
  await store.set(chave, msg);
  // guarda só as últimas mensagens
  if (Math.random() < 0.2) {
    const chaves = (await store.list('m/')).sort();
    const sobra = chaves.length - LIMITES.historico;
    for (let i = 0; i < sobra; i++) await store.del(chaves[i]);
  }
  return { status: 200, json: { mensagem: msg } };
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
  };
}
