// Utilitários compartilhados: matemática, sorteio, curvas suaves e eventos.
window.CH = window.CH || {};

(function (CH) {
  const U = {};

  U.TINTA = '#272322';

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.inv = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  U.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  U.aproximar = (atual, alvo, taxa, dt) => alvo + (atual - alvo) * Math.exp(-taxa * dt);

  U.ease = {
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
  };

  // Gerador com semente (mulberry32), usado onde a sequência precisa se repetir.
  U.mulberry32 = function (a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.rand = U.mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
  U.rnd = (a, b) => a + (b - a) * U.rand();
  U.rndInt = (a, b) => Math.floor(U.rnd(a, b + 1));
  U.pick = (arr) => arr[Math.floor(U.rand() * arr.length)];
  U.chance = (p) => U.rand() < p;

  // Curva suave que passa pelos pontos (Catmull-Rom convertida em Bézier).
  // Funciona tanto com o contexto do canvas quanto com Path2D.
  U.suave = function (alvo, p, fechado = true, k = 1) {
    const n = p.length;
    alvo.moveTo(p[0][0], p[0][1]);
    const fim = fechado ? n : n - 1;
    for (let i = 0; i < fim; i++) {
      const p0 = fechado ? p[(i - 1 + n) % n] : p[Math.max(0, i - 1)];
      const p1 = p[i];
      const p2 = p[(i + 1) % n];
      const p3 = fechado ? p[(i + 2) % n] : p[Math.min(n - 1, i + 2)];
      alvo.bezierCurveTo(
        p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k,
        p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k,
        p2[0], p2[1]
      );
    }
    if (fechado) alvo.closePath();
    return alvo;
  };

  U.caminho = function (p, fechado = true, k = 1) {
    return U.suave(new Path2D(), p, fechado, k);
  };

  // Retângulo de cantos arredondados.
  U.ret = function (alvo, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    alvo.moveTo(x + r, y);
    alvo.arcTo(x + w, y, x + w, y + h, r);
    alvo.arcTo(x + w, y + h, x, y + h, r);
    alvo.arcTo(x, y + h, x, y, r);
    alvo.arcTo(x, y, x + w, y, r);
    alvo.closePath();
    return alvo;
  };

  // Preenche e contorna o caminho atual no traço da campanha.
  U.pinta = function (ctx, cor, linha) {
    if (cor) { ctx.fillStyle = cor; ctx.fill(); }
    if (linha !== 0) {
      ctx.lineWidth = linha || ctx.lineWidth;
      ctx.strokeStyle = U.TINTA;
      ctx.stroke();
    }
  };

  U.tinta = function (ctx, largura) {
    ctx.strokeStyle = U.TINTA;
    ctx.lineWidth = largura;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  };

  // Mistura de cores em hex.
  U.hexRgb = function (h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.misturar = function (a, b, t) {
    const x = U.hexRgb(a), y = U.hexRgb(b);
    const c = x.map((v, i) => Math.round(U.lerp(v, y[i], t)));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };

  U.hoje = function () {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  U.num = (n) => Math.floor(n).toLocaleString('pt-BR');

  // Barramento simples de eventos.
  const ouvintes = {};
  CH.ev = {
    on(nome, fn) { (ouvintes[nome] = ouvintes[nome] || []).push(fn); },
    off(nome, fn) { ouvintes[nome] = (ouvintes[nome] || []).filter((f) => f !== fn); },
    emit(nome, ...args) { (ouvintes[nome] || []).slice().forEach((f) => f(...args)); },
  };

  CH.U = U;
})(window.CH);
