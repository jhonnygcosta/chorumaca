// Estrutura comum dos minijogos: tela cheia, placar, pausa, resultado e recompensas.
(function (CH) {
  const U = CH.U;
  const E = CH.estado;
  const ui = CH.ui;
  const $ = (id) => document.getElementById(id);

  const registro = {};
  const cv = $('tela-jogo');
  const ctx = cv.getContext('2d');

  const J = {
    ativo: null,
    registrar(nome, def) { registro[nome] = def; },
  };

  let api = null;
  let rodando = false;
  let ultimo = 0;
  let dicaTimer = null;
  let reabrir = null;

  // Mede as margens seguras (notch, ilha e barra de gestos) em px.
  let sonda = null;
  function seguros() {
    if (!sonda) {
      sonda = document.createElement('div');
      sonda.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
        'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
      document.body.appendChild(sonda);
    }
    const cs = getComputedStyle(sonda);
    return { t: parseFloat(cs.paddingTop) || 0, d: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, e: parseFloat(cs.paddingLeft) || 0 };
  }

  function medir() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    if (api) {
      api.W = w; api.H = h; api.dpr = dpr;
      api.u = Math.min(w, h * 0.62) / 100;
      const sg = seguros();
      api.topo = 70 + sg.t;
      api.segE = sg.e; api.segD = sg.d; api.segB = sg.b;
    }
  }

  J.abrir = function (nome) {
    const def = registro[nome];
    if (!def) return;
    CH.som.iniciar();
    J.ativo = nome;
    $('jogo').hidden = false;
    CH.ev.emit('jogoAbriu', nome);
    const choru = CH.choru.criar();
    const r = E.s.roupas;
    choru.pele = r.cor; choru.cabeca = r.cabeca; choru.olhos = r.olhos;
    api = {
      nome, ctx, choru, def,
      W: 0, H: 0, dpr: 1, u: 1, topo: 70,
      pontos: 0, moedas: 0, t: 0, fim: false, pausado: false,
      ponto(n) { api.pontos = Math.max(0, api.pontos + n); $('jogo-pontos').textContent = U.num(api.pontos); },
      info(txt) { $('jogo-info').textContent = txt; $('jogo-info').hidden = !txt; },
      dica(txt, seg = 2.6) {
        const d = $('jogo-dica');
        d.textContent = txt; d.hidden = false;
        clearTimeout(dicaTimer);
        dicaTimer = setTimeout(() => { d.hidden = true; }, seg * 1000);
      },
      falar(txt) {
        const dur = CH.som.falar(txt);
        choru.falarPor(Math.max(0.4, dur));
        api.balao = { txt, ate: api.t + Math.max(1.6, txt.length * 0.06) };
      },
      terminar(extra) { if (!api.fim) { api.fim = true; setTimeout(() => resultado(extra || {}), 700); } },
    };
    medir();
    api.ponto(0);
    api.info('');
    def.iniciar(api);
    CH.som.tocar(def.musica || 'jogo');
    rodando = true;
    ultimo = performance.now();
    requestAnimationFrame(laco);
  };

  function laco(agora) {
    if (!rodando || !api) return;
    const dt = Math.min(0.04, (agora - ultimo) / 1000);
    ultimo = agora;
    if (!api.pausado) {
      api.t += dt;
      api.def.update(api, dt);
      api.choru.update(dt);
    }
    ctx.setTransform(api.dpr, 0, 0, api.dpr, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    api.def.desenhar(api, ctx);
    desenharBalao();
    requestAnimationFrame(laco);
  }

  // Balão de fala desenhado no próprio canvas do jogo.
  function desenharBalao() {
    const b = api.balao;
    if (!b || api.t > b.ate || !api.choru.ultimo) return;
    const p = api.choru.mundo(10, -118);
    const area = api.balaoArea || { x1: 16, x2: api.W - 16 };
    const larguraMax = Math.max(80, area.x2 - area.x1);
    ctx.save();
    const tam = larguraMax < 200 ? 17 : 20;
    ctx.font = tam + 'px "Gochi Hand", cursive';
    // quebra o texto em linhas por palavra
    const linhas = [];
    let atual = '';
    b.txt.split(' ').forEach((pal) => {
      const teste = atual ? atual + ' ' + pal : pal;
      if (atual && ctx.measureText(teste).width + 24 > larguraMax) { linhas.push(atual); atual = pal; } else atual = teste;
    });
    if (atual) linhas.push(atual);
    const lh = tam * 1.05;
    const w = Math.min(larguraMax, Math.max(...linhas.map((l) => ctx.measureText(l).width)) + 24);
    const h = linhas.length * lh + 14;
    const x = U.clamp(p.x, area.x1 + w / 2, area.x2 - w / 2);
    const base = Math.max(api.topo + 14 + h, p.y - 14 - (api.offY || 0));
    ctx.beginPath();
    U.ret(ctx, x - w / 2, base - h, w, h, 14);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    U.tinta(ctx, 3); ctx.stroke();
    ctx.fillStyle = U.TINTA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    linhas.forEach((l, i) => ctx.fillText(l, x, base - h + 7 + lh * (i + 0.5), w - 12));
    ctx.restore();
  }

  function resultado(extra) {
    const s = E.s;
    const nome = api.nome;
    const def = api.def;
    rodando = false;
    const pontos = Math.floor(api.pontos);
    const recordeAntes = s.recordes[nome] || 0;
    const recorde = pontos > recordeAntes;
    if (recorde) s.recordes[nome] = pontos;
    const moedas = Math.floor(def.moedas ? def.moedas(api) : pontos / 10) + (api.moedas || 0);
    const div = Math.round(U.clamp(8 + pontos / (def.divisorDiversao || 20), 8, 35));
    const ef = Object.assign({ diversao: div, energia: -(def.gastoEnergia || 7), fome: -4 }, def.efeitoExtra ? def.efeitoExtra(api) : {}, extra.efeito || {});
    E.efeito(ef);
    if (moedas > 0) E.moedas(moedas);
    E.ganharXP(U.clamp(5 + Math.floor(pontos / 25), 5, 20));
    s.contagem[nome === 'passeio' ? 'passeios' : 'jogos']++;
    E.salvarJa();

    ui.painel(recorde ? 'Recorde!' : 'Fim de jogo', (c) => {
      const r = ui.el('div', 'resultado');
      r.innerHTML =
        '<p>' + (def.rotuloPontos || 'Pontos') + '</p>' +
        '<p class="grande">' + U.num(pontos) + '</p>' +
        '<p>' + (recorde ? (recordeAntes ? 'Aqui é explosão de chorume! O recorde era ' + U.num(recordeAntes) + '.' : 'Primeiro recorde!') : 'Recorde: ' + U.num(recordeAntes)) + '</p>' +
        '<div class="ganhos">' +
        '<span><img alt="" src="' + CH.desenhos.imagem('i_moeda') + '">+' + moedas + '</span>' +
        '<span><img alt="" src="' + CH.desenhos.imagem('i_diversao') + '">+' + ef.diversao + '</span>' +
        '<span><img alt="" src="' + CH.desenhos.imagem('i_energia') + '">' + ef.energia + '</span>' +
        (ef.higiene ? '<span><img alt="" src="' + CH.desenhos.imagem('i_higiene') + '">' + ef.higiene + '</span>' : '') +
        '</div>';
      c.appendChild(r);
      const f = ui.el('div', 'fila');
      const de = ui.el('button', 'botao', 'Jogar de novo');
      de.type = 'button';
      de.disabled = E.s.status.energia < (nome === 'passeio' ? 15 : 10);
      de.onclick = () => { reabrir = nome; ui.fecharPainel(); };
      const vt = ui.el('button', 'botao sec', 'Voltar pra casa');
      vt.type = 'button';
      vt.onclick = () => ui.fecharPainel();
      f.appendChild(de); f.appendChild(vt);
      c.appendChild(f);
      if (de.disabled) c.appendChild(ui.el('p', '', 'A Chorú está cansada. Ponha ela pra dormir no quarto.'));
    }, () => {
      const n = reabrir; reabrir = null;
      if (n) { J.fechar(true); J.abrir(n); } else if (J.ativo) J.fechar();
    });
  }

  J.fechar = function (semVoltar) {
    rodando = false;
    if (api && api.def.sair) api.def.sair(api);
    api = null;
    J.ativo = null;
    $('jogo').hidden = true;
    $('jogo-dica').hidden = true;
    if (!semVoltar) CH.ev.emit('jogoFechou');
  };

  // Entrada: repassa toques e teclas ao jogo ativo.
  function repassar(tipo) {
    return (e) => {
      if (!api || api.fim || api.pausado) return;
      const f = api.def[tipo];
      if (f) f(api, e.clientX, e.clientY, e);
    };
  }
  cv.addEventListener('pointerdown', (e) => {
    try { cv.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
    repassar('apertar')(e);
  });
  cv.addEventListener('pointermove', repassar('mover'));
  cv.addEventListener('pointerup', repassar('soltar'));
  cv.addEventListener('pointercancel', repassar('soltar'));
  document.addEventListener('keydown', (e) => {
    if (!api || api.fim) return;
    if (api.def.tecla) api.def.tecla(api, e.key, true, e);
  });
  document.addEventListener('keyup', (e) => {
    if (!api || api.fim) return;
    if (api.def.tecla) api.def.tecla(api, e.key, false, e);
  });

  $('jogo-sair').addEventListener('click', () => {
    if (!api) return;
    CH.som.botao();
    if (api.fim) return;
    const conta = typeof api.def.saidaConta === 'function' ? api.def.saidaConta(api) : api.def.saidaConta;
    if (conta) api.terminar();
    else { J.fechar(); }
  });

  window.addEventListener('resize', () => { if (api) { medir(); if (api.def.redimensionar) api.def.redimensionar(api); } });
  // Ao perder o foco ou ir pro fundo, solta teclas e dedos segurados (o "soltar" se perde).
  function soltarTudo() { if (api && api.def.soltarTudo) api.def.soltarTudo(api); }
  window.addEventListener('blur', soltarTudo);
  document.addEventListener('visibilitychange', () => {
    if (api) {
      api.pausado = document.hidden;
      if (document.hidden) soltarTudo();
      else if (!api.fim) CH.som.tocar(api.def.musica || 'jogo', true);
    }
    ultimo = performance.now();
  });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());

  // Fundo em espiral rosa, como a capa da campanha.
  J.espiral = function (c, W, H, t, cx, cy, cores = ['#FFE7EB', '#F7A6B5']) {
    c.fillStyle = cores[0];
    c.fillRect(0, 0, W, H);
    const R = Math.hypot(W, H);
    c.fillStyle = cores[1];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + t * 0.15;
      c.beginPath();
      c.moveTo(cx, cy);
      for (let r = 0; r <= R; r += 40) c.lineTo(cx + Math.cos(a + r * 0.0016) * r, cy + Math.sin(a + r * 0.0016) * r);
      for (let r = R; r >= 0; r -= 40) c.lineTo(cx + Math.cos(a + 0.32 + r * 0.0016) * r, cy + Math.sin(a + 0.32 + r * 0.0016) * r);
      c.closePath();
      c.fill();
    }
  };

  J.coracoes = function (c, x, y, n, max, tam = 22) {
    for (let i = 0; i < max; i++) {
      const cx = x - i * (tam + 6);
      c.save();
      c.translate(cx, y);
      c.scale(tam / 20, tam / 20);
      c.beginPath();
      c.moveTo(0, 8); c.bezierCurveTo(-14, -2, -8, -14, 0, -6); c.bezierCurveTo(8, -14, 14, -2, 0, 8);
      c.fillStyle = i < n ? '#F24B64' : '#E3DDD8'; c.fill();
      U.tinta(c, 2.4); c.stroke();
      c.restore();
    }
  };

  CH.jogos = J;
})(window.CH);
