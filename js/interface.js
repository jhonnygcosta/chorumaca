// Interface em HTML por cima do canvas: status, faixa, botões, gaveta, painéis, balão e avisos.
(function (CH) {
  const U = CH.U;
  const $ = (id) => document.getElementById(id);
  const img = (id, tam) => CH.desenhos.imagem(id, tam);

  const STATUS = [
    { k: 'fome', rotulo: 'Fome', icone: 'i_fome', comodo: 'cozinha' },
    { k: 'higiene', rotulo: 'Banho', icone: 'i_higiene', comodo: 'banheiro' },
    { k: 'energia', rotulo: 'Energia', icone: 'i_energia', comodo: 'quarto' },
    { k: 'diversao', rotulo: 'Diversão', icone: 'i_diversao', comodo: 'sala' },
    { k: 'saude', rotulo: 'Saúde', icone: 'i_saude', comodo: 'banheiro' },
  ];
  const CIRC = 2 * Math.PI * 22.5;
  const CIRC_XP = 2 * Math.PI * 18;

  const ui = {};

  ui.montar = function () {
    $('ic-moeda').src = img('i_moeda');
    $('ic-config').src = img('engrenagem');
    $('ic-sair').src = img('fechar');
    $('painel-fechar').style.backgroundImage = 'url(' + img('fechar') + ')';
    $('painel-fechar').style.backgroundColor = 'var(--rosa)';

    const box = $('status');
    STATUS.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'stat';
      b.dataset.k = s.k;
      b.setAttribute('aria-label', s.rotulo);
      b.innerHTML =
        '<div class="bola"><svg viewBox="0 0 52 52" aria-hidden="true">' +
        '<circle cx="26" cy="26" r="22.5" class="trilha-anel"></circle>' +
        '<circle cx="26" cy="26" r="22.5" class="valor-anel" stroke-dasharray="' + CIRC + '" stroke-dashoffset="0"></circle>' +
        '</svg><img alt="" src="' + img(s.icone) + '"></div><span>' + s.rotulo + '</span>';
      b.addEventListener('click', () => CH.ev.emit('statusToque', s));
      box.appendChild(b);
    });
    $('anel-xp').setAttribute('stroke-dasharray', CIRC_XP);

    $('painel-fechar').addEventListener('click', () => ui.fecharPainel());
    $('painel').addEventListener('pointerdown', (e) => {
      if (e.target === $('painel')) ui.fecharPainel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('painel').hidden) ui.fecharPainel();
    });
  };

  ui.atualizar = function () {
    const s = CH.estado.s;
    $('txt-moedas').textContent = U.num(s.moedas);
    $('txt-nivel').textContent = s.nivel;
    $('txt-estagio').textContent = CH.estado.estagio().nome;
    const frac = U.clamp(s.xp / CH.estado.xpProximo(), 0, 1);
    $('anel-xp').setAttribute('stroke-dashoffset', CIRC_XP * (1 - frac));
    $('nivel').setAttribute('aria-label', 'Nível ' + s.nivel + ', ' + Math.floor(frac * 100) + '% para o próximo');
    document.querySelectorAll('.stat').forEach((el) => {
      const v = s.status[el.dataset.k];
      const anel = el.querySelector('.valor-anel');
      anel.setAttribute('stroke-dashoffset', CIRC * (1 - v / 100));
      const carregando = el.dataset.k === 'energia' && s.dormindo;
      el.classList.toggle('alerta', v < 50 && v >= 25 && !carregando);
      el.classList.toggle('critico', v < 25 && !carregando);
      el.setAttribute('aria-label', STATUS.find((x) => x.k === el.dataset.k).rotulo + ' ' + Math.round(v) + '%' + (carregando ? ', carregando' : ''));
      if (el.dataset.k === 'energia') carregar(el, carregando);
    });
  };

  // Energia com a Chorú dormindo: vira uma bateria no carregador, enchendo em animação.
  let bateriaTimer = null;
  function carregar(el, sim) {
    if (sim === el.classList.contains('carregando')) return;
    el.classList.toggle('carregando', sim);
    const icone = el.querySelector('img');
    const rotulo = el.querySelector('span');
    clearInterval(bateriaTimer);
    bateriaTimer = null;
    if (sim) {
      rotulo.textContent = 'Carregando';
      let q = 0;
      const quadro = () => { q = (q % 3) + 1; icone.src = img('bateria' + q); };
      quadro();
      bateriaTimer = setInterval(quadro, 450);
    } else {
      rotulo.textContent = 'Energia';
      icone.src = img('i_energia');
    }
  }

  ui.STATUS = STATUS;

  // Faixa listrada com o nome do cômodo, no estilo das faixas da campanha.
  ui.faixa = function (nome) {
    const f = $('faixa');
    f.innerHTML =
      '<svg viewBox="0 0 300 84" role="img" aria-label="' + nome + '">' +
      '<defs><pattern id="listras" patternUnits="userSpaceOnUse" width="28" height="28" patternTransform="rotate(32)">' +
      '<rect width="28" height="28" fill="#E7F2FF"></rect><rect width="7" height="28" fill="#E8E59A"></rect></pattern></defs>' +
      '<path d="M34 30 L4 30 L16 46 L4 64 L40 64 Z" fill="#BBCCE2" stroke="#272322" stroke-width="3.5" stroke-linejoin="round"></path>' +
      '<path d="M266 30 L296 30 L284 46 L296 64 L260 64 Z" fill="#BBCCE2" stroke="#272322" stroke-width="3.5" stroke-linejoin="round"></path>' +
      '<path d="M22 16 Q150 0 278 16 L278 62 Q150 46 22 62 Z" fill="url(#listras)" stroke="#272322" stroke-width="4" stroke-linejoin="round"></path>' +
      '<text x="150" y="42" text-anchor="middle">' + nome + '</text>' +
      '</svg>';
    f.classList.remove('entra');
    void f.offsetWidth;
    f.classList.add('entra');
  };

  // Botões de ação do cômodo.
  ui.acoes = function (lista) {
    const nav = $('acoes');
    nav.innerHTML = '';
    lista.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'acao' + (a.classe ? ' ' + a.classe : '');
      b.dataset.id = a.id;
      b.innerHTML = '<div class="bola"><img alt="" src="' + img(a.icone) + '"></div><span>' + a.rotulo + '</span>';
      if (a.toque) b.addEventListener('click', (e) => { CH.som.botao(); a.toque(e, b); });
      if (a.segurar) {
        const fim = () => { b.classList.remove('apertado'); a.soltar && a.soltar(); };
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          try { b.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
          b.classList.add('apertado');
          a.segurar(e, b);
        });
        b.addEventListener('pointerup', fim);
        b.addEventListener('pointercancel', fim);
        b.addEventListener('lostpointercapture', () => { if (b.classList.contains('apertado')) fim(); });
        b.addEventListener('contextmenu', (e) => e.preventDefault());
      }
      if (a.arrastar) {
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); a.arrastar(e, b); });
      }
      nav.appendChild(b);
    });
  };

  ui.acao = function (id) {
    return document.querySelector('.acao[data-id="' + id + '"]');
  };

  // ---------- gaveta ----------

  let aoPegar = null;
  ui.gaveta = {
    aberta: false,
    abrir(titulo, itens, pegar, aoLoja) {
      aoPegar = pegar;
      $('gaveta-titulo').textContent = titulo;
      const loja = $('gaveta-loja');
      loja.hidden = !aoLoja;
      loja.onclick = aoLoja || null;
      this.preencher(itens);
      $('gaveta').hidden = false;
      $('app').classList.add('com-gaveta');
      this.aberta = true;
    },
    preencher(itens) {
      const tr = $('trilho');
      tr.innerHTML = '';
      if (!itens.length) {
        tr.innerHTML = '<div class="vazio">Geladeira vazia. Toque em "Comprar mais".</div>';
        return;
      }
      itens.forEach((it) => {
        const d = document.createElement('div');
        d.className = 'item';
        d.dataset.id = it.id;
        d.innerHTML = '<img alt="" src="' + img(it.id) + '"><span>' + it.nome + '</span>' + (it.qtd > 1 ? '<b>' + it.qtd + '</b>' : '');
        let ini = null;
        d.addEventListener('pointerdown', (e) => { ini = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
        d.addEventListener('pointermove', (e) => {
          if (!ini || e.pointerId !== ini.id) return;
          const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
          if (dy < -10 && Math.abs(dy) > Math.abs(dx)) {
            ini = null;
            aoPegar && aoPegar(it.id, e);
          }
        });
        d.addEventListener('pointerup', () => { ini = null; });
        // toque simples também funciona: come direto
        d.addEventListener('click', () => { aoPegar && aoPegar(it.id, null); });
        tr.appendChild(d);
      });
    },
    fechar() {
      $('gaveta').hidden = true;
      $('app').classList.remove('com-gaveta');
      this.aberta = false;
    },
  };

  // ---------- item arrastado ----------

  ui.arrasto = {
    mostrar(id) {
      const a = $('arrasto');
      a.querySelector('img').src = img(id, 128);
      a.hidden = false;
    },
    mover(x, y) {
      const a = $('arrasto');
      a.style.left = x + 'px';
      a.style.top = y + 'px';
    },
    esconder() { $('arrasto').hidden = true; },
  };

  // ---------- painel ----------

  let aoFechar = null;
  ui.painel = function (titulo, montar, fechar) {
    $('painel-titulo').textContent = titulo;
    const corpo = $('painel-corpo');
    corpo.innerHTML = '';
    corpo.scrollTop = 0;
    aoFechar = fechar || null;
    montar(corpo);
    $('painel').hidden = false;
    CH.som.abrir();
  };
  ui.painelAberto = () => !$('painel').hidden;
  ui.fecharPainel = function () {
    if ($('painel').hidden) return;
    $('painel').hidden = true;
    CH.som.fechar();
    const f = aoFechar; aoFechar = null;
    f && f();
  };
  ui.tituloPainel = (t) => { $('painel-titulo').textContent = t; };

  // ---------- balão de fala ----------

  let balaoAte = 0;
  ui.balao = function (texto, seg = 2.6) {
    const b = $('balao');
    b.textContent = texto;
    b.hidden = false;
    b.style.animation = 'none';
    void b.offsetWidth;
    b.style.animation = '';
    balaoAte = performance.now() + seg * 1000;
  };
  ui.posBalao = function (x, y) {
    const b = $('balao');
    if (b.hidden) return;
    if (performance.now() > balaoAte) { b.hidden = true; return; }
    const w = b.offsetWidth;
    const min = 16 + w / 2, max = window.innerWidth - 16 - w / 2;
    b.style.left = U.clamp(x, min, Math.max(min, max)) + 'px';
    b.style.top = Math.max(y, b.offsetHeight + 8) + 'px';
  };
  ui.esconderBalao = function () { $('balao').hidden = true; };

  // ---------- avisos ----------

  ui.toast = function (texto, icone) {
    const t = document.createElement('div');
    t.className = 'aviso';
    if (icone) {
      const i = document.createElement('img');
      i.src = img(icone); i.alt = '';
      t.appendChild(i);
    }
    const s = document.createElement('span');
    s.textContent = texto;
    t.appendChild(s);
    $('toast').appendChild(t);
    setTimeout(() => t.remove(), 2700);
  };

  // Mostra ou esconde a interface da casa (durante minijogos e na abertura).
  ui.casaVisivel = function (sim) {
    ['hud', 'faixa', 'seta-esq', 'seta-dir', 'acoes'].forEach((id) => { $(id).hidden = !sim; });
    if (!sim) { ui.gaveta.fechar(); ui.esconderBalao(); }
  };

  // Elementos reutilizáveis dos painéis.
  ui.el = function (tag, classe, html) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (html != null) e.innerHTML = html;
    return e;
  };
  ui.preco = function (valor, desabilitado) {
    const b = ui.el('button', 'preco', '<img alt="" src="' + img('i_moeda') + '">' + U.num(valor));
    b.type = 'button';
    if (desabilitado) b.disabled = true;
    return b;
  };
  ui.efeitoTexto = function (ef) {
    if (!ef) return '';
    const nomes = { fome: 'fome', diversao: 'diversão', energia: 'energia', saude: 'saúde', higiene: 'banho' };
    return Object.keys(ef).map((k) => (ef[k] > 0 ? '+' : '') + ef[k] + ' ' + nomes[k]).join(' · ');
  };

  CH.ui = ui;
})(window.CH);
