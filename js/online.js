// Pessoas online e chat do jogo.
// Funciona no site do Netlify (Funções + Netlify Blobs) e no servidor do notebook (memória).
// Se o servidor não tiver o chat (por exemplo, abrindo o index.html direto), o botão some.
(function (CH) {
  const ui = CH.ui;
  const $ = (id) => document.getElementById(id);
  const CHAVE_ID = 'chorumaca-id';
  const CHAVE_PERFIL = 'chorumaca-perfil';
  const CHAVE_LIDA = 'chorumaca-chat-lida';
  const CHAVE_MINHAS = 'chorumaca-chat-minhas';
  const BATIDA = 20000;
  const MAX_MSGS = 100;

  let id = null;
  let perfil = null;          // { nome, cidade }
  let ligado = false;         // o servidor respondeu
  let ultimaServidor = null;  // chave da mensagem mais nova no servidor
  let ultimaLida = null;
  let chatAberto = false;
  let mensagens = [];
  let lista = null;
  let cursor = '';            // até onde a leitura já foi (só avança com o que veio da leitura)
  let minhas = new Set();     // ids das mensagens que este aparelho mandou
  let timerLeitura = null;
  let vazias = 0;             // leituras seguidas sem novidade (espaça as próximas)

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

  async function chamar(caminho, opcoes) {
    let r;
    try {
      r = await fetch('/api' + caminho, Object.assign({ cache: 'no-store', headers: { 'Content-Type': 'application/json' } }, opcoes));
    } catch (e) {
      throw new Error('Sem conexão com o servidor. Tente de novo.');
    }
    let dados = null;
    try { dados = await r.json(); } catch (e) { dados = null; }
    if (!r.ok) {
      const erro = new Error((dados && dados.erro) || (r.status === 429 ? 'Calma! Espere um pouquinho antes de mandar outra.' : 'O servidor não respondeu. Tente de novo.'));
      erro.status = r.status;
      throw erro;
    }
    return dados || {};
  }

  // ---------- presença ----------

  async function batida() {
    // com o chat aberto, a própria leitura já conta a pessoa como online
    if (document.hidden || chatAberto) return;
    try {
      const d = await chamar('/presenca', { method: 'POST', body: JSON.stringify({ id }) });
      ligado = true;
      ultimaServidor = d.ultima || ultimaServidor;
      atualizarBotao(d.online);
    } catch (e) {
      if (!ligado) $('btn-chat').hidden = true;
    }
  }

  function atualizarBotao(n) {
    const b = $('btn-chat');
    b.hidden = false;
    if (typeof n === 'number') {
      $('txt-online').textContent = n + ' online';
      b.setAttribute('aria-label', 'Chat, ' + n + (n === 1 ? ' pessoa online' : ' pessoas online'));
    }
    const naoLida = !chatAberto && ultimaServidor && (!ultimaLida || ultimaServidor > ultimaLida);
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
          const cidade = String(d.city || d.locality || d.principalSubdivision || '').slice(0, 30);
          if (!cidade) { falha(new Error('Não deu pra descobrir a cidade.')); return; }
          const uf = d.countryCode === 'BR' && d.principalSubdivisionCode ? String(d.principalSubdivisionCode).split('-')[1] : '';
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

  // corta sem quebrar emoji ao meio
  const cortar = (txt, max) => Array.from(String(txt).replace(/\s+/g, ' ').trim()).slice(0, max).join('');

  // ---------- telas ----------

  function painelPerfil(depois) {
    const atual = perfil || { nome: '', cidade: '' };
    let cidade = atual.cidade || '';
    ui.painel('Seu nome no chat', (c) => {
      c.appendChild(ui.el('p', '', 'Escolha como você vai aparecer no chat. Seu nome e sua cidade ficam visíveis pra todo mundo que estiver jogando.'));
      const l = ui.el('label', 'campo', '<span>Seu nome</span>');
      l.setAttribute('for', 'chat-nome');
      const inp = document.createElement('input');
      inp.id = 'chat-nome'; inp.type = 'text'; inp.maxLength = 40; inp.autocomplete = 'nickname';
      inp.placeholder = 'Ex.: Fã da Chorú';
      inp.value = atual.nome || '';
      l.appendChild(inp);
      c.appendChild(l);

      const cid = ui.el('div', 'campo', '<span>Sua cidade</span>');
      const mostra = ui.el('p', 'cidade-atual');
      mostra.textContent = cidade || 'Ainda não definida';
      cid.appendChild(mostra);
      const loc = ui.el('button', 'botao verde', 'Usar minha localização');
      loc.type = 'button';
      cid.appendChild(loc);
      cid.appendChild(ui.el('p', 'nota', 'A localização do celular é usada só pra descobrir a cidade. A posição exata não vai pro chat.'));
      c.appendChild(cid);

      const aviso = ui.el('p', 'aviso-form', '');
      aviso.setAttribute('aria-live', 'polite');
      const f = ui.el('div', 'fila');
      const ok = ui.el('button', 'botao', 'Entrar no chat');
      ok.type = 'button';

      loc.onclick = async () => {
        loc.disabled = true;
        ok.disabled = true;
        aviso.textContent = 'Procurando sua cidade...';
        try {
          cidade = await pedirCidade();
          mostra.textContent = cidade;
          aviso.textContent = '';
        } catch (e) {
          aviso.textContent = e.message;
        } finally {
          loc.disabled = false;
          ok.disabled = false;
        }
      };
      ok.onclick = () => {
        const nome = cortar(inp.value, 20);
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
      trocar.onclick = () => {
        chatAberto = false;
        lista = null;
        pararLeitura();
        painelPerfil(painelChat);
      };
      topo.appendChild(quem);
      topo.appendChild(trocar);
      c.appendChild(topo);

      lista = ui.el('div', 'chat-lista');
      lista.setAttribute('role', 'log');
      lista.setAttribute('aria-live', 'polite');
      c.appendChild(lista);
      desenharLista();

      const form = ui.el('form', 'chat-form');
      const inp = document.createElement('input');
      inp.id = 'chat-texto'; inp.type = 'text'; inp.maxLength = 300; inp.autocomplete = 'off';
      inp.placeholder = 'Escreva uma mensagem';
      inp.setAttribute('aria-label', 'Mensagem');
      const env = ui.el('button', 'botao', 'Enviar');
      env.type = 'submit';
      const aviso = ui.el('p', 'aviso-form', '');
      aviso.setAttribute('aria-live', 'polite');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const texto = cortar(inp.value, 200);
        if (!texto || env.disabled) return;
        env.disabled = true;
        try {
          const d = await chamar('/chat', { method: 'POST', body: JSON.stringify({ id, nome: perfil.nome, cidade: perfil.cidade, texto }) });
          inp.value = '';
          aviso.textContent = '';
          if (d.mensagem) {
            minhas.add(d.mensagem.id);
            gravar(CHAVE_MINHAS, JSON.stringify([...minhas].slice(-MAX_MSGS)));
            receber([d.mensagem]);
          }
          if (lista) lista.scrollTop = lista.scrollHeight;
          CH.som.toque();
          // busca na hora o que os outros mandaram enquanto isso
          vazias = 0;
          agendarLeitura(0);
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
      batida();
    });
    // o painel já está visível aqui: dá pra rolar até o fim
    if (lista) lista.scrollTop = lista.scrollHeight;
    vazias = 0;
    agendarLeitura(0);
  }

  // ---------- leitura (só com o chat aberto) ----------

  function pararLeitura() {
    clearTimeout(timerLeitura);
    timerLeitura = null;
  }

  // 3 s enquanto tem conversa; vai espaçando até 15 s quando ninguém fala
  function proximoIntervalo() {
    if (vazias < 3) return 3000;
    if (vazias < 6) return 6000;
    if (vazias < 9) return 10000;
    return 15000;
  }

  function agendarLeitura(espera) {
    pararLeitura();
    timerLeitura = setTimeout(async () => {
      if (!chatAberto || !lista || !lista.isConnected) { chatAberto = false; pararLeitura(); return; }
      if (!document.hidden) await ler1();
      if (chatAberto) agendarLeitura(proximoIntervalo());
    }, espera);
  }

  async function ler1() {
    const q = '?id=' + encodeURIComponent(id) + (cursor ? '&depois=' + encodeURIComponent(cursor) : '');
    try {
      const d = await chamar('/chat' + q, { method: 'GET' });
      const ms = d.mensagens || [];
      for (const m of ms) if (m && m.id > cursor) cursor = m.id;
      if (typeof d.online === 'number') atualizarBotao(d.online);
      const antes = mensagens.length;
      receber(ms);
      vazias = mensagens.length > antes ? 0 : vazias + 1;
    } catch (e) {
      vazias++;
    }
  }

  function receber(novas) {
    const vistas = new Set(mensagens.map((m) => m.id));
    const add = novas.filter((m) => m && m.id && !vistas.has(m.id));
    if (!add.length) return;
    mensagens = mensagens.concat(add).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(-MAX_MSGS);
    const ultima = mensagens[mensagens.length - 1].id;
    if (!ultimaServidor || ultima > ultimaServidor) ultimaServidor = ultima;
    if (chatAberto && lista && lista.isConnected) {
      anexar(add);
      marcarLida();
    }
  }

  function marcarLida() {
    if (!mensagens.length) return;
    const ultima = mensagens[mensagens.length - 1].id;
    if (!ultimaLida || ultima > ultimaLida) {
      ultimaLida = ultima;
      gravar(CHAVE_LIDA, ultimaLida);
    }
  }

  function hora(t) {
    const d = new Date(t);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function noMsg(m) {
    const d = ui.el('div', 'msg' + (minhas.has(m.id) ? ' minha' : ''));
    d.dataset.id = m.id;
    const cab = ui.el('div', 'msg-cab');
    const n = document.createElement('b'); n.textContent = m.nome;
    cab.appendChild(n);
    if (m.cidade) { const ci = ui.el('span', 'msg-cidade'); ci.textContent = m.cidade; cab.appendChild(ci); }
    const h = ui.el('time', 'msg-hora'); h.textContent = hora(m.t);
    cab.appendChild(h);
    const t = ui.el('p', 'msg-texto'); t.textContent = m.texto;
    d.appendChild(cab);
    d.appendChild(t);
    return d;
  }

  // Desenha a lista inteira (só ao abrir o chat).
  function desenharLista() {
    if (!lista) return;
    lista.innerHTML = '';
    if (!mensagens.length) {
      lista.appendChild(ui.el('p', 'chat-vazio', 'Ninguém falou nada ainda. Manda um oi!'));
      return;
    }
    mensagens.forEach((m) => lista.appendChild(noMsg(m)));
  }

  // Acrescenta só as mensagens novas, na ordem certa, sem redesenhar as outras.
  function anexar(add) {
    if (!lista) return;
    const noFim = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 40;
    const vazio = lista.querySelector('.chat-vazio');
    if (vazio) vazio.remove();
    add.slice().sort((a, b) => (a.id < b.id ? -1 : 1)).forEach((m) => {
      const no = noMsg(m);
      const depoisDela = Array.from(lista.children).find((el) => el.dataset.id > m.id);
      lista.insertBefore(no, depoisDela || null);
    });
    while (lista.children.length > MAX_MSGS) lista.removeChild(lista.firstChild);
    if (noFim) lista.scrollTop = lista.scrollHeight;
  }

  function abrir() {
    CH.som.botao();
    if (!perfil || !perfil.nome) painelPerfil(painelChat);
    else painelChat();
  }

  function iniciar() {
    if (id) return;
    if (location.protocol === 'file:' || !window.fetch) return;
    id = meuId();
    try { perfil = JSON.parse(ler(CHAVE_PERFIL) || 'null'); } catch (e) { perfil = null; }
    try { minhas = new Set(JSON.parse(ler(CHAVE_MINHAS) || '[]')); } catch (e) { minhas = new Set(); }
    ultimaLida = ler(CHAVE_LIDA);
    $('btn-chat').addEventListener('click', abrir);
    batida();
    setInterval(batida, BATIDA);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      batida();
      if (chatAberto) { vazias = 0; agendarLeitura(0); }
    });
  }

  CH.online = { iniciar, abrir };
})(window.CH);
