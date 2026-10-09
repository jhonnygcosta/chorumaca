// Empilha Chorú: o jogo de blocos clássico, com a cara da Chorumaçã.
// Regras do clássico: tabuleiro 10×20, 7 peças, giro com ajuste nas paredes (SRS),
// próxima peça, níveis a cada 10 linhas e pontuação 40/100/300/1200 × (nível + 1).
(function (CH) {
  const U = CH.U;
  const J = CH.jogos;
  const T = U.TINTA;

  const COLS = 10;
  const LINHAS = 20;
  const OCULTAS = 2;                 // linhas escondidas acima do tabuleiro
  const ALTURA = LINHAS + OCULTAS;
  const NIVEIS_INICIAIS = [0, 3, 6, 9];

  const FORMAS = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  };
  // Cores da campanha: rosa da Chorú, ouro das medalhas, roxo do boné, verde da folha,
  // pêssego (ela não gosta), azul-petróleo das metas e laranja da caneca de abacaxi.
  const CORES = { I: '#F24B64', O: '#FFCB6E', T: '#8C6FB8', S: '#8CC657', Z: '#FFB287', J: '#5B8E9C', L: '#E8823A' };
  const TIPOS = Object.keys(FORMAS);

  // Giro horário da matriz; cada peça guarda as 4 posições como listas de células.
  function girarMatriz(m) {
    const n = m.length;
    return m.map((linha, r) => linha.map((_, c) => m[n - 1 - c][r]));
  }
  const ESTADOS = {};
  TIPOS.forEach((t) => {
    let m = FORMAS[t];
    ESTADOS[t] = [];
    for (let r = 0; r < 4; r++) {
      const cel = [];
      m.forEach((linha, y) => linha.forEach((v, x) => { if (v) cel.push([x, y]); }));
      ESTADOS[t].push(cel);
      m = girarMatriz(m);
    }
  });

  // Tabelas de ajuste do SRS. Valores em (x, y) com y pra cima, como na especificação.
  const CHUTES = {
    '01': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '10': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '12': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '21': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '23': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    '32': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '30': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '03': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  };
  const CHUTES_I = {
    '01': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '10': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '12': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    '21': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '23': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '32': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '30': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '03': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  };

  // Quadros por linha do clássico de 8 bits (60 quadros por segundo).
  function segundosPorLinha(nivel) {
    const q = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6];
    let quadros;
    if (nivel < 10) quadros = q[nivel];
    else if (nivel < 13) quadros = 5;
    else if (nivel < 16) quadros = 4;
    else if (nivel < 19) quadros = 3;
    else if (nivel < 29) quadros = 2;
    else quadros = 1;
    return quadros / 60;
  }
  const PONTOS_LINHAS = [0, 40, 100, 300, 1200];

  const DAS = 0.16;          // espera antes de repetir o movimento ao segurar
  const ARR = 0.05;          // intervalo da repetição
  const TRAVA = 0.5;         // tempo no chão antes de travar
  const MAX_AJUSTES = 15;    // quantas vezes mover no chão reinicia a trava
  const ARE = 0.1;           // pausa entre uma peça e outra
  const LIMPEZA = 0.42;      // animação das linhas completas
  const QUEDA_SUAVE = 1 / 30;

  const sombras = {};
  function sombra(cor) {
    if (!sombras[cor]) sombras[cor] = U.misturar(cor, '#272322', 0.3);
    return sombras[cor];
  }

  // ---------- regras ----------

  function novoSaco(a) {
    const saco = TIPOS.slice();
    for (let i = saco.length - 1; i > 0; i--) {
      const j = Math.floor(U.rand() * (i + 1));
      [saco[i], saco[j]] = [saco[j], saco[i]];
    }
    a.saco.push(...saco);
  }

  function proximoTipo(a) {
    if (a.saco.length < 2) novoSaco(a);
    return a.saco.shift();
  }

  function novaPeca(tipo) {
    return {
      tipo, rot: 0,
      x: tipo === 'O' ? 4 : 3,
      y: 1,
      moeda: U.chance(0.12) ? U.rndInt(0, 3) : -1,
    };
  }

  function celulas(p, x = p.x, y = p.y, rot = p.rot) {
    return ESTADOS[p.tipo][rot].map(([cx, cy]) => [x + cx, y + cy]);
  }

  function colide(a, p, x, y, rot) {
    return celulas(p, x, y, rot).some(([bx, by]) => bx < 0 || bx >= COLS || by >= ALTURA || (by >= 0 && a.tab[by][bx]));
  }

  function noChao(a) {
    return colide(a, a.peca, a.peca.x, a.peca.y + 1, a.peca.rot);
  }

  function distanciaQueda(a) {
    let d = 0;
    while (!colide(a, a.peca, a.peca.x, a.peca.y + d + 1, a.peca.rot)) d++;
    return d;
  }

  // Mover ou girar com a peça no chão reinicia a trava, até o limite.
  function ajustouNoChao(a) {
    if (noChao(a) && a.ajustes < MAX_AJUSTES) {
      a.travaT = 0;
      a.ajustes++;
    }
  }

  function mover(a, dx) {
    if (!a.peca || a.limpando || a.espera > 0) return false;
    if (colide(a, a.peca, a.peca.x + dx, a.peca.y, a.peca.rot)) return false;
    a.peca.x += dx;
    CH.som.mover();
    ajustouNoChao(a);
    return true;
  }

  function girar(a, dir) {
    if (!a.peca || a.limpando || a.espera > 0) return false;
    const p = a.peca;
    if (p.tipo === 'O') { CH.som.girar(); return true; }
    const de = p.rot;
    const para = (p.rot + dir + 4) % 4;
    const tabela = p.tipo === 'I' ? CHUTES_I : CHUTES;
    for (const [kx, ky] of tabela['' + de + para]) {
      if (!colide(a, p, p.x + kx, p.y - ky, para)) {
        p.x += kx; p.y -= ky; p.rot = para;
        CH.som.girar();
        ajustouNoChao(a);
        return true;
      }
    }
    return false;
  }

  // Desce uma linha. Retorna false se não deu.
  function descer1(a) {
    const p = a.peca;
    if (colide(a, p, p.x, p.y + 1, p.rot)) return false;
    p.y++;
    if (p.y > a.maisBaixo) { a.maisBaixo = p.y; a.ajustes = 0; a.travaT = 0; }
    return true;
  }

  function cairDeVez(a) {
    if (!a.peca || a.limpando || a.espera > 0) return;
    const d = distanciaQueda(a);
    const antes = celulas(a.peca);
    a.peca.y += d;
    a.ponto(2 * d);
    CH.som.queda();
    a.rastro = { cel: antes, d, cor: CORES[a.peca.tipo], t: 0 };
    travar(a);
  }

  function nascer(a) {
    a.peca = novaPeca(a.proxima);
    a.proxima = proximoTipo(a);
    a.proximaMoeda = U.chance(0.12);
    a.maisBaixo = a.peca.y;
    a.ajustes = 0;
    a.travaT = 0;
    a.acc = 0;
    if (colide(a, a.peca, a.peca.x, a.peca.y, a.peca.rot)) fimDeJogo(a);
  }

  function travar(a) {
    const p = a.peca;
    const cel = celulas(p);
    cel.forEach(([x, y], i) => {
      if (y >= 0) a.tab[y][x] = { cor: CORES[p.tipo], moeda: i === p.moeda };
    });
    a.peca = null;
    CH.som.travar();
    a.tremor = 0.12;
    if (cel.every(([, y]) => y < OCULTAS)) { fimDeJogo(a); return; }
    if (p.tipo === 'Z' && !a.falouPessego && U.chance(0.25)) {
      a.falouPessego = true;
      a.falar('Isso é um pêssego.');
    }
    const cheias = [];
    for (let y = 0; y < ALTURA; y++) if (a.tab[y].every(Boolean)) cheias.push(y);
    if (cheias.length) limpar(a, cheias);
    else a.espera = ARE;
  }

  function limpar(a, linhas) {
    const n = linhas.length;
    const ganho = PONTOS_LINHAS[n] * (a.nivel + 1);
    a.ponto(ganho);
    let moedas = 0;
    linhas.forEach((y) => a.tab[y].forEach((c, x) => {
      if (c.moeda) moedas++;
      for (let k = 0; k < 2; k++) {
        a.gotas.push({ x: x + 0.5, y: y - OCULTAS + 0.5, vx: U.rnd(-6, 6), vy: U.rnd(-9, -3), cor: c.cor, t: 0, r: U.rnd(0.12, 0.22) });
      }
    }));
    if (moedas) {
      a.moedas += moedas;
      setTimeout(() => CH.som.moeda(), 180);
    }
    a.limpando = { linhas, t: 0 };
    a.textos.push({ txt: '+' + U.num(ganho), y: linhas[0] - OCULTAS, t: 0 });
    if (moedas) a.textos.push({ txt: '+' + moedas + (moedas > 1 ? ' moedas' : ' moeda'), y: linhas[0] - OCULTAS + 1.2, t: 0, ouro: true });
    const ch = a.choru;
    if (n === 4) {
      CH.som.chorumaca();
      a.faixa = { t: 0 };
      ch.dancar(2.2);
      a.falar('Aqui é explosão de chorume!');
      a.expressaoAte = { nome: 'gargalhada', ate: a.t + 2 };
    } else {
      CH.som.linha(n);
      a.expressaoAte = { nome: n === 3 ? 'gargalhada' : 'feliz', ate: a.t + 1.1 };
      ch.pular(0.35 + n * 0.12);
      if (n === 3 && U.chance(0.5)) a.falar('Aí sim!');
    }
  }

  function terminarLimpeza(a) {
    const linhas = a.limpando.linhas;
    a.tab = a.tab.filter((_, y) => !linhas.includes(y));
    while (a.tab.length < ALTURA) a.tab.unshift(Array(COLS).fill(null));
    a.linhas += linhas.length;
    const nivelNovo = a.nivelInicial + Math.floor(a.linhas / 10);
    if (nivelNovo > a.nivel) {
      a.nivel = nivelNovo;
      CH.som.nivel();
      a.choru.dancar(1.6);
      a.falar('Nível ' + a.nivel + '! Aí sim!');
    }
    a.limpando = null;
    a.espera = ARE;
    atualizarInfo(a);
  }

  function fimDeJogo(a) {
    if (a.estado === 'fim') return;
    a.estado = 'fim';
    a.peca = null;
    CH.som.andamento(1);
    CH.som.erro();
    a.choru.expressao('triste');
    a.expressaoAte = { nome: 'triste', ate: a.t + 99 };
    a.falar('BUUUUUUUUT');
    a.terminar();
  }

  function comecar(a, nivel) {
    a.estado = 'jogando';
    a.nivelInicial = nivel;
    a.nivel = nivel;
    a.linhas = 0;
    a.tab = Array.from({ length: ALTURA }, () => Array(COLS).fill(null));
    a.saco = [];
    a.proxima = proximoTipo(a);
    a.espera = 0.25;
    a.peca = null;
    atualizarInfo(a);
    CH.som.botao();
  }

  function atualizarInfo(a) {
    a.info('Nível ' + a.nivel + ' · ' + a.linhas + (a.linhas === 1 ? ' linha' : ' linhas'));
  }

  function toque() {
    return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  }

  // Linha mais alta ocupada (0 = topo do tabuleiro visível).
  function alturaPilha(a) {
    for (let y = OCULTAS; y < ALTURA; y++) if (a.tab[y].some(Boolean)) return y - OCULTAS;
    return LINHAS;
  }

  // ---------- geometria da tela ----------

  function geo(a) {
    const deitado = a.W > a.H * 1.15;
    const topo = a.topo + 8;
    const margem = 12;
    const ctrlH = deitado ? 0 : Math.round(U.clamp(a.H * 0.15, 88, 132));
    const hDisp = a.H - topo - ctrlH - margem * 2;
    const ladoCtrl = deitado ? Math.min(150, a.W * 0.17) : 0;
    const wDisp = a.W - margem * 2 - ladoCtrl * 2;
    const cel = Math.max(8, Math.floor(Math.min(hDisp / LINHAS, wDisp / (COLS + 5.4), 38)));
    const bw = cel * COLS, bh = cel * LINHAS;
    const gap = Math.round(cel * 0.6);
    const pw = Math.round(cel * 4.8);
    const x0 = Math.round((a.W - (bw + gap + pw)) / 2);
    const y0 = Math.round(topo + margem + (hDisp - bh) / 2);
    const px = x0 + bw + gap;

    // botões
    const botoes = [];
    const ids = ['esq', 'dir', 'girar', 'descer', 'cair'];
    if (deitado) {
      const r = Math.min(34, ladoCtrl * 0.28, a.H * 0.1);
      const cx1 = margem + ladoCtrl / 2, cx2 = a.W - margem - ladoCtrl / 2;
      const meio = a.H * 0.62;
      botoes.push({ id: 'esq', x: cx1 - r * 1.15, y: meio, r });
      botoes.push({ id: 'dir', x: cx1 + r * 1.15, y: meio, r });
      botoes.push({ id: 'descer', x: cx1, y: meio + r * 2.3, r });
      botoes.push({ id: 'girar', x: cx2, y: meio - r * 1.2, r });
      botoes.push({ id: 'cair', x: cx2, y: meio + r * 1.3, r });
    } else {
      const larg = Math.min(a.W - margem * 2, 520);
      const r = Math.min(ctrlH * 0.36, larg / 12);
      const cy = a.H - ctrlH / 2 - margem * 0.5;
      ids.forEach((id, i) => botoes.push({ id, x: a.W / 2 - larg / 2 + larg * (i + 0.5) / 5, y: cy, r }));
    }
    return { cel, bw, bh, x0, y0, px, pw, gap, botoes, deitado };
  }

  function botaoEm(g, x, y) {
    return g.botoes.find((b) => Math.hypot(x - b.x, y - b.y) <= b.r * 1.25);
  }

  function botoesMenu(g) {
    const lado = Math.min(g.bw * 0.4, 110);
    const esp = lado * 0.16;
    const cx = g.x0 + g.bw / 2, cy = g.y0 + g.bh * 0.68;
    return NIVEIS_INICIAIS.map((n, i) => ({
      n,
      x: cx + (i % 2 ? esp / 2 : -esp / 2 - lado),
      y: cy + (i < 2 ? -esp / 2 - lado * 0.62 : esp / 2),
      w: lado, h: lado * 0.62,
    }));
  }

  // ---------- controles ----------

  function pressionar(a, id) {
    if (a.estado !== 'jogando') return;
    if (id === 'esq' || id === 'dir') {
      const d = id === 'esq' ? -1 : 1;
      mover(a, d);
      a.das = { d, t: 0, rep: 0 };
    } else if (id === 'girar') girar(a, 1);
    else if (id === 'girarAnti') girar(a, -1);
    else if (id === 'descer') a.suave = true;
    else if (id === 'cair') cairDeVez(a);
  }

  function soltarBotao(a, id) {
    if ((id === 'esq' || id === 'dir') && a.das && a.das.d === (id === 'esq' ? -1 : 1)) a.das = null;
    if (id === 'descer') a.suave = false;
  }

  J.registrar('empilha', {
    titulo: 'Empilha Chorú',
    rotuloPontos: 'Pontos',
    gastoEnergia: 6,
    divisorDiversao: 120,
    musica: 'empilha',
    moedas: (a) => a.pontos / 60,
    saidaConta: (a) => a.estado === 'jogando' && a.pontos > 0,

    iniciar(a) {
      a.estado = 'menu';
      a.tab = Array.from({ length: ALTURA }, () => Array(COLS).fill(null));
      a.saco = [];
      a.peca = null;
      a.nivel = 0; a.linhas = 0; a.nivelInicial = 0;
      a.gotas = []; a.textos = [];
      a.dedos = {};
      a.gesto = null;
      a.das = null; a.suave = false;
      a.acc = 0; a.travaT = 0; a.espera = 0;
      a.tremor = 0;
      a.perigo = false;
      a.info('');
    },

    sair() { CH.som.andamento(1); },

    apertar(a, x, y, e) {
      const g = geo(a);
      if (a.estado === 'menu') {
        const b = botoesMenu(g).find((m) => x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h);
        if (b) comecar(a, b.n);
        return;
      }
      if (a.estado !== 'jogando') return;
      const bt = botaoEm(g, x, y);
      if (bt) {
        a.dedos[e.pointerId] = bt.id;
        pressionar(a, bt.id);
        return;
      }
      // gesto no tabuleiro
      const dentro = x >= g.x0 - g.cel && x <= g.x0 + g.bw + g.cel && y >= g.y0 - g.cel && y <= g.y0 + g.bh + g.cel;
      if (dentro && !a.gesto) {
        a.gesto = { id: e.pointerId, x0: x, y0: y, t0: performance.now(), colunas: 0, moveu: false, descendo: false };
      }
    },

    mover(a, x, y, e) {
      const ge = a.gesto;
      if (!ge || e.pointerId !== ge.id || a.estado !== 'jogando') return;
      const g = geo(a);
      const dx = x - ge.x0, dy = y - ge.y0;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) ge.moveu = true;
      // arrastar pros lados move coluna por coluna, seguindo o dedo
      if (!ge.descendo) {
        const alvo = Math.round(dx / (g.cel * 0.9));
        while (ge.colunas < alvo && mover(a, 1)) ge.colunas++;
        while (ge.colunas > alvo && mover(a, -1)) ge.colunas--;
        if (ge.colunas !== alvo) ge.colunas = alvo; // bateu na parede: segue do ponto atual
      }
      // arrastar pra baixo desce mais rápido
      if (dy > g.cel * 1.3 && dy > Math.abs(dx) * 1.2) { ge.descendo = true; a.suave = true; }
      else if (ge.descendo && dy < g.cel * 0.6) { ge.descendo = false; a.suave = false; }
    },

    soltar(a, x, y, e) {
      if (a.dedos[e.pointerId]) {
        soltarBotao(a, a.dedos[e.pointerId]);
        delete a.dedos[e.pointerId];
        return;
      }
      const ge = a.gesto;
      if (!ge || e.pointerId !== ge.id) return;
      a.gesto = null;
      if (ge.descendo) a.suave = false;
      if (a.estado !== 'jogando') return;
      const g = geo(a);
      const dt = performance.now() - ge.t0;
      const dx = x - ge.x0, dy = y - ge.y0;
      if (dy > g.cel * 2.5 && dt < 260 && dy > Math.abs(dx) * 1.5) { cairDeVez(a); return; }
      if (!ge.moveu && dt < 300) girar(a, 1);
    },

    tecla(a, k, desce, e) {
      const usadas = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'x', 'X', 'z', 'Z', 'Enter'];
      if (usadas.includes(k) && e) e.preventDefault();
      if (a.estado === 'menu') {
        if (desce && (k === 'Enter' || k === ' ')) comecar(a, 0);
        const n = parseInt(k, 10);
        if (desce && n >= 0 && n <= 9) comecar(a, n);
        return;
      }
      if (a.estado !== 'jogando') return;
      const rep = e && e.repeat;
      if (k === 'ArrowLeft' || k === 'ArrowRight') {
        const id = k === 'ArrowLeft' ? 'esq' : 'dir';
        if (desce && !rep) pressionar(a, id);
        if (!desce) soltarBotao(a, id);
      } else if (k === 'ArrowDown') {
        if (desce) a.suave = true; else a.suave = false;
      } else if (desce && !rep) {
        if (k === 'ArrowUp' || k === 'x' || k === 'X') girar(a, 1);
        else if (k === 'z' || k === 'Z') girar(a, -1);
        else if (k === ' ') cairDeVez(a);
      }
    },

    update(a, dt) {
      const ch = a.choru;
      // efeitos sempre andam
      a.gotas.forEach((p) => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 26 * dt; });
      a.gotas = a.gotas.filter((p) => p.t < 1.1);
      a.textos.forEach((t) => { t.t += dt; });
      a.textos = a.textos.filter((t) => t.t < 1.1);
      if (a.faixa) { a.faixa.t += dt; if (a.faixa.t > 1.5) a.faixa = null; }
      if (a.rastro) { a.rastro.t += dt; if (a.rastro.t > 0.25) a.rastro = null; }
      a.tremor = Math.max(0, a.tremor - dt);

      // humor da Chorú
      const perigo = a.estado === 'jogando' && alturaPilha(a) < 6;
      if (perigo !== a.perigo) {
        a.perigo = perigo;
        CH.som.andamento(perigo ? 1.2 : 1);
      }
      ch.suor = perigo;
      ch.tremor = perigo ? 0.6 : 0;
      if (a.expressaoAte && a.t < a.expressaoAte.ate) ch.expressao(a.expressaoAte.nome);
      else if (a.estado === 'menu') ch.expressao('deboche');
      else ch.expressao(perigo ? 'apertada' : 'deboche');

      if (a.estado !== 'jogando' || a.fim) return;

      if (a.limpando) {
        a.limpando.t += dt;
        if (a.limpando.t >= LIMPEZA) terminarLimpeza(a);
        return;
      }
      if (!a.peca) {
        a.espera -= dt;
        if (a.espera <= 0) nascer(a);
        return;
      }

      // segurar pro lado repete o movimento
      if (a.das) {
        a.das.t += dt;
        if (a.das.t >= DAS) {
          a.das.rep += dt;
          while (a.das && a.das.rep >= ARR) {
            a.das.rep -= ARR;
            if (!mover(a, a.das.d)) break;
          }
        }
      }

      // gravidade
      const passo = a.suave ? Math.min(QUEDA_SUAVE, segundosPorLinha(a.nivel)) : segundosPorLinha(a.nivel);
      a.acc += dt;
      while (a.acc >= passo) {
        a.acc -= passo;
        if (descer1(a)) {
          if (a.suave) a.ponto(1);
        } else {
          a.acc = 0;
          break;
        }
      }

      // trava depois de um tempo no chão
      if (noChao(a)) {
        a.travaT += dt;
        if (a.travaT >= TRAVA) travar(a);
      } else {
        a.travaT = 0;
      }
    },

    desenhar(a, c) {
      const g = geo(a);
      const cel = g.cel;
      J.espiral(c, a.W, a.H, a.t * 0.6, a.W / 2, a.H * 0.42);

      // gabinete rosa do fliperama em volta do tabuleiro
      const tx = a.tremor > 0 ? Math.sin(a.t * 90) * a.tremor * 6 : 0;
      c.save();
      c.translate(0, tx);
      const pad = Math.max(6, cel * 0.35);
      c.beginPath();
      U.ret(c, g.x0 - pad, g.y0 - pad, g.bw + pad * 2, g.bh + pad * 2, cel * 0.6);
      U.pinta(c, '#F24B64', 4);

      // azulejo xadrez da cozinha como fundo do tabuleiro
      c.save();
      c.beginPath(); c.rect(g.x0, g.y0, g.bw, g.bh); c.clip();
      for (let y = 0; y < LINHAS; y++) {
        for (let x = 0; x < COLS; x++) {
          c.fillStyle = (x + y) % 2 ? '#DCEEE4' : '#F6FAF7';
          c.fillRect(g.x0 + x * cel, g.y0 + y * cel, cel, cel);
        }
      }

      const ox = g.x0, oy = g.y0 - OCULTAS * cel;
      const limp = a.limpando;
      // blocos travados
      for (let y = OCULTAS; y < ALTURA; y++) {
        const nessa = limp && limp.linhas.includes(y);
        for (let x = 0; x < COLS; x++) {
          const b = a.tab[y][x];
          if (!b) continue;
          if (nessa) {
            const f = limp.t / LIMPEZA;
            const s = cel * (1 - U.ease.inCubic(f));
            const cx = ox + x * cel + cel / 2, cy = oy + y * cel + cel / 2;
            if (s > 1) bloco(c, cx - s / 2, cy - s / 2, s, f < 0.35 && Math.floor(f * 20) % 2 ? '#FFFFFF' : b.cor, b.moeda);
          } else {
            bloco(c, ox + x * cel, oy + y * cel, cel, b.cor, b.moeda);
          }
        }
      }

      // rastro da queda rápida
      if (a.rastro) {
        const r = a.rastro;
        c.save();
        c.globalAlpha = 0.35 * (1 - r.t / 0.25);
        c.fillStyle = r.cor;
        const xs = [...new Set(r.cel.map(([x]) => x))];
        xs.forEach((x) => {
          const ys = r.cel.filter(([cx]) => cx === x).map(([, y]) => y);
          const topo = Math.min(...ys);
          c.fillRect(ox + x * cel + cel * 0.2, oy + topo * cel, cel * 0.6, (r.d + 1) * cel);
        });
        c.restore();
      }

      // sombra de onde a peça vai cair e a peça atual
      if (a.peca && a.estado === 'jogando') {
        const d = distanciaQueda(a);
        celulas(a.peca, a.peca.x, a.peca.y + d).forEach(([x, y]) => {
          if (y < OCULTAS) return;
          c.save();
          c.beginPath();
          U.ret(c, ox + x * cel + 2, oy + y * cel + 2, cel - 4, cel - 4, cel * 0.2);
          c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill();
          c.setLineDash([cel * 0.18, cel * 0.12]);
          c.lineWidth = Math.max(1.5, cel * 0.08); c.strokeStyle = 'rgba(39,35,34,0.45)'; c.stroke();
          c.restore();
        });
        celulas(a.peca).forEach(([x, y], i) => {
          if (y < OCULTAS - 1) return;
          bloco(c, ox + x * cel, oy + y * cel, cel, CORES[a.peca.tipo], i === a.peca.moeda);
        });
      }
      c.restore();

      // grade do tabuleiro
      c.beginPath();
      U.ret(c, g.x0, g.y0, g.bw, g.bh, 2);
      c.lineWidth = 4; c.strokeStyle = T; c.stroke();

      // gotas de suco das linhas limpas
      a.gotas.forEach((p) => {
        c.globalAlpha = Math.max(0, 1 - p.t / 1.1);
        c.beginPath();
        c.arc(ox + p.x * cel, g.y0 + p.y * cel, p.r * cel, 0, Math.PI * 2);
        c.fillStyle = p.cor; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = T; c.stroke();
        c.globalAlpha = 1;
      });
      // pontos que sobem
      a.textos.forEach((t) => {
        c.save();
        c.globalAlpha = Math.max(0, 1 - t.t / 1.1);
        CH.cenarios.texto(c, t.txt, g.x0 + g.bw / 2, g.y0 + (t.y + 0.5) * cel - t.t * cel * 1.5, Math.max(16, cel * 0.9), t.ouro ? '#FFCB6E' : '#FFFFFF', T);
        c.restore();
      });
      c.restore();

      desenharPainel(a, c, g);
      desenharBotoes(a, c, g);

      // faixa de quatro linhas
      if (a.faixa) {
        const f = a.faixa.t;
        const s = f < 0.25 ? U.ease.outBack(f / 0.25) : 1;
        c.save();
        c.globalAlpha = f > 1.2 ? 1 - (f - 1.2) / 0.3 : 1;
        c.translate(g.x0 + g.bw / 2, g.y0 + g.bh * 0.42);
        c.rotate(-0.12);
        c.scale(s, s);
        CH.cenarios.texto(c, 'CHORUMAÇÃ!', 0, 0, Math.max(26, g.bw * 0.16), '#F24B64', '#FFFFFF');
        c.restore();
      }

      if (a.estado === 'menu') desenharMenu(a, c, g);
    },
  });

  // Bloco no traço da campanha: cor chapada, sombra no canto, brilho e contorno grosso.
  function bloco(c, x, y, s, cor, moeda) {
    const m = Math.max(0.5, s * 0.03);
    const r = s * 0.22;
    c.save();
    c.beginPath();
    U.ret(c, x + m, y + m, s - 2 * m, s - 2 * m, r);
    c.fillStyle = cor; c.fill();
    c.clip();
    c.fillStyle = sombra(cor);
    c.beginPath(); c.moveTo(x + s, y + s * 0.42); c.lineTo(x + s, y + s); c.lineTo(x + s * 0.3, y + s); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = Math.max(1.2, s * 0.1);
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + s * 0.24, y + s * 0.56); c.quadraticCurveTo(x + s * 0.24, y + s * 0.24, x + s * 0.56, y + s * 0.24); c.stroke();
    c.restore();
    c.beginPath();
    U.ret(c, x + m, y + m, s - 2 * m, s - 2 * m, r);
    c.lineWidth = Math.max(1.4, s * 0.085); c.strokeStyle = T; c.stroke();
    if (moeda) CH.desenhos.desenhar(c, 'i_moeda', x + s / 2, y + s / 2, s * 0.66);
  }

  function desenharPainel(a, c, g) {
    const cel = g.cel;
    const x = g.px, w = g.pw;
    let y = g.y0;
    // próxima peça
    const hProx = cel * 3.6;
    c.beginPath(); U.ret(c, x, y, w, hProx + cel * 1.1, cel * 0.45);
    U.pinta(c, '#FFFDF8', 3.5);
    CH.cenarios.texto(c, 'PRÓXIMA', x + w / 2, y + cel * 0.62, Math.max(11, cel * 0.62), '#272322', null);
    if (a.proxima && a.estado !== 'menu') {
      const est = ESTADOS[a.proxima][0];
      const s = Math.min(cel * 0.9, (w - cel) / 4);
      const xs = est.map(([cx]) => cx), ys = est.map(([, cy]) => cy);
      const bw = (Math.max(...xs) - Math.min(...xs) + 1) * s, bh = (Math.max(...ys) - Math.min(...ys) + 1) * s;
      const bx = x + (w - bw) / 2 - Math.min(...xs) * s, by = y + cel * 1.1 + (hProx - bh) / 2 - Math.min(...ys) * s;
      est.forEach(([cx, cy], i) => bloco(c, bx + cx * s, by + cy * s, s, CORES[a.proxima], false));
    }
    y += hProx + cel * 1.1 + cel * 0.5;

    // nível e linhas
    const linha = (rot, val) => {
      CH.cenarios.texto(c, rot, x + w / 2, y + cel * 0.45, Math.max(11, cel * 0.58), '#FFFFFF', T);
      CH.cenarios.texto(c, String(val), x + w / 2, y + cel * 1.35, Math.max(16, cel * 1.05), '#FFCB6E', T);
      y += cel * 2.2;
    };
    linha('NÍVEL', a.nivel);
    linha('LINHAS', a.linhas);

    // a Chorú torcendo, embaixo do painel
    const espaco = g.y0 + g.bh - y;
    const k = Math.max(0.12, Math.min(w / 215, espaco / 240));
    const olhar = a.peca ? { x: g.x0 + (a.peca.x + 1.5) * cel, y: g.y0 + (a.peca.y - OCULTAS + 1) * cel } : null;
    a.choru.olhar = olhar;
    a.choru.desenhar(c, x + w / 2, g.y0 + g.bh, k, {});
  }

  function desenharBotoes(a, c, g) {
    if (a.estado === 'menu') return;
    const apertados = new Set(Object.values(a.dedos));
    if (a.suave) apertados.add('descer');
    g.botoes.forEach((b) => {
      const ap = apertados.has(b.id);
      const dy = ap ? 4 : 0;
      c.beginPath(); c.arc(b.x, b.y + 5, b.r, 0, Math.PI * 2); c.fillStyle = T; c.fill();
      c.beginPath(); c.arc(b.x, b.y + dy, b.r, 0, Math.PI * 2);
      U.pinta(c, b.id === 'cair' ? '#F24B64' : b.id === 'girar' ? '#FFCB6E' : '#5B8E9C', 3.5);
      icone(c, b.id, b.x, b.y + dy, b.r * 0.5);
    });
  }

  function icone(c, id, x, y, s) {
    c.save();
    c.translate(x, y);
    c.lineWidth = Math.max(3, s * 0.32);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = id === 'girar' ? T : '#FFFFFF';
    c.beginPath();
    if (id === 'esq') { c.moveTo(s * 0.35, -s * 0.7); c.lineTo(-s * 0.4, 0); c.lineTo(s * 0.35, s * 0.7); }
    else if (id === 'dir') { c.moveTo(-s * 0.35, -s * 0.7); c.lineTo(s * 0.4, 0); c.lineTo(-s * 0.35, s * 0.7); }
    else if (id === 'descer') { c.moveTo(-s * 0.7, -s * 0.3); c.lineTo(0, s * 0.45); c.lineTo(s * 0.7, -s * 0.3); }
    else if (id === 'cair') {
      c.moveTo(-s * 0.65, -s * 0.75); c.lineTo(0, -s * 0.1); c.lineTo(s * 0.65, -s * 0.75);
      c.moveTo(-s * 0.65, -s * 0.15); c.lineTo(0, s * 0.5); c.lineTo(s * 0.65, -s * 0.15);
      c.moveTo(-s * 0.7, s * 0.85); c.lineTo(s * 0.7, s * 0.85);
    } else if (id === 'girar') {
      c.arc(0, 0, s * 0.62, -Math.PI * 0.85, Math.PI * 0.55);
      c.stroke();
      c.beginPath();
      const ax = Math.cos(Math.PI * 0.55) * s * 0.62, ay = Math.sin(Math.PI * 0.55) * s * 0.62;
      c.moveTo(ax - s * 0.42, ay - s * 0.05); c.lineTo(ax, ay); c.lineTo(ax + s * 0.12, ay - s * 0.42);
    }
    c.stroke();
    c.restore();
  }

  function desenharMenu(a, c, g) {
    const cx = g.x0 + g.bw / 2;
    c.save();
    c.fillStyle = 'rgba(255,253,248,0.82)';
    c.fillRect(g.x0, g.y0, g.bw, g.bh);
    const tam = Math.max(20, g.bw * 0.13);
    CH.cenarios.texto(c, 'EMPILHA', cx, g.y0 + g.bh * 0.14, tam, '#F24B64', '#FFFFFF', -0.06);
    CH.cenarios.texto(c, 'CHORÚ', cx, g.y0 + g.bh * 0.14 + tam * 0.95, tam * 1.1, '#F24B64', '#FFFFFF', -0.06);
    // peças de enfeite
    const s = g.cel * 0.8;
    ['T', 'S', 'L'].forEach((tp, i) => {
      ESTADOS[tp][0].forEach(([x, y]) => bloco(c, g.x0 + g.bw * (0.16 + i * 0.27) + x * s, g.y0 + g.bh * 0.3 + y * s, s, CORES[tp], tp === 'S' && x === 1 && y === 0));
    });
    CH.cenarios.texto(c, 'Escolha o nível', cx, g.y0 + g.bh * 0.47, Math.max(14, g.bw * 0.07), '#272322', null);
    botoesMenu(g).forEach((b) => {
      c.beginPath(); U.ret(c, b.x, b.y + 4, b.w, b.h, 12); c.fillStyle = T; c.fill();
      c.beginPath(); U.ret(c, b.x, b.y, b.w, b.h, 12);
      U.pinta(c, b.n === 0 ? '#5B8E9C' : b.n < 6 ? '#8CC657' : b.n < 9 ? '#FFCB6E' : '#F24B64', 3.5);
      CH.cenarios.texto(c, String(b.n), b.x + b.w / 2, b.y + b.h / 2, b.h * 0.55, '#FFFFFF', T);
    });
    // como jogar
    const tamDica = Math.max(11, Math.min(16, g.bw * 0.058));
    const dicas = toque()
      ? ['Toque no tabuleiro: girar', 'Arraste: mover · Deslize pra baixo: cair']
      : ['← → mover · ↑ girar', '↓ descer · espaço: cair'];
    dicas.forEach((d, i) => CH.cenarios.texto(c, d, cx, g.y0 + g.bh * 0.86 + i * tamDica * 1.35, tamDica, '#4B6765', null));
    CH.cenarios.texto(c, 'Recorde: ' + U.num(CH.estado.s.recordes.empilha || 0), cx, g.y0 + g.bh * 0.96, Math.max(12, g.bw * 0.055), '#272322', null);
    c.restore();
  }
})(window.CH);
