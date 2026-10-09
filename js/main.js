// Liga tudo: tela, laço do jogo, toques, troca de cômodos e humor da Chorú.
(function (CH) {
  const U = CH.U;
  const E = CH.estado;
  const D = CH.dados;
  const ui = CH.ui;
  const $ = (id) => document.getElementById(id);

  const cv = $('palco');
  const ctx = cv.getContext('2d');

  const G = {
    choru: null,
    L: null,
    s: 1,
    dpr: 1,
    t: 0,
    emCasa: false,
    transicao: null,      // { de, para, dir, t }
    expTemp: null,        // { nome, ate }
    parts: [],
    ultimoAviso: 0,
    carinho: 0,
    cooldownToque: 0,
  };

  // ---------- layout responsivo ----------

  // A "câmera" da casa: o mundo tem pelo menos LARGURA_CENA unidades de largura, pra o
  // cômodo inteiro caber na tela em pé, e a Chorumaçã adulta ocupa uns 80% da altura livre
  // entre a faixa do cômodo e os botões (no celular deitado, os botões vão pra direita).
  const LARGURA_CENA = 680;
  const ALTURA_ADULTA = 236 * 1.4;

  function layout() {
    const w = window.innerWidth, h = window.innerHeight;
    G.dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * G.dpr);
    cv.height = Math.round(h * G.dpr);
    const acoesEl = $('acoes');
    const coluna = getComputedStyle(acoesEl).flexDirection === 'column';
    const acoes = acoesEl.getBoundingClientRect();
    const faixa = $('faixa').getBoundingClientRect();
    const altAcoes = coluna ? 0 : (acoes.height > 10 ? h - acoes.top : 110);
    const larguraColuna = coluna && acoes.width > 10 ? Math.max(0, w - acoes.left) : 0;
    const topoLivre = faixa.bottom > 10 ? faixa.bottom + 6 : 200;
    const baseCss = h - altAcoes - (coluna ? Math.max(14, h * 0.04) : Math.max(44, h * 0.075));
    const disponivel = Math.max(80, baseCss - topoLivre);
    const s = Math.max(0.2, Math.min((disponivel * 0.8) / ALTURA_ADULTA, (w - larguraColuna) / LARGURA_CENA, 1));
    G.s = s;
    const W = w / s, H = h / s;
    G.L = {
      W, H,
      cx: (w - larguraColuna) / 2 / s,
      base: baseCss / s,
      chao: baseCss / s - 120,
      kMax: 1.4,
    };
  }

  G.k = () => G.L.kMax * E.crescimento();
  G.paraMundo = (x, y) => ({ x: x / G.s, y: y / G.s });

  // ---------- Chorú: humor, falas e roupas ----------

  G.expressao = function (nome, seg = 1.5) {
    G.expTemp = nome ? { nome, ate: G.t + seg } : null;
  };

  G.falar = function (texto, seg) {
    const dur = CH.som.falar(texto);
    G.choru.falarPor(Math.max(0.4, dur));
    ui.balao(texto, seg || Math.max(2.2, texto.length * 0.07));
  };

  G.aplicarRoupas = function () {
    const r = E.s.roupas;
    G.choru.pele = r.cor;
    G.choru.cabeca = r.cabeca;
    G.choru.olhos = r.olhos;
  };

  function humorBase() {
    const s = E.s;
    const ch = G.choru;
    ch.tremor = s.apertada > 0 ? 1 : 0;
    ch.suor = s.apertada > 0 || s.status.saude < 30;
    ch.sujeira = U.clamp((72 - s.status.higiene) / 72, 0, 1);
    ch.mosquinhas = s.status.higiene < 20;
    ch.doente = U.aproximar(ch.doente, s.status.saude < 30 ? 1 : 0, 2, 1 / 60);
    if (s.dormindo) return 'dormindo';
    if (G.expTemp && G.t < G.expTemp.ate) return G.expTemp.nome;
    const n = E.necessidade();
    if (n === 'apertada') return 'apertada';
    if (n === 'doente') return 'doente';
    if (n === 'fome') return 'fome';
    if (n === 'energia') return 'sono';
    if (n === 'higiene' || n === 'diversao') return 'triste';
    return 'deboche';
  }

  function avisosPeriodicos() {
    const s = E.s;
    if (s.dormindo || !G.emCasa || ui.painelAberto()) return;
    if (G.t - G.ultimoAviso < 28) return;
    const n = E.necessidade();
    if (!n) return;
    G.ultimoAviso = G.t;
    const fala = { fome: D.falas.fome, higiene: D.falas.suja, energia: D.falas.sono, diversao: D.falas.tedio, doente: D.falas.doente, apertada: D.falas.apertada }[n];
    if (fala) G.falar(fala);
  }

  // ---------- partículas ----------

  G.particulas = function (tipo, n, x, y) {
    const ch = G.choru;
    const k = G.k();
    let px = x, py = y;
    if (px == null) {
      if (tipo === 'farelo') { const b = ch.bocaMundo(); px = b.x; py = b.y; }
      else { const c = ch.mundo(0, -20); px = c.x; py = c.y; }
    }
    for (let i = 0; i < n; i++) {
      const a = U.rnd(0, Math.PI * 2);
      const v = tipo === 'farelo' ? U.rnd(60, 160) : U.rnd(80, 220);
      G.parts.push({
        tipo, x: px + U.rnd(-10, 10) * k, y: py + U.rnd(-10, 10) * k,
        vx: Math.cos(a) * v, vy: tipo === 'farelo' ? U.rnd(-60, 40) : Math.sin(a) * v - 120,
        vida: 0, dur: tipo === 'puf' ? 0.6 : U.rnd(0.7, 1.2), r: U.rnd(0.6, 1.2), rot: U.rnd(0, 6),
      });
    }
  };

  function atualizarParticulas(dt) {
    G.parts.forEach((p) => {
      p.vida += dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.tipo === 'farelo') p.vy += 900 * dt;
      else if (p.tipo === 'puf') { p.vx *= 0.9; p.vy *= 0.9; }
      else p.vy += 160 * dt;
      p.rot += dt * 3;
    });
    G.parts = G.parts.filter((p) => p.vida < p.dur);
  }

  function desenharParticulas(c) {
    G.parts.forEach((p) => {
      const f = 1 - p.vida / p.dur;
      c.save();
      c.globalAlpha = Math.min(1, f * 1.6);
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      if (p.tipo === 'farelo') {
        c.fillStyle = '#D99A3E'; c.fillRect(-4, -3, 8, 6);
      } else if (p.tipo === 'coracao') {
        c.scale(p.r * 1.4, p.r * 1.4);
        c.beginPath();
        c.moveTo(0, 8); c.bezierCurveTo(-14, -2, -8, -14, 0, -6); c.bezierCurveTo(8, -14, 14, -2, 0, 8);
        c.fillStyle = '#F24B64'; c.fill(); U.tinta(c, 2.4); c.stroke();
      } else if (p.tipo === 'brilho' || p.tipo === 'estrela') {
        CH.choru.estrela(c, 0, 0, 12 * p.r, p.tipo === 'estrela' ? '#FFCB6E' : '#FFFFFF');
      } else if (p.tipo === 'puf') {
        c.beginPath(); c.arc(0, 0, 14 * p.r * (1.5 - f * 0.5), 0, Math.PI * 2);
        c.fillStyle = '#F4F1EC'; c.fill(); U.tinta(c, 2.4); c.stroke();
      } else if (p.tipo === 'moeda') {
        CH.desenhos.desenhar(c, 'i_moeda', 0, 0, 34);
      }
      c.restore();
    });
  }

  // ---------- cômodos ----------

  const ordem = D.comodos.map((c) => c.id);

  function irPara(id, dir) {
    const de = E.s.comodo;
    if (id === de) return;
    CH.comodos.sair(de);
    E.s.comodo = id;
    E.salvar();
    G.transicao = { de, para: id, dir: dir || (ordem.indexOf(id) > ordem.indexOf(de) ? 1 : -1), t: 0 };
    entrarComodo(id);
  }

  function entrarComodo(id) {
    ui.faixa(D.comodos.find((c) => c.id === id).nome);
    CH.comodos.entrar(id);
    CH.som.tocar(id);
    if (id === 'quarto' && E.s.dormindo) CH.som.volumeTrilha(0.45);
    requestAnimationFrame(layout);
  }

  function passo(delta) {
    const i = ordem.indexOf(E.s.comodo);
    const n = (i + delta + ordem.length) % ordem.length;
    CH.som.toque();
    irPara(ordem[n], delta);
  }

  G.irPara = irPara;

  // ---------- desenho ----------

  function posChoru() {
    const L = G.L;
    const st = CH.comodos.st;
    if (st.vaso > 0 && E.s.comodo === 'banheiro') {
      const p = CH.cenarios.C.banheiro.pos(L).vaso;
      return { x: p.x + p.w / 2, y: p.y + 108, k: G.k() * 0.72 };
    }
    return { x: L.cx, y: L.base - G.subida, k: G.k() };
  }

  // Quando a gaveta da geladeira abre, a Chorú sobe pra boca ficar à vista.
  G.subida = 0;
  function atualizarSubida(dt) {
    let alvo = 0;
    if (ui.gaveta.aberta) {
      const topo = $('gaveta').getBoundingClientRect().top / G.s;
      const boca = G.L.base - (85 - 26) * G.k();
      alvo = Math.max(0, boca + 70 - topo);
    }
    G.subida = U.aproximar(G.subida, alvo, 10, dt);
  }

  function desenharComodo(id, off, t) {
    const L = G.L;
    const fundo = CH.cenarios.fundo(id, L, G.s, G.dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(fundo, Math.round(off * G.s * G.dpr), 0);
    ctx.setTransform(G.s * G.dpr, 0, 0, G.s * G.dpr, off * G.s * G.dpr, 0);
    const sala = CH.cenarios.C[id];
    if (sala.vivo) sala.vivo(ctx, L, t, {
      cozinhando: CH.comodos.st.cozinhando > 0,
      chuveiro: CH.comodos.st.chuveiro,
      descarga: CH.comodos.st.descarga,
      luzApagada: E.s.dormindo,
    });
  }

  function desenhar() {
    const L = G.L;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const atual = E.s.comodo;
    const tr = G.transicao;
    if (tr) {
      const e = U.ease.inOutSine(Math.min(1, tr.t));
      desenharComodo(tr.de, -tr.dir * L.W * e, G.t);
      desenharComodo(tr.para, tr.dir * L.W * (1 - e), G.t);
    } else {
      desenharComodo(atual, 0, G.t);
    }
    ctx.setTransform(G.s * G.dpr, 0, 0, G.s * G.dpr, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    const p = posChoru();
    G.choru.desenhar(ctx, p.x, p.y, p.k, { dormindo: E.s.dormindo, sombra: CH.comodos.st.vaso <= 0 });
    CH.comodos.desenharCaquinhas(ctx, L, G.t, atual);
    CH.comodos.desenharComida(ctx);
    desenharParticulas(ctx);
    CH.comodos.desenharFrente(ctx, L, G.t, atual);

    // posição do balão: acima da cabeça
    const topo = G.choru.mundo(10, -112);
    ui.posBalao(topo.x * G.s, topo.y * G.s - 6);
  }

  // ---------- laço ----------

  let ultimo = performance.now();
  let acumTick = 0;
  function quadro(agora) {
    const dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    G.t += dt;
    if (!G.emCasa) {
      requestAnimationFrame(quadro);
      if (!$('abertura').hidden) return;
      return;
    }

    acumTick += dt * 1000;
    if (acumTick >= 1000) {
      E.tick(acumTick, !CH.jogos.ativo);
      acumTick = 0;
      ui.atualizar();
      avisosPeriodicos();
    }
    if (CH.jogos.ativo) { requestAnimationFrame(quadro); return; }

    if (G.transicao) {
      G.transicao.t += dt / 0.42;
      if (G.transicao.t >= 1) G.transicao = null;
    }

    const ch = G.choru;
    ch.expressao(humorBase());
    if (!CH.comodos.st.comendo) ch.mastigar = 0;
    CH.comodos.update(dt);
    atualizarSubida(dt);
    ch.update(dt);
    atualizarParticulas(dt);
    desenhar();
    requestAnimationFrame(quadro);
  }

  // ---------- toques no palco ----------

  let gesto = null;

  cv.addEventListener('pointerdown', (e) => {
    if (!G.emCasa) return;
    CH.som.iniciar();
    const p = G.paraMundo(e.clientX, e.clientY);
    gesto = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(),
      naChoru: G.choru.dentro(p.x, p.y, 1.05), moveu: 0, ultimo: { x: e.clientX, y: e.clientY }, segurou: false,
    };
    try { cv.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
  });

  cv.addEventListener('pointermove', (e) => {
    if (!G.emCasa) return;
    const p = G.paraMundo(e.clientX, e.clientY);
    if (e.pointerType === 'mouse' && !gesto) {
      G.choru.olhar = CH.comodos.st.arrasto ? G.choru.olhar : p;
      return;
    }
    if (!gesto || e.pointerId !== gesto.id) return;
    const d = Math.hypot(e.clientX - gesto.ultimo.x, e.clientY - gesto.ultimo.y);
    gesto.moveu += d;
    gesto.ultimo = { x: e.clientX, y: e.clientY };
    G.choru.olhar = p;
    if (gesto.naChoru && G.choru.dentro(p.x, p.y, 1.1) && !E.s.dormindo) {
      // carinho: esfregar o dedo na Chorú
      G.carinho += d;
      if (G.carinho > 140) {
        G.carinho = 0;
        G.expressao('feliz', 1.2);
        G.particulas('coracao', 1, p.x, p.y - 20);
        if (G.t - G.cooldownToque > 3) {
          G.cooldownToque = G.t;
          E.efeito({ diversao: 2 });
          CH.som.bolha();
        }
      }
    }
  });

  function fimGesto(e) {
    if (!gesto || e.pointerId !== gesto.id) return;
    const g = gesto; gesto = null;
    if (e.pointerType !== 'mouse') G.choru.olhar = null;
    const dt = performance.now() - g.t0;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    const p = G.paraMundo(e.clientX, e.clientY);

    // deslizar troca de cômodo
    if (!g.naChoru && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 600) {
      passo(dx < 0 ? 1 : -1);
      return;
    }
    if (g.moveu > 14 || g.segurou) return;
    if (dt > 650 && g.naChoru) return;
    if (g.naChoru) { tocarChoru(); return; }
    CH.comodos.toque(p.x, p.y, G.L);
  }
  cv.addEventListener('pointerup', fimGesto);
  cv.addEventListener('pointercancel', (e) => { if (gesto && e.pointerId === gesto.id) gesto = null; });
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !gesto) G.choru.olhar = null; });

  // segurar o dedo na Chorú: cócegas
  setInterval(() => {
    if (!gesto || !gesto.naChoru || gesto.segurou || gesto.moveu > 14) return;
    if (performance.now() - gesto.t0 > 650 && !E.s.dormindo) {
      gesto.segurou = true;
      G.expressao('gargalhada', 1.8);
      G.choru.pular(0.7);
      G.choru.ondula = 6;
      G.falar('Aí sim!');
      E.efeito({ diversao: 3 });
    }
  }, 100);

  function tocarChoru() {
    const ch = G.choru;
    if (E.s.dormindo) {
      ch.cutucar(0.4);
      G.falar(D.falas.recusa.dormindo);
      return;
    }
    if (CH.comodos.ocupado) return;
    ch.cutucar(1);
    CH.som.boing();
    const n = E.necessidade();
    if (n && U.chance(0.5)) {
      G.falar({ fome: D.falas.fome, higiene: D.falas.suja, energia: D.falas.sono, diversao: D.falas.tedio, doente: D.falas.doente, apertada: D.falas.apertada }[n]);
    } else {
      G.expressao(U.pick(['feliz', 'gargalhada', 'susto']), 1);
      G.falar(U.pick(D.falas.toque));
      if (G.t - G.cooldownToque > 4) { G.cooldownToque = G.t; E.efeito({ diversao: 1 }); }
    }
  }

  // ---------- botões fixos ----------

  $('seta-esq').addEventListener('click', () => passo(-1));
  $('seta-dir').addEventListener('click', () => passo(1));
  $('btn-moedas').addEventListener('click', () => { CH.som.botao(); CH.comodos.painelMercado(); });
  $('btn-config').addEventListener('click', () => { CH.som.botao(); painelConfig(); });
  document.addEventListener('keydown', (e) => {
    if (!G.emCasa || ui.painelAberto() || CH.jogos.ativo) return;
    if (e.key === 'ArrowLeft') passo(-1);
    if (e.key === 'ArrowRight') passo(1);
  });

  CH.ev.on('statusToque', (s) => {
    CH.som.botao();
    const v = Math.round(E.s.status[s.k]);
    ui.toast(s.rotulo + ': ' + v + '%', s.icone);
    if (s.comodo !== E.s.comodo) irPara(s.comodo);
  });

  // ---------- eventos do estado ----------

  CH.ev.on('status', () => ui.atualizar());
  CH.ev.on('moedas', (n) => { ui.atualizar(); if (n > 0) CH.som.moeda(); });
  CH.ev.on('xp', () => ui.atualizar());
  CH.ev.on('inventario', () => { if (ui.gaveta.aberta && E.s.comodo === 'cozinha') { /* a gaveta se atualiza na ação */ } });
  CH.ev.on('nivel', (nivel, premio) => {
    ui.atualizar();
    CH.som.nivel();
    G.choru.dancar(3);
    G.expressao('gargalhada', 3);
    G.particulas('estrela', 10);
    setTimeout(() => G.falar(D.falas.nivel), 400);
    const est = D.estagios.find((e) => nivel <= e.ate);
    const antes = D.estagios.find((e) => nivel - 1 <= e.ate);
    ui.toast('Nível ' + nivel + '! +' + premio + ' moedas', 'i_estrela');
    if (est !== antes) setTimeout(() => ui.toast('Agora ela é a ' + est.nome + '!', 'i_estrela'), 900);
  });
  CH.ev.on('apertada', () => {
    G.falar(D.falas.apertada);
    CH.comodos.atualizarAcoes();
    ui.toast('Leve a Chorú ao banheiro em 60 segundos', 'vaso');
  });
  CH.ev.on('caquinha', () => {
    G.expressao('susto', 1.6);
    G.falar('Ih mané, pingou hein!');
    CH.som.puf();
    CH.comodos.atualizarAcoes();
  });
  CH.ev.on('estado', () => { G.aplicarRoupas(); ui.atualizar(); if (G.emCasa) entrarComodo(E.s.comodo); });

  // ---------- configurações e créditos ----------

  function painelConfig() {
    const s = E.s;
    let confirmar = false;
    ui.painel('Configurações', (c) => {
      const desenhar = () => {
        c.innerHTML = '';
        [['som', 'Efeitos e voz'], ['musica', 'Música']].forEach(([k, nome]) => {
          const l = ui.el('div', 'config-linha', '<span>' + nome + '</span>');
          const b = ui.el('button', 'chave');
          b.type = 'button';
          b.setAttribute('aria-pressed', String(!!s.config[k]));
          b.setAttribute('aria-label', nome);
          b.onclick = () => {
            s.config[k] = !s.config[k];
            CH.som.configurar(s.config);
            E.salvar();
            desenhar();
          };
          l.appendChild(b);
          c.appendChild(l);
        });
        const info = ui.el('div', 'config-linha', '<span>Comidas: ' + s.contagem.comidas + ' · Banhos: ' + s.contagem.banhos + ' · Jogos: ' + s.contagem.jogos + ' · Passeios: ' + s.contagem.passeios + '</span>');
        c.appendChild(info);
        if (CH.teste) CH.teste.botoesConfig(c);
        const f = ui.el('div', 'fila');
        const cred = ui.el('button', 'botao verde', 'Créditos');
        cred.type = 'button';
        cred.onclick = painelCreditos;
        f.appendChild(cred);
        const zerar = ui.el('button', 'botao sec', confirmar ? 'Toque de novo pra apagar tudo' : 'Recomeçar do zero');
        zerar.type = 'button';
        zerar.onclick = () => {
          if (!confirmar) { confirmar = true; desenhar(); return; }
          ui.fecharPainel();
          E.resetar();
          G.aplicarRoupas();
          G.choru.espuma = [];
          irParaSemTransicao('cozinha');
          ui.atualizar();
          ui.toast('Jogo recomeçado');
        };
        f.appendChild(zerar);
        c.appendChild(f);
      };
      desenhar();
    });
  }

  function painelCreditos() {
    ui.painel('Créditos', (c) => {
      const d = ui.el('div', 'creditos');
      d.innerHTML =
        '<div class="duas"><img alt="Chorú e Defante" src="assets/jogo/medalha-04.webp"><img alt="Diogo Defante" src="assets/jogo/defante.webp"></div>' +
        '<h3>Chorumaçã</h3><p>Personagem de Diogo Defante, o Papai.</p>' +
        '<h3>Jogo</h3><p>Brabo Studio</p>' +
        '<p>Obrigado às 102 pessoas que apoiaram a campanha no Catarse.</p>' +
        '<p>I love your people!</p>';
      c.appendChild(d);
    });
  }

  function irParaSemTransicao(id) {
    E.s.comodo = id;
    G.transicao = null;
    entrarComodo(id);
  }

  // ---------- jogos: entrada e saída ----------

  CH.ev.on('jogoAbriu', () => {
    ui.casaVisivel(false);
    CH.som.chuveiro(false);
  });
  CH.ev.on('jogoFechou', () => {
    ui.casaVisivel(true);
    entrarComodo(E.s.comodo);
    ui.atualizar();
    requestAnimationFrame(layout);
  });

  // ---------- início ----------

  function resumoAusencia(r) {
    const partes = [];
    if (r.horas >= 1) partes.push('Você ficou ' + Math.floor(r.horas) + ' h fora.');
    if (r.caquinhas) partes.push(r.caquinhas === 1 ? 'Apareceu uma caquinha.' : 'Apareceram ' + r.caquinhas + ' caquinhas.');
    if (partes.length) setTimeout(() => ui.toast(partes.join(' ')), 900);
  }

  function bonusDiario() {
    const s = E.s;
    const hoje = U.hoje();
    if (s.bonusDia === hoje) return;
    s.bonusDia = hoje;
    const valor = U.rndInt(20, 50);
    E.salvar();
    setTimeout(() => {
      ui.painel('Bônus do dia', (c) => {
        c.innerHTML =
          '<div class="resultado"><img alt="" src="assets/jogo/medalha-01.webp" style="width:140px">' +
          '<p class="grande">+' + valor + '</p><p>"Ih mané, pingou hein!"</p></div>';
        const f = ui.el('div', 'fila');
        const b = ui.el('button', 'botao', 'Pegar moedas');
        b.type = 'button';
        b.onclick = () => ui.fecharPainel();
        f.appendChild(b);
        c.appendChild(f);
      }, () => {
        E.moedas(valor);
        G.particulas('moeda', 8);
        G.falar(D.falas.moedas);
      });
    }, 700);
  }

  function comecar() {
    CH.som.iniciar();
    CH.som.configurar(E.s.config);
    const ab = $('abertura');
    ab.classList.add('sai');
    setTimeout(() => { ab.hidden = true; }, 500);
    ui.casaVisivel(true);
    G.emCasa = true;
    irParaSemTransicao(E.s.comodo);
    ui.atualizar();
    layout();
    G.choru.pular(0.8);
    setTimeout(() => {
      const n = E.necessidade();
      G.falar(n ? { fome: D.falas.fome, higiene: D.falas.suja, energia: D.falas.sono, diversao: D.falas.tedio, doente: D.falas.doente, apertada: D.falas.apertada }[n] : 'Baby baby do baby do biruleibe leibe?');
    }, 700);
    resumoAusencia(G.resumo);
    bonusDiario();
    if (CH.online) CH.online.iniciar();
  }

  async function iniciar() {
    try {
      await Promise.all([
        document.fonts.load('30px "Lilita One"'),
        document.fonts.load('20px "Gochi Hand"'),
      ]);
    } catch (e) { /* segue com a fonte reserva */ }
    G.resumo = E.carregar();
    G.choru = CH.choru.criar();
    G.aplicarRoupas();
    ui.montar();
    CH.comodos.init(G);
    ui.casaVisivel(false);
    layout();
    ui.atualizar();
    requestAnimationFrame(quadro);
    $('btn-jogar').addEventListener('click', comecar);
    // letras do título com leve balanço, como na capa
    document.querySelectorAll('.titulo-capa span').forEach((sp) => {
      const r = U.mulberry32(sp.textContent.length * 31);
      sp.innerHTML = sp.textContent.split('').map((ch) => '<i style="transform:translateY(' + ((r() - 0.5) * 8).toFixed(1) + 'px) rotate(' + ((r() - 0.5) * 12).toFixed(1) + 'deg)">' + (ch === ' ' ? '&nbsp;' : ch) + '</i>').join('');
    });
    window.addEventListener('resize', () => { layout(); CH.cenarios.limparCache(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { E.salvarJa(); CH.som.parar(); CH.som.chuveiro(false); }
      else {
        const r = E.carregar();
        G.aplicarRoupas();
        ui.atualizar();
        if (G.emCasa && !CH.jogos.ativo) CH.som.tocar(E.s.comodo, true);
        if (r.caquinhas) resumoAusencia(r);
      }
    });
    window.addEventListener('pagehide', () => E.salvarJa());
    setInterval(() => E.salvarLocal(), 15000);
    if (CH.sincronia) CH.sincronia.iniciar();
  }

  CH.G = G;
  iniciar();
})(window.CH);
