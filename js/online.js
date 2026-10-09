// Pessoas online e chat do jogo.
// Funciona no site do Netlify (Funções + Netlify Blobs) e no servidor do notebook (memória).
// Se o servidor não tiver o chat (por exemplo, abrindo o index.html direto), o botão some.
(function (CH) {
  const ui = CH.ui;
  const $ = (id) => document.getElementById(id);
  const CHAVE_ID = 'chorumaca-id';
  const CHAVE_PERFIL = 'chorumaca-perfil';
  const CHAVE_LIDA = 'chorumaca-chat-lida';
  const BATIDA = 20000;
  const LEITURA = 3000;

  let id = null;
  let perfil = null;          // { nome, cidade }
  let ligado = false;         // o servidor respondeu
  let ultimaServidor = null;  // chave da mensagem mais nova no servidor
  let ultimaLida = null;
  let timerBatida = null;
  let timerLeitura = null;
  let chatAberto = false;
  let mensagens = [];
  let lista = null;

  function ler(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) { /* sem armazenamento */ }
  }

  function meuId() {
    let v = ler(CHAVE_ID);
    if (!v || !/^[a-z0-9]{8,32}$/.test(v)) {
      const bytes = new Uint8Array(12);
      (window.crypto || window.msCrypto).getRandomValues(bytes);
      v = Array.from(bytes, (b) => (b % 36).toString(36)).join('');
      gravar(CHAVE_ID, v);
    }
    return v;
  }

  // mesmo cálculo do servidor (api/logica.mjs), pra reconhecer as próprias mensagens
  function apelido(texto) {
    let h = 5381;
    for (let i = 0; i < texto.length; i++) h = ((h * 33) ^ texto.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  async function chamar(caminho, opcoes) {
    const r = await fetch('/api' + caminho, Object.assign({ cache: 'no-store', headers: { 'Content-Type': 'application/json' } }, opcoes));
    let dados = null;
    try { dados = await r.json(); } catch (e) { dados = null; }
    if (!r.ok) {
      const erro = new Error((dados && dados.erro) || 'O servidor não respondeu.');
      erro.status = r.status;
      throw erro;
    }
    return dados;
  }

  // ---------- presença ----------

  async function batida() {
    if (document.hidden) return;
    try {
      const d = await chamar('/presenca', { method: 'POST', body: JSON.stringify({ id }) });
      ligado = true;
      ultimaServidor = d.ultima || null;
      atualizarBotao(d.online);
    } catch (e) {
      if (!ligado) $('btn-chat').hidden = true;
    }
  }

  function atualizarBotao(n) {
    const b = $('btn-chat');
    b.hidden = false;
    $('txt-online').textContent = n + ' online';
    b.setAttribute('aria-label', 'Chat, ' + n + (n === 1 ? ' pessoa online' : ' pessoas online'));
    const naoLida = !chatAberto && ultimaServidor && ultimaServidor !== ultimaLida;
    b.classList.toggle('nova', !!naoLida);
  }

  // ---------- localização → cidade ----------

  function pedirCidade() {
    return new Promise((ok, falha) => {
      if (!window.isSecureContext || !navigator.geolocation) {
        falha(new Error('A localização só funciona no site com https (o link do Netlify).'));
        return;
      }
      navigator.geolocation.getCurrentPosition(async (pos) => {
        // arredonda pra uns 1 km: suficiente pra descobrir a cidade
        const lat = pos.coords.latitude.toFixed(2), lon = pos.coords.longitude.toFixed(2);
        try {
          const r = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=pt');
          const d = await r.json();
          const cidade = d.city || d.locality || d.principalSubdivision || '';
          if (!cidade) { falha(new Error('Não deu pra descobrir a cidade.')); return; }
          const uf = d.countryCode === 'BR' && d.principalSubdivisionCode ? d.principalSubdivisionCode.split('-')[1] : '';
          ok(uf ? cidade + ' - ' + uf : cidade + (d.countryName && d.countryCode !== 'BR' ? ', ' + d.countryName : ''));
        } catch (e) {
          falha(new Error('Não deu pra descobrir a cidade agora. Tente de novo.'));
        }
      }, (err) => {
        falha(new Error(err.code === 1
          ? 'Você não deixou o jogo ver a localização. Dá pra liberar nas configurações do navegador.'
          : 'Não deu pra pegar a localização agora. Tente de novo.'));
      }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
    });
  }

  // ---------- telas ----------

  function painelPerfil(depois) {
    const atual = perfil || { nome: '', cidade: '' };
    let cidade = atual.cidade || '';
    ui.painel('Seu nome no chat', (c) => {
      c.appendChild(ui.el('p', '', 'Escolha como você vai aparecer no chat. Seu nome e sua cidade ficam visíveis pra todo mundo que estiver jogando.'));
      const l = ui.el('label', 'campo', '<span>Seu nome</span>');
      l.setAttribute('for', 'chat-nome');
      const inp = document.createElement('input');
      inp.id = 'chat-nome'; inp.type = 'text'; inp.maxLength = 20; inp.autocomplete = 'nickname';
      inp.placeholder = 'Ex.: Fã da Chorú';
      inp.value = atual.nome || '';
      l.appendChild(inp);
      c.appendChild(l);

      const cid = ui.el('div', 'campo', '<span>Sua cidade</span>');
      const mostra = ui.el('p', 'cidade-atual', cidade ? cidade : 'Ainda não definida');
      cid.appendChild(mostra);
      const loc = ui.el('button', 'botao verde', 'Usar minha localização');
      loc.type = 'button';
      const aviso = ui.el('p', 'aviso-form', '');
      aviso.setAttribute('aria-live', 'polite');
      loc.onclick = async () => {
        loc.disabled = true;
        aviso.textContent = 'Procurando sua cidade...';
        try {
          cidade = await pedirCidade();
          mostra.textContent = cidade;
          aviso.textContent = '';
        } catch (e) {
          aviso.textContent = e.message;
        }
        loc.disabled = false;
      };
      cid.appendChild(loc);
      cid.appendChild(ui.el('p', 'nota', 'A localização do celular é usada só pra descobrir a cidade. A posição exata não vai pro chat.'));
      c.appendChild(cid);

      const f = ui.el('div', 'fila');
      const ok = ui.el('button', 'botao', 'Entrar no chat');
      ok.type = 'button';
      ok.onclick = () => {
        const nome = inp.value.replace(/\s+/g, ' ').trim().slice(0, 20);
        if (!nome) { aviso.textContent = 'Escreva um nome pra entrar no chat.'; inp.focus(); return; }
        perfil = { nome, cidade };
        gravar(CHAVE_PERFIL, JSON.stringify(perfil));
        CH.som.botao();
        if (depois) depois();
      };
      f.appendChild(ok);
      c.appendChild(f);
      c.appendChild(aviso);
      setTimeout(() => { if (!inp.value) inp.focus(); }, 300);
    }, () => { chatAberto = false; lista = null; pararLeitura(); });
  }

  function painelChat() {
    chatAberto = true;
    $('btn-chat').classList.remove('nova');
    ui.painel('Chat', (c) => {
      const topo = ui.el('div', 'chat-topo');
      const quem = ui.el('span', 'chat-quem');
      quem.textContent = perfil.nome + (perfil.cidade ? ' · ' + perfil.cidade : '');
      const trocar = ui.el('button', 'link', 'Trocar nome');
      trocar.type = 'button';
      trocar.onclick = () => painelPerfil(painelChat);
      topo.appendChild(quem);
      topo.appendChild(trocar);
      c.appendChild(topo);

      lista = ui.el('div', 'chat-lista');
      lista.setAttribute('role', 'log');
      lista.setAttribute('aria-live', 'polite');
      c.appendChild(lista);
      desenharLista(true);

      const form = ui.el('form', 'chat-form');
      const inp = document.createElement('input');
      inp.id = 'chat-texto'; inp.type = 'text'; inp.maxLength = 200; inp.autocomplete = 'off';
      inp.placeholder = 'Escreva uma mensagem';
      inp.setAttribute('aria-label', 'Mensagem');
      const env = ui.el('button', 'botao', 'Enviar');
      env.type = 'submit';
      const aviso = ui.el('p', 'aviso-form', '');
      aviso.setAttribute('aria-live', 'polite');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const texto = inp.value.trim();
        if (!texto) return;
        env.disabled = true;
        try {
          const d = await chamar('/chat', { method: 'POST', body: JSON.stringify({ id, nome: perfil.nome, cidade: perfil.cidade, texto }) });
          inp.value = '';
          aviso.textContent = '';
          receber([d.mensagem]);
          CH.som.toque();
        } catch (er) {
          aviso.textContent = er.message;
        }
        env.disabled = false;
        inp.focus();
      };
      form.appendChild(inp);
      form.appendChild(env);
      c.appendChild(form);
      c.appendChild(aviso);
    }, () => {
      chatAberto = false;
      lista = null;
      marcarLida();
      pararLeitura();
    });
    ler1();
    pararLeitura();
    timerLeitura = setInterval(ler1, LEITURA);
  }

  function pararLeitura() {
    clearInterval(timerLeitura);
    timerLeitura = null;
  }

  async function ler1() {
    if (document.hidden || !chatAberto) return;
    const depois = mensagens.length ? mensagens[mensagens.length - 1].id : '';
    try {
      const d = await chamar('/chat' + (depois ? '?depois=' + encodeURIComponent(depois) : ''), { method: 'GET' });
      receber(d.mensagens || []);
    } catch (e) { /* tenta de novo na próxima */ }
  }

  function receber(novas) {
    const vistas = new Set(mensagens.map((m) => m.id));
    const add = novas.filter((m) => m && m.id && !vistas.has(m.id));
    if (!add.length) return;
    mensagens = mensagens.concat(add).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(-100);
    ultimaServidor = mensagens[mensagens.length - 1].id;
    if (chatAberto) { desenharLista(false); marcarLida(); }
  }

  function marcarLida() {
    if (!mensagens.length) return;
    ultimaLida = mensagens[mensagens.length - 1].id;
    gravar(CHAVE_LIDA, ultimaLida);
  }

  function hora(t) {
    const d = new Date(t);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function desenharLista(rolarSempre) {
    if (!lista) return;
    const noFim = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 40;
    lista.innerHTML = '';
    if (!mensagens.length) {
      lista.appendChild(ui.el('p', 'chat-vazio', 'Ninguém falou nada ainda. Manda um oi!'));
      return;
    }
    const eu = apelido(id);
    mensagens.forEach((m) => {
      const d = ui.el('div', 'msg' + (m.autor === eu ? ' minha' : ''));
      const cab = ui.el('div', 'msg-cab');
      const n = document.createElement('b'); n.textContent = m.nome;
      cab.appendChild(n);
      if (m.cidade) { const ci = ui.el('span', 'msg-cidade'); ci.textContent = m.cidade; cab.appendChild(ci); }
      const h = ui.el('time', 'msg-hora'); h.textContent = hora(m.t);
      cab.appendChild(h);
      const t = ui.el('p', 'msg-texto'); t.textContent = m.texto;
      d.appendChild(cab);
      d.appendChild(t);
      lista.appendChild(d);
    });
    if (rolarSempre || noFim) lista.scrollTop = lista.scrollHeight;
  }

  function abrir() {
    CH.som.botao();
    if (!perfil || !perfil.nome) painelPerfil(painelChat);
    else painelChat();
  }

  function iniciar() {
    if (location.protocol === 'file:' || !window.fetch) return;
    id = meuId();
    try { perfil = JSON.parse(ler(CHAVE_PERFIL) || 'null'); } catch (e) { perfil = null; }
    ultimaLida = ler(CHAVE_LIDA);
    $('btn-chat').addEventListener('click', abrir);
    batida();
    timerBatida = setInterval(batida, BATIDA);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { batida(); if (chatAberto) ler1(); } });
  }

  CH.online = { iniciar, abrir };
})(window.CH);
