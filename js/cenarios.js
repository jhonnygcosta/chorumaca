// Cômodos desenhados em código, no traço da campanha: contorno grosso e sombra chapada.
// Cada cômodo tem um fundo estático (guardado em cache) e uma camada viva, que anima.
(function (CH) {
  const U = CH.U;
  const T = U.TINTA;
  const PI = Math.PI;

  // ---------- auxiliares ----------

  function caixa(ctx, x, y, w, h, r, cor, lw = 5) {
    ctx.beginPath(); U.ret(ctx, x, y, w, h, r); U.pinta(ctx, cor, lw);
  }
  function poli(ctx, pts, cor, lw = 5) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath(); U.pinta(ctx, cor, lw);
  }
  function elip(ctx, x, y, rx, ry, cor, lw = 5) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, PI * 2); U.pinta(ctx, cor, lw);
  }
  function linha(ctx, pts, lw = 5, cor = T) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.lineWidth = lw; ctx.strokeStyle = cor; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }
  function texto(ctx, txt, x, y, tam, cor, contorno, ang = 0) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.font = tam + 'px "Lilita One", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (contorno) { ctx.lineWidth = tam * 0.22; ctx.strokeStyle = contorno; ctx.lineJoin = 'round'; ctx.strokeText(txt, 0, 0); }
    ctx.fillStyle = cor; ctx.fillText(txt, 0, 0);
    ctx.restore();
  }
  function brilhoVidro(ctx, x, y, w, h) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.moveTo(x + w * 0.15, y + h); ctx.lineTo(x + w * 0.45, y); ctx.lineTo(x + w * 0.62, y); ctx.lineTo(x + w * 0.32, y + h); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + w * 0.5, y + h); ctx.lineTo(x + w * 0.74, y); ctx.lineTo(x + w * 0.8, y); ctx.lineTo(x + w * 0.56, y + h); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Nuvem fofa: contorno grosso por baixo e preenchimento por cima, sem riscos internos.
  function nuvemDesenho(ctx, x, y, s, cor = '#FFFFFF') {
    const bolas = [[0, 0, 20], [28, -10, 26], [58, -2, 21], [30, 8, 22]];
    const base = () => {
      ctx.beginPath();
      bolas.forEach(([dx, dy, r]) => { ctx.moveTo(x + dx * s + r * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r * s, 0, PI * 2); });
    };
    base(); ctx.lineWidth = 8; ctx.strokeStyle = T; ctx.stroke();
    base(); ctx.fillStyle = cor; ctx.fill();
  }

  // Céu conforme o relógio real.
  function periodo() {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    if (h < 5.5 || h >= 19.5) return { id: 'noite', topo: '#1F2A55', base: '#3B4C86', astro: 'lua' };
    if (h < 7) return { id: 'amanhecer', topo: '#F4A99A', base: '#FDE3C8', astro: 'sol' };
    if (h < 17.5) return { id: 'dia', topo: '#7FCBEA', base: '#DDF3FB', astro: 'sol' };
    return { id: 'entardecer', topo: '#F08F78', base: '#FFD69B', astro: 'sol' };
  }

  function ceu(ctx, x, y, w, h, per, t = 0, nuvens = true) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, per.topo); g.addColorStop(1, per.base);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (per.id === 'noite') {
      const r = U.mulberry32(7);
      for (let i = 0; i < 40; i++) {
        const sx = x + r() * w, sy = y + r() * h * 0.8;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(t * 2 + i)) + ')';
        ctx.fillRect(sx, sy, 3, 3);
      }
      elip(ctx, x + w * 0.72, y + h * 0.28, 26, 26, '#FFF1C4', 4);
      elip(ctx, x + w * 0.72 + 12, y + h * 0.28 - 6, 22, 22, per.topo, 0);
    } else {
      const sy = per.id === 'dia' ? 0.26 : 0.62;
      elip(ctx, x + w * 0.74, y + h * sy, 30, 30, per.id === 'dia' ? '#FFE07A' : '#FFB36A', 4);
      if (nuvens) {
        const nuvem = (nx, ny, s) => nuvemDesenho(ctx, nx, ny, s);
        const dx = ((t * 8) % (w + 300)) - 150;
        nuvem(x + dx, y + h * 0.32, 1);
        nuvem(x + ((dx + w * 0.55) % (w + 300)) - 150, y + h * 0.58, 0.75);
      }
    }
  }

  // Chão de tábuas.
  function tabuas(ctx, L, cor, linhaCor, larg = 46) {
    ctx.fillStyle = cor; ctx.fillRect(0, L.chao, L.W, L.H - L.chao);
    ctx.strokeStyle = linhaCor; ctx.lineWidth = 3;
    for (let y = L.chao + larg * 0.8, i = 0; y < L.H; y += larg * (1 + i * 0.12), i++) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(L.W, y); ctx.stroke();
      const off = (i % 2) * 90;
      for (let x = off; x < L.W; x += 180) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + larg * (1 + i * 0.12)); ctx.stroke();
      }
    }
  }

  function rodape(ctx, L, cor) {
    ctx.fillStyle = cor; ctx.fillRect(0, L.chao - 22, L.W, 22);
    linha(ctx, [[0, L.chao - 22], [L.W, L.chao - 22]], 3.5);
    linha(ctx, [[0, L.chao], [L.W, L.chao]], 5);
  }

  // ---------- cômodos ----------

  const C = {};

  // Cozinha: azulejo xadrez verde-água, geladeira com pinguim, fogão e a mesa redonda da arte.
  C.cozinha = {
    pos(L) {
      const gel = { x: Math.max(L.cx - 400, 6), w: 150, h: 430 };
      gel.y = L.chao + 26 - gel.h;
      const fog = { w: 170, h: 196 };
      fog.x = Math.min(L.cx + 240, L.W - fog.w - 6);
      fog.y = L.chao + 26 - fog.h;
      return { gel, fog };
    },
    fundo(ctx, L) {
      const { gel, fog } = this.pos(L);
      ctx.fillStyle = '#FBEFF2'; ctx.fillRect(0, 0, L.W, L.chao);
      // azulejo
      const topo = L.chao - 340, lado = 58;
      for (let y = topo, i = 0; y < L.chao; y += lado, i++) {
        for (let x = (L.cx % lado) - lado, j = 0; x < L.W; x += lado, j++) {
          ctx.fillStyle = (i + j) % 2 ? '#DCEEE4' : '#F6FAF7';
          ctx.fillRect(x, y, lado, lado);
        }
      }
      ctx.strokeStyle = '#C3D9CF'; ctx.lineWidth = 2;
      for (let y = topo; y < L.chao; y += lado) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(L.W, y); ctx.stroke(); }
      for (let x = (L.cx % lado) - lado; x < L.W; x += lado) { ctx.beginPath(); ctx.moveTo(x, topo); ctx.lineTo(x, L.chao); ctx.stroke(); }
      linha(ctx, [[0, topo], [L.W, topo]], 4);
      tabuas(ctx, L, '#EAD3DA', '#D8BCC6');
      rodape(ctx, L, '#E2C5CF');

      // armário de parede sobre o fogão
      caixa(ctx, fog.x - 6, topo - 150, fog.w + 12, 130, 8, '#E3D2DE');
      linha(ctx, [[fog.x + fog.w / 2, topo - 150], [fog.x + fog.w / 2, topo - 20]], 4);
      caixa(ctx, fog.x + fog.w / 2 - 22, topo - 44, 12, 8, 3, '#9AA3A8', 3);
      caixa(ctx, fog.x + fog.w / 2 + 10, topo - 44, 12, 8, 3, '#9AA3A8', 3);

      // geladeira
      caixa(ctx, gel.x, gel.y, gel.w, gel.h, 14, '#EEF2F7');
      ctx.save(); ctx.beginPath(); U.ret(ctx, gel.x, gel.y, gel.w, gel.h, 14); ctx.clip();
      ctx.fillStyle = '#D6DEE9'; ctx.fillRect(gel.x + gel.w - 26, gel.y, 26, gel.h);
      ctx.restore();
      caixa(ctx, gel.x, gel.y, gel.w, gel.h, 14, null);
      linha(ctx, [[gel.x, gel.y + 140], [gel.x + gel.w, gel.y + 140]], 5);
      caixa(ctx, gel.x + 18, gel.y + 70, 52, 12, 6, '#9AA3A8', 3.5);
      caixa(ctx, gel.x + 18, gel.y + 170, 52, 12, 6, '#9AA3A8', 3.5);
      // ímãs
      elip(ctx, gel.x + 104, gel.y + 200, 10, 10, '#F24B64', 3);
      caixa(ctx, gel.x + 88, gel.y + 230, 36, 46, 3, '#FFFFFF', 3);
      linha(ctx, [[gel.x + 94, gel.y + 244], [gel.x + 118, gel.y + 244]], 2, '#9AA3A8');
      linha(ctx, [[gel.x + 94, gel.y + 254], [gel.x + 114, gel.y + 254]], 2, '#9AA3A8');
      linha(ctx, [[gel.x + 94, gel.y + 264], [gel.x + 116, gel.y + 264]], 2, '#9AA3A8');
      elip(ctx, gel.x + 106, gel.y + 226, 6, 6, '#FFCB6E', 2.6);
      // pinguim em cima da geladeira, como na arte
      const px = gel.x + 44, py = gel.y;
      ctx.beginPath(); ctx.ellipse(px, py - 30, 18, 28, 0, 0, PI * 2); U.pinta(ctx, '#2E2A33', 4);
      ctx.beginPath(); ctx.ellipse(px + 3, py - 24, 11, 20, 0, 0, PI * 2); U.pinta(ctx, '#FBF5EE', 0);
      elip(ctx, px + 4, py - 46, 3.2, 3.2, '#FBF5EE', 0);
      ctx.fillStyle = T; ctx.beginPath(); ctx.arc(px + 5, py - 46, 1.8, 0, PI * 2); ctx.fill();
      poli(ctx, [[px + 14, py - 42], [px + 28, py - 38], [px + 14, py - 35]], '#F2A23A', 3);
      elip(ctx, px - 4, py - 2, 8, 4, '#F2A23A', 3);
      elip(ctx, px + 10, py - 2, 8, 4, '#F2A23A', 3);

      // fogão
      caixa(ctx, fog.x - 8, fog.y - 70, fog.w + 16, 74, 4, '#F2F0F4', 4);
      caixa(ctx, fog.x, fog.y, fog.w, fog.h, 8, '#F2F0F4');
      caixa(ctx, fog.x, fog.y, fog.w, 26, 6, '#DADDE3', 4);
      [0.2, 0.4, 0.6, 0.8].forEach((f) => elip(ctx, fog.x + fog.w * f, fog.y + 13, 7, 7, '#9AA3A8', 3));
      caixa(ctx, fog.x + 16, fog.y + 48, fog.w - 32, fog.h - 72, 8, '#4B4550', 4);
      brilhoVidro(ctx, fog.x + 16, fog.y + 48, fog.w - 32, fog.h - 72);
      caixa(ctx, fog.x + 30, fog.y + 36, fog.w - 60, 8, 4, '#9AA3A8', 3);
      // bocas e panela
      elip(ctx, fog.x + 46, fog.y - 4, 30, 7, '#4A3F45', 4);
      elip(ctx, fog.x + 124, fog.y - 4, 30, 7, '#4A3F45', 4);
      poli(ctx, [[fog.x + 88, fog.y - 40], [fog.x + 160, fog.y - 40], [fog.x + 154, fog.y - 6], [fog.x + 94, fog.y - 6]], '#7C8C96', 4.5);
      elip(ctx, fog.x + 124, fog.y - 40, 36, 8, '#A3B2BA', 4);
      linha(ctx, [[fog.x + 88, fog.y - 34], [fog.x + 54, fog.y - 46]], 9);
      linha(ctx, [[fog.x + 88, fog.y - 34], [fog.x + 54, fog.y - 46]], 4, '#4A3F45');

      // mesa redonda com toalha listrada
      const mx = L.cx, my = L.base + 4;
      const rx = Math.min(330, L.W * 0.66), ry = 52;
      poli(ctx, [[mx - 22, my + 30], [mx + 22, my + 30], [mx + 18, L.H + 10], [mx - 18, L.H + 10]], '#B5645F', 5);
      elip(ctx, mx, my + 10, rx, ry, '#C8787A', 5);
      elip(ctx, mx, my, rx, ry, '#C8787A', 5);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(mx - rx * 0.78, my - ry * 0.62);
      ctx.lineTo(mx + rx * 0.5, my - ry * 0.95);
      ctx.lineTo(mx + rx * 0.98, my + ry * 0.2);
      ctx.lineTo(mx + rx * 0.72, my + ry * 2.4);
      ctx.lineTo(mx - rx * 0.1, my + ry * 1.2);
      ctx.lineTo(mx - rx * 0.9, my + ry * 2.1);
      ctx.closePath();
      ctx.fillStyle = '#F3E3E7'; ctx.fill();
      ctx.clip();
      ctx.strokeStyle = '#F2C46A'; ctx.lineWidth = 7;
      for (let i = -8; i < 12; i++) {
        ctx.beginPath(); ctx.moveTo(mx - rx + i * 70, my - ry * 2); ctx.lineTo(mx - rx + i * 70 + 160, my + ry * 3); ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(mx - rx * 0.78, my - ry * 0.62);
      ctx.lineTo(mx + rx * 0.5, my - ry * 0.95);
      ctx.lineTo(mx + rx * 0.98, my + ry * 0.2);
      ctx.lineTo(mx + rx * 0.72, my + ry * 2.4);
      ctx.lineTo(mx - rx * 0.1, my + ry * 1.2);
      ctx.lineTo(mx - rx * 0.9, my + ry * 2.1);
      ctx.closePath();
      U.pinta(ctx, null, 4.5);
      // saleiros
      const saleiro = (x, y, tampa) => {
        caixa(ctx, x - 14, y - 40, 28, 40, 9, '#F4EDEA', 4);
        caixa(ctx, x - 12, y - 50, 24, 14, 6, tampa, 4);
      };
      saleiro(mx - rx * 0.62, my - 6, '#A9705A');
      saleiro(mx + rx * 0.66, my - 10, '#A9705A');
    },
    pontos(L) {
      const { gel, fog } = this.pos(L);
      return [
        { id: 'geladeira', x: gel.x, y: gel.y, w: gel.w, h: gel.h },
        { id: 'fogao', x: fog.x, y: fog.y - 50, w: fog.w, h: fog.h + 50 },
      ];
    },
    vivo(ctx, L, t, info) {
      if (info.cozinhando) {
        const { fog } = this.pos(L);
        for (let i = 0; i < 4; i++) {
          const ph = (t * 0.8 + i * 0.25) % 1;
          const x = fog.x + 110 + i * 10 + Math.sin(t * 3 + i) * 8;
          const y = fog.y - 50 - ph * 90;
          ctx.globalAlpha = 1 - ph;
          elip(ctx, x, y, 12 + ph * 12, 9 + ph * 8, '#FFFFFF', 3);
          ctx.globalAlpha = 1;
        }
      }
    },
  };

  // Banheiro: azulejo azul-gelo das faixas da campanha, pia com armário de remédios, chuveiro e vaso.
  C.banheiro = {
    pos(L) {
      const pia = { x: Math.max(L.cx - 400, 6), w: 140 };
      const vaso = { w: 130, h: 200 };
      vaso.x = Math.min(L.cx + 210, L.W - vaso.w - 6);
      vaso.y = L.chao + 40 - vaso.h;
      const chu = { x: L.cx + 30, y: L.H * 0.3 };
      return { pia, vaso, chu };
    },
    fundo(ctx, L) {
      const { pia, vaso, chu } = this.pos(L);
      ctx.fillStyle = '#E7F2FF'; ctx.fillRect(0, 0, L.W, L.chao);
      const lado = 52, topo = L.chao - 390;
      ctx.strokeStyle = '#C4D5EA'; ctx.lineWidth = 2.5;
      for (let y = topo; y < L.chao; y += lado) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(L.W, y); ctx.stroke(); }
      for (let x = (L.cx % lado); x < L.W; x += lado) { ctx.beginPath(); ctx.moveTo(x, topo); ctx.lineTo(x, L.chao); ctx.stroke(); }
      ctx.fillStyle = '#F6FAFF'; ctx.fillRect(0, 0, L.W, topo);
      ctx.fillStyle = '#5B8E9C'; ctx.fillRect(0, topo - 18, L.W, 18);
      linha(ctx, [[0, topo - 18], [L.W, topo - 18]], 3.5);
      linha(ctx, [[0, topo], [L.W, topo]], 3.5);
      // chão em losangos
      ctx.fillStyle = '#BBCCE2'; ctx.fillRect(0, L.chao, L.W, L.H - L.chao);
      ctx.strokeStyle = '#A5B9D3'; ctx.lineWidth = 3;
      for (let x = -L.H; x < L.W + L.H; x += 70) {
        ctx.beginPath(); ctx.moveTo(x, L.chao); ctx.lineTo(x + (L.H - L.chao), L.H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, L.chao); ctx.lineTo(x - (L.H - L.chao), L.H); ctx.stroke();
      }
      rodape(ctx, L, '#D2E1F2');

      // armário de remédios com espelho
      const ax = pia.x + 10, ay = topo + 20;
      caixa(ctx, ax, ay, pia.w - 20, 150, 10, '#F4F7FA');
      caixa(ctx, ax + 12, ay + 12, pia.w - 44, 126, 6, '#CFE7F2', 4);
      brilhoVidro(ctx, ax + 12, ay + 12, pia.w - 44, 126);
      caixa(ctx, ax + (pia.w - 20) / 2 - 16, ay - 26, 32, 32, 6, '#FFFFFF', 4);
      ctx.fillStyle = '#F24B64';
      ctx.fillRect(ax + (pia.w - 20) / 2 - 4, ay - 20, 8, 20);
      ctx.fillRect(ax + (pia.w - 20) / 2 - 10, ay - 14, 20, 8);
      // pia
      const py = L.chao - 150;
      poli(ctx, [[pia.x + pia.w / 2 - 22, py + 40], [pia.x + pia.w / 2 + 22, py + 40], [pia.x + pia.w / 2 + 28, L.chao + 30], [pia.x + pia.w / 2 - 28, L.chao + 30]], '#F4F7FA');
      ctx.beginPath();
      ctx.moveTo(pia.x, py); ctx.lineTo(pia.x + pia.w, py);
      ctx.quadraticCurveTo(pia.x + pia.w, py + 60, pia.x + pia.w / 2, py + 60);
      ctx.quadraticCurveTo(pia.x, py + 60, pia.x, py);
      ctx.closePath(); U.pinta(ctx, '#FFFFFF', 5);
      elip(ctx, pia.x + pia.w / 2, py + 4, pia.w / 2 - 14, 9, '#D6E4EE', 3.5);
      linha(ctx, [[pia.x + pia.w / 2, py - 4], [pia.x + pia.w / 2, py - 30], [pia.x + pia.w / 2 + 22, py - 30]], 9);
      linha(ctx, [[pia.x + pia.w / 2, py - 4], [pia.x + pia.w / 2, py - 30], [pia.x + pia.w / 2 + 22, py - 30]], 4, '#C5CCD0');

      // vaso sanitário
      caixa(ctx, vaso.x + 22, vaso.y, vaso.w - 44, 84, 10, '#FBF7F0');
      caixa(ctx, vaso.x + vaso.w - 52, vaso.y + 14, 20, 9, 3, '#9AA3A8', 3);
      ctx.beginPath();
      ctx.moveTo(vaso.x, vaso.y + 104);
      ctx.lineTo(vaso.x + vaso.w, vaso.y + 104);
      ctx.quadraticCurveTo(vaso.x + vaso.w, vaso.y + 160, vaso.x + vaso.w - 34, vaso.y + 166);
      ctx.lineTo(vaso.x + vaso.w - 28, vaso.y + vaso.h);
      ctx.lineTo(vaso.x + 28, vaso.y + vaso.h);
      ctx.lineTo(vaso.x + 34, vaso.y + 166);
      ctx.quadraticCurveTo(vaso.x, vaso.y + 160, vaso.x, vaso.y + 104);
      ctx.closePath(); U.pinta(ctx, '#FBF7F0', 5);
      elip(ctx, vaso.x + vaso.w / 2, vaso.y + 102, vaso.w / 2 + 4, 16, '#E6F3F8', 5);
      elip(ctx, vaso.x + vaso.w / 2, vaso.y + 102, vaso.w / 2 - 18, 8, '#7FC4D3', 3.5);

      // tapete
      elip(ctx, L.cx, L.base + 12, 190, 34, '#F7A6B5', 5);
      elip(ctx, L.cx, L.base + 12, 150, 22, null, 3);

      // cano e chuveiro
      linha(ctx, [[chu.x + 70, -10], [chu.x + 70, chu.y - 40], [chu.x + 40, chu.y - 40]], 16);
      linha(ctx, [[chu.x + 70, -10], [chu.x + 70, chu.y - 40], [chu.x + 40, chu.y - 40]], 8, '#C5CCD0');
      ctx.beginPath();
      ctx.moveTo(chu.x - 50, chu.y);
      ctx.quadraticCurveTo(chu.x - 40, chu.y - 50, chu.x + 40, chu.y - 50);
      ctx.lineTo(chu.x + 46, chu.y - 30);
      ctx.quadraticCurveTo(chu.x + 30, chu.y + 10, chu.x - 50, chu.y);
      ctx.closePath(); U.pinta(ctx, '#C5CCD0', 5);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = T;
        ctx.beginPath(); ctx.arc(chu.x - 34 + i * 16, chu.y - 2 + i * -2, 2.6, 0, PI * 2); ctx.fill();
      }
      // toalha
      if (L.W > 700) {
        const tx = L.cx - 240;
        linha(ctx, [[tx - 70, topo + 60], [tx + 70, topo + 60]], 8);
        poli(ctx, [[tx - 50, topo + 56], [tx + 50, topo + 56], [tx + 54, topo + 210], [tx - 46, topo + 220]], '#F2C46A');
        linha(ctx, [[tx - 48, topo + 180], [tx + 52, topo + 172]], 4, '#E0A43E');
      }
    },
    pontos(L) {
      const { pia, vaso } = this.pos(L);
      return [
        { id: 'vaso', x: vaso.x, y: vaso.y, w: vaso.w, h: vaso.h },
        { id: 'remedios', x: pia.x, y: L.chao - 410, w: pia.w, h: 200 },
      ];
    },
    vivo(ctx, L, t, info) {
      const { chu, vaso } = this.pos(L);
      if (info.chuveiro) {
        ctx.strokeStyle = '#7FC4D3';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const r = U.mulberry32(Math.floor(t * 30));
        for (let i = 0; i < 26; i++) {
          const x0 = chu.x - 40 + r() * 80;
          const ph = (t * 2.2 + r()) % 1;
          const y = chu.y + ph * (L.base - chu.y + 20);
          const x = x0 - ph * 30 + (r() - 0.5) * 10;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 22); ctx.stroke();
        }
      }
      if (info.descarga > 0) {
        const cx = vaso.x + vaso.w / 2, cy = vaso.y + 102;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.32);
        ctx.rotate(t * 12);
        ctx.strokeStyle = '#4B9DB2'; ctx.lineWidth = 5;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(0, 0, 14 + i * 12, i, i + 3.5); ctx.stroke();
        }
        ctx.restore();
      }
    },
  };

  // Quarto: papel de parede lilás, janela com o céu da hora real, cama e abajur.
  C.quarto = {
    pos(L) {
      const cama = { x: Math.max(L.cx - 440, -90), w: 290 };
      const cri = { w: 110, h: 110 };
      cri.x = Math.min(L.cx + 240, L.W - cri.w - 8);
      cri.y = L.chao + 26 - cri.h;
      const jan = { w: 210, h: 170 };
      jan.x = L.W > 700 ? L.cx - 105 : L.cx - 105;
      jan.y = L.chao - 420;
      const roupa = L.W > 820 ? { x: L.cx + 420, y: L.chao + 26 - 420, w: 210, h: 420 } : null;
      const inter = { x: cri.x - 40, y: L.chao - 230, w: 34, h: 50 };
      return { cama, cri, jan, roupa, inter };
    },
    chave() { return periodo().id; },
    fundo(ctx, L) {
      const { cama, cri, jan, roupa, inter } = this.pos(L);
      ctx.fillStyle = '#E6DAF2'; ctx.fillRect(0, 0, L.W, L.chao);
      ctx.fillStyle = '#EEE6F7';
      for (let x = (L.cx % 80) - 80; x < L.W; x += 80) ctx.fillRect(x, 0, 34, L.chao);
      ctx.fillStyle = '#D6C6EA';
      const r = U.mulberry32(3);
      for (let y = 30; y < L.chao - 40; y += 60) for (let x = (L.cx % 80) - 63; x < L.W; x += 80) {
        ctx.beginPath(); ctx.arc(x + (r() - 0.5) * 4, y, 3.5, 0, PI * 2); ctx.fill();
      }
      tabuas(ctx, L, '#D9B48C', '#C49B70', 40);
      rodape(ctx, L, '#CDBCE3');

      // janela
      const per = periodo();
      ceu(ctx, jan.x, jan.y, jan.w, jan.h, per, 0, false);
      caixa(ctx, jan.x, jan.y, jan.w, jan.h, 6, null, 9);
      linha(ctx, [[jan.x + jan.w / 2, jan.y], [jan.x + jan.w / 2, jan.y + jan.h]], 6);
      linha(ctx, [[jan.x, jan.y + jan.h / 2], [jan.x + jan.w, jan.y + jan.h / 2]], 6);
      caixa(ctx, jan.x - 16, jan.y + jan.h - 4, jan.w + 32, 16, 4, '#FBF5EE', 4);
      // cortinas
      const cortina = (x, s) => {
        ctx.beginPath();
        ctx.moveTo(x, jan.y - 30);
        ctx.lineTo(x + s * 70, jan.y - 30);
        ctx.quadraticCurveTo(x + s * 40, jan.y + 80, x + s * 58, jan.y + jan.h + 40);
        ctx.lineTo(x, jan.y + jan.h + 40);
        ctx.closePath(); U.pinta(ctx, '#F7A6B5', 5);
        linha(ctx, [[x + s * 20, jan.y - 20], [x + s * 24, jan.y + jan.h + 30]], 3, '#E98597');
      };
      cortina(jan.x - 40, 1);
      cortina(jan.x + jan.w + 40, -1);
      linha(ctx, [[jan.x - 60, jan.y - 32], [jan.x + jan.w + 60, jan.y - 32]], 8);

      // guarda-roupa (telas largas)
      if (roupa) {
        caixa(ctx, roupa.x, roupa.y, roupa.w, roupa.h, 10, '#C99E72');
        linha(ctx, [[roupa.x + roupa.w / 2, roupa.y + 16], [roupa.x + roupa.w / 2, roupa.y + roupa.h - 30]], 4);
        caixa(ctx, roupa.x + roupa.w / 2 - 22, roupa.y + 180, 10, 40, 4, '#FFCB6E', 3);
        caixa(ctx, roupa.x + roupa.w / 2 + 12, roupa.y + 180, 10, 40, 4, '#FFCB6E', 3);
        caixa(ctx, roupa.x - 6, roupa.y - 16, roupa.w + 12, 22, 4, '#B5865C', 4);
      }

      // cama
      const by = L.chao + 60;
      caixa(ctx, cama.x, by - 210, 40, 230, 12, '#B07A50');
      caixa(ctx, cama.x + 20, by - 80, cama.w, 70, 16, '#FBF5EE');
      caixa(ctx, cama.x + 50, by - 104, 90, 44, 20, '#F7C9D2');
      ctx.beginPath();
      ctx.moveTo(cama.x + 150, by - 90);
      ctx.lineTo(cama.x + cama.w + 20, by - 90);
      ctx.quadraticCurveTo(cama.x + cama.w + 30, by - 90, cama.x + cama.w + 26, by - 20);
      ctx.lineTo(cama.x + 150, by - 6);
      ctx.closePath(); U.pinta(ctx, '#5B8E9C', 5);
      [[cama.x + 190, by - 60], [cama.x + 240, by - 40], [cama.x + 270, by - 70]].forEach(([x, y]) => elip(ctx, x, y, 8, 8, '#A6CFD9', 3));
      caixa(ctx, cama.x + 24, by - 14, 16, 26, 4, '#B07A50', 4);
      caixa(ctx, cama.x + cama.w, by - 14, 16, 26, 4, '#B07A50', 4);

      // criado-mudo e interruptor
      caixa(ctx, cri.x, cri.y, cri.w, cri.h, 8, '#C99E72');
      linha(ctx, [[cri.x, cri.y + 48], [cri.x + cri.w, cri.y + 48]], 4);
      elip(ctx, cri.x + cri.w / 2, cri.y + 28, 6, 6, '#FFCB6E', 3);
      elip(ctx, cri.x + cri.w / 2, cri.y + 78, 6, 6, '#FFCB6E', 3);
      caixa(ctx, inter.x, inter.y, inter.w, inter.h, 6, '#FBF5EE', 4);

      // tapete
      elip(ctx, L.cx, L.base + 14, 200, 34, '#C9B6E4', 5);
      ctx.setLineDash([10, 10]);
      elip(ctx, L.cx, L.base + 14, 170, 24, null, 3);
      ctx.setLineDash([]);
    },
    pontos(L) {
      const { cri, roupa, inter } = this.pos(L);
      const p = [
        { id: 'luz', x: cri.x - 10, y: cri.y - 170, w: cri.w + 20, h: cri.h + 170 },
        { id: 'luz', x: inter.x - 12, y: inter.y - 12, w: inter.w + 24, h: inter.h + 24 },
      ];
      if (roupa) p.push({ id: 'guarda-roupa', x: roupa.x, y: roupa.y, w: roupa.w, h: roupa.h });
      return p;
    },
    vivo(ctx, L, t, info) {
      const { cri, inter } = this.pos(L);
      // abajur
      const ax = cri.x + cri.w / 2, ay = cri.y;
      caixa(ctx, ax - 22, ay - 16, 44, 16, 6, '#8C6FB8', 4);
      linha(ctx, [[ax, ay - 16], [ax, ay - 70]], 6);
      ctx.beginPath();
      ctx.moveTo(ax - 26, ay - 120); ctx.lineTo(ax + 26, ay - 120); ctx.lineTo(ax + 46, ay - 66); ctx.lineTo(ax - 46, ay - 66); ctx.closePath();
      U.pinta(ctx, info.luzApagada ? '#C9A85A' : '#FFCB6E', 5);
      // tecla do interruptor
      caixa(ctx, inter.x + 10, inter.y + (info.luzApagada ? 24 : 10), inter.w - 20, 16, 3, '#9AA3A8', 3);
    },
  };

  // Sala de Jogos: parede azul-petróleo, fliperama, sofá roxo, óculos VR e bandeirinhas.
  C.sala = {
    pos(L) {
      const fli = { x: Math.max(L.cx - 400, 6), w: 150, h: 350 };
      fli.y = L.chao + 34 - fli.h;
      const vr = { w: 120, h: 120 };
      vr.x = Math.min(L.cx + 250, L.W - vr.w - 10);
      vr.y = L.chao + 30 - vr.h;
      return { fli, vr };
    },
    fundo(ctx, L) {
      const { fli, vr } = this.pos(L);
      ctx.fillStyle = '#3F5F66'; ctx.fillRect(0, 0, L.W, L.chao);
      ctx.fillStyle = '#4A6D75';
      for (let x = (L.cx % 140) - 140; x < L.W; x += 140) ctx.fillRect(x + 10, 60, 120, L.chao - 120);
      ctx.strokeStyle = '#33505A'; ctx.lineWidth = 3;
      for (let x = (L.cx % 140) - 140; x < L.W; x += 140) { ctx.strokeRect(x + 10, 60, 120, L.chao - 120); }
      ctx.fillStyle = '#2F3E44'; ctx.fillRect(0, L.chao, L.W, L.H - L.chao);
      ctx.fillStyle = '#35464D';
      for (let y = L.chao + 30; y < L.H; y += 60) ctx.fillRect(0, y, L.W, 26);
      rodape(ctx, L, '#33505A');

      // bandeirinhas
      const y0 = L.chao - 420, y1 = L.chao - 330;
      ctx.beginPath(); ctx.moveTo(0, y0);
      ctx.quadraticCurveTo(L.W / 2, y1 + (y1 - y0), L.W, y0 + 10);
      ctx.lineWidth = 3; ctx.strokeStyle = T; ctx.stroke();
      const cores = ['#F24B64', '#D1ED92', '#FFCB6E', '#A6CFD9'];
      for (let i = 0, x = 20; x < L.W; x += 54, i++) {
        const tt = x / L.W;
        const y = (1 - tt) * (1 - tt) * y0 + 2 * (1 - tt) * tt * (y1 + (y1 - y0)) + tt * tt * (y0 + 10);
        poli(ctx, [[x - 18, y], [x + 18, y + 2], [x, y + 34]], cores[i % 4], 3.5);
      }

      // pôster da Chorú
      if (L.W > 560) {
        const px = L.cx + 60, py = 140;
        caixa(ctx, px, py, 130, 170, 4, '#FFE7EB', 5);
        ctx.save(); ctx.beginPath(); ctx.rect(px, py, 130, 170); ctx.clip();
        ctx.fillStyle = '#ED5369';
        for (let i = 0; i < 8; i++) {
          ctx.beginPath(); ctx.moveTo(px + 65, py + 85);
          ctx.arc(px + 65, py + 85, 140, (i / 8) * PI * 2, (i / 8) * PI * 2 + 0.4); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        texto(ctx, 'CHORÚ', px + 65, py + 150, 24, '#FFFFFF', T, -0.08);
        elip(ctx, px + 65, py + 82, 34, 30, '#F24B64', 4);
        caixa(ctx, px, py, 130, 170, 4, null, 5);
      }

      // sofá
      const sw = Math.min(380, L.W * 0.8), sx = L.cx - sw / 2, sy = L.chao - 70;
      caixa(ctx, sx, sy - 70, sw, 110, 30, '#8C6FB8');
      caixa(ctx, sx - 30, sy - 20, 60, 120, 24, '#7A5DA6');
      caixa(ctx, sx + sw - 30, sy - 20, 60, 120, 24, '#7A5DA6');
      caixa(ctx, sx + 10, sy + 30, sw - 20, 60, 16, '#9C82C6');

      // fliperama
      ctx.beginPath();
      ctx.moveTo(fli.x + 10, fli.y);
      ctx.lineTo(fli.x + fli.w - 6, fli.y);
      ctx.lineTo(fli.x + fli.w - 6, fli.y + 70);
      ctx.lineTo(fli.x + fli.w - 30, fli.y + 110);
      ctx.lineTo(fli.x + fli.w - 30, fli.y + 190);
      ctx.lineTo(fli.x + fli.w, fli.y + 220);
      ctx.lineTo(fli.x + fli.w, fli.y + fli.h);
      ctx.lineTo(fli.x, fli.y + fli.h);
      ctx.lineTo(fli.x, fli.y + 10);
      ctx.closePath(); U.pinta(ctx, '#F24B64', 5);
      caixa(ctx, fli.x + 6, fli.y + 6, fli.w - 18, 54, 6, '#FFCB6E', 4);
      texto(ctx, 'FLIPERAMA', fli.x + fli.w / 2 - 6, fli.y + 34, 22, '#272322', null);
      caixa(ctx, fli.x + 12, fli.y + 76, fli.w - 52, 124, 8, '#1E1A22', 5);
      poli(ctx, [[fli.x, fli.y + 214], [fli.x + fli.w, fli.y + 214], [fli.x + fli.w + 8, fli.y + 244], [fli.x - 4, fli.y + 244]], '#BC314A', 4.5);
      linha(ctx, [[fli.x + 36, fli.y + 226], [fli.x + 36, fli.y + 204]], 6);
      elip(ctx, fli.x + 36, fli.y + 200, 10, 10, '#D1ED92', 4);
      elip(ctx, fli.x + 82, fli.y + 228, 9, 6, '#FFCB6E', 3.5);
      elip(ctx, fli.x + 110, fli.y + 228, 9, 6, '#A6CFD9', 3.5);
      caixa(ctx, fli.x + 40, fli.y + 270, fli.w - 80, 40, 6, '#BC314A', 4);
      elip(ctx, fli.x + fli.w / 2, fli.y + 290, 6, 10, '#272322', 0);

      // mesinha com óculos VR
      caixa(ctx, vr.x + 20, vr.y + 30, vr.w - 40, vr.h - 30, 6, '#5B8E9C');
      caixa(ctx, vr.x, vr.y + 16, vr.w, 22, 8, '#A6CFD9');
      ctx.save(); ctx.translate(vr.x + vr.w / 2, vr.y - 4);
      caixa(ctx, -42, -26, 84, 34, 12, '#F2F0EE', 4.5);
      caixa(ctx, -34, -19, 68, 20, 8, '#2E2A33', 3);
      linha(ctx, [[-26, -12], [-8, -12]], 4, '#7FC4D3');
      ctx.restore();
    },
    pontos(L) {
      const { fli, vr } = this.pos(L);
      return [
        { id: 'fliperama', x: fli.x, y: fli.y, w: fli.w, h: fli.h },
        { id: 'vr', x: vr.x, y: vr.y - 40, w: vr.w, h: vr.h + 40 },
      ];
    },
    vivo(ctx, L, t) {
      const { fli } = this.pos(L);
      // tela do fliperama com uma Chorú em pixels pulando
      const sx = fli.x + 18, sy = fli.y + 82, sw = fli.w - 64, sh = 112;
      ctx.save();
      ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
      ctx.fillStyle = '#1E2A33'; ctx.fillRect(sx, sy, sw, sh);
      const px = 6;
      for (let i = 0; i < 6; i++) {
        const x = sx + ((i * 23 + t * 40) % (sw + 20)) - 10;
        ctx.fillStyle = i % 2 ? '#FFCB6E' : '#A6CFD9';
        ctx.fillRect(x, sy + sh - 18 - (i % 3) * 14, px * 2, px);
      }
      const jy = Math.abs(Math.sin(t * 3.2)) * 40;
      const cx = sx + sw / 2 - 12, cy = sy + sh - 30 - jy;
      ctx.fillStyle = '#F24B64'; ctx.fillRect(cx, cy, 24, 18);
      ctx.fillStyle = '#D1ED92'; ctx.fillRect(cx + 4, cy - 4, 16, 4);
      ctx.fillStyle = '#A3D16D'; ctx.fillRect(cx + 12, cy - 10, 8, 6);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(cx + 4, cy + 4, 6, 4); ctx.fillRect(cx + 14, cy + 6, 6, 4);
      ctx.fillStyle = '#5B8E9C'; ctx.fillRect(sx, sy + sh - 8, sw, 8);
      ctx.restore();
      if (Math.sin(t * 4) > 0) elip(ctx, fli.x + 82, fli.y + 228, 9, 6, '#FFF3C4', 3.5);
    },
  };

  // Quintal: calçada de pedra portuguesa, fachada rosa, portão e árvore.
  C.quintal = {
    pos(L) {
      const casaW = Math.max(240, L.cx - 90);
      const portao = { x: casaW - 150, y: L.chao - 260, w: 120, h: 262 };
      const arv = { x: Math.min(L.cx + 280, L.W - 60) };
      return { casaW, portao, arv };
    },
    chave() { return periodo().id; },
    fundo(ctx, L) {
      const { casaW, portao, arv } = this.pos(L);
      const per = periodo();
      ceu(ctx, 0, 0, L.W, L.chao, per, 0, false);
      // morros e prédios ao fundo
      ctx.fillStyle = per.id === 'noite' ? '#2E3C66' : '#9FD1B6';
      ctx.beginPath(); ctx.moveTo(0, L.chao - 120);
      for (let x = 0; x <= L.W; x += 40) ctx.lineTo(x, L.chao - 140 - Math.sin(x * 0.006) * 60 - Math.sin(x * 0.017) * 20);
      ctx.lineTo(L.W, L.chao); ctx.lineTo(0, L.chao); ctx.closePath(); ctx.fill();
      const pr = U.mulberry32(11);
      for (let x = casaW + 20; x < L.W; x += 90) {
        const h = 120 + pr() * 160;
        caixa(ctx, x, L.chao - h, 80, h, 4, per.id === 'noite' ? '#55608F' : ['#F7C9D2', '#FFE9AD', '#CFE7F2'][Math.floor(pr() * 3)], 4);
        for (let wy = L.chao - h + 20; wy < L.chao - 40; wy += 36) {
          ctx.fillStyle = per.id === 'noite' ? '#FFE07A' : '#FFFFFF';
          ctx.fillRect(x + 14, wy, 16, 18); ctx.fillRect(x + 48, wy, 16, 18);
        }
      }
      // muro e grade
      caixa(ctx, casaW - 10, L.chao - 80, L.W - casaW + 20, 80, 0, '#F2EDE6', 5);
      for (let x = casaW + 10; x < L.W; x += 30) linha(ctx, [[x, L.chao - 80], [x, L.chao - 170]], 5, '#4B6765');
      linha(ctx, [[casaW - 10, L.chao - 166], [L.W + 10, L.chao - 166]], 7, '#4B6765');

      // casa
      caixa(ctx, -20, L.chao - 380, casaW + 20, 380, 0, '#F7C9D2', 5);
      poli(ctx, [[-40, L.chao - 370], [casaW + 30, L.chao - 370], [casaW - 30, L.chao - 460], [-40, L.chao - 460]], '#C0574A', 5);
      for (let x = -40; x < casaW; x += 34) linha(ctx, [[x, L.chao - 460], [x + 14, L.chao - 372]], 3, '#9E4339');
      // janela com floreira
      const jx = Math.max(20, casaW - 330);
      if (casaW > 330) {
        caixa(ctx, jx, L.chao - 320, 130, 110, 6, '#CFE7F2', 6);
        linha(ctx, [[jx + 65, L.chao - 320], [jx + 65, L.chao - 210]], 5);
        caixa(ctx, jx - 10, L.chao - 210, 150, 30, 4, '#B07A50', 4);
        [[jx + 10, '#F24B64'], [jx + 45, '#FFCB6E'], [jx + 85, '#F24B64'], [jx + 120, '#FFCB6E']].forEach(([x, c]) => {
          elip(ctx, x, L.chao - 216, 13, 13, c, 3.5);
          elip(ctx, x, L.chao - 216, 4, 4, '#FBF5EE', 0);
        });
      }
      // portão
      caixa(ctx, portao.x, portao.y, portao.w, portao.h, 6, '#5B8E9C', 5);
      caixa(ctx, portao.x + 14, portao.y + 16, portao.w - 28, 100, 4, '#4B7783', 4);
      caixa(ctx, portao.x + 14, portao.y + 130, portao.w - 28, 110, 4, '#4B7783', 4);
      elip(ctx, portao.x + portao.w - 22, portao.y + 130, 7, 7, '#FFCB6E', 3);
      caixa(ctx, portao.x + 24, portao.y - 46, portao.w - 48, 30, 4, '#FBF5EE', 4);
      texto(ctx, '42', portao.x + portao.w / 2, portao.y - 31, 20, '#272322', null);

      // árvore
      caixa(ctx, arv.x - 18, L.chao - 210, 36, 220, 10, '#8A5A34', 5);
      [[0, -280, 80], [-70, -230, 62], [70, -230, 64], [-30, -330, 60], [40, -320, 58]].forEach(([dx, dy, r]) => {
        ctx.beginPath(); ctx.arc(arv.x + dx, L.chao + dy, r, 0, PI * 2); U.pinta(ctx, '#7DBA4A', 5);
      });
      ctx.beginPath(); ctx.arc(arv.x, L.chao - 280, 74, 0, PI * 2); ctx.fillStyle = '#7DBA4A'; ctx.fill();
      ctx.beginPath(); ctx.arc(arv.x - 20, L.chao - 300, 46, 0, PI * 2); ctx.fillStyle = '#93CC5E'; ctx.fill();
      [[-30, -250], [30, -300], [10, -230]].forEach(([dx, dy]) => elip(ctx, arv.x + dx, L.chao + dy, 9, 9, '#F24B64', 3.5));

      // calçada de pedra portuguesa
      ctx.fillStyle = '#F4F0EA'; ctx.fillRect(0, L.chao, L.W, L.H - L.chao);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, L.chao, L.W, L.H - L.chao); ctx.clip();
      ctx.strokeStyle = '#2C2827';
      for (let i = 0, y = L.chao + 34; y < L.H + 60; y += 64, i++) {
        ctx.lineWidth = 18 + i * 3;
        ctx.beginPath();
        for (let x = -40; x <= L.W + 40; x += 10) {
          const yy = y + Math.sin((x + i * 60) * 0.018) * (16 + i * 3);
          if (x === -40) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#D9D2C8'; ctx.fillRect(0, L.chao - 2, L.W, 14);
      linha(ctx, [[0, L.chao - 2], [L.W, L.chao - 2]], 4);
      linha(ctx, [[0, L.chao + 12], [L.W, L.chao + 12]], 3);

      // vaso de planta
      const vx = Math.min(portao.x + portao.w + 50, L.cx - 160);
      if (vx > portao.x + portao.w + 10) {
        poli(ctx, [[vx - 30, L.chao - 50], [vx + 30, L.chao - 50], [vx + 22, L.chao + 10], [vx - 22, L.chao + 10]], '#C0574A', 4.5);
        [[-14, -90], [0, -110], [16, -88]].forEach(([dx, dy]) => {
          ctx.beginPath(); ctx.ellipse(vx + dx, L.chao + dy, 12, 34, dx * 0.03, 0, PI * 2); U.pinta(ctx, '#6DB23F', 4);
        });
      }
    },
    pontos(L) {
      const { portao } = this.pos(L);
      return [{ id: 'portao', x: portao.x, y: portao.y, w: portao.w, h: portao.h }];
    },
    vivo(ctx, L, t) {
      const per = periodo();
      if (per.id === 'noite') return;
      // nuvens passando
      const nuvem = (nx, ny, s) => nuvemDesenho(ctx, nx, ny, s);
      const w = L.W + 300;
      nuvem(((t * 10) % w) - 150, L.H * 0.17, 1.2);
      nuvem(((t * 6 + w * 0.5) % w) - 150, L.H * 0.27, 0.9);
    },
  };

  // ---------- cache do fundo ----------

  const caches = {};
  function fundo(id, L, s, dpr) {
    const sala = C[id];
    const extra = sala.chave ? sala.chave() : '';
    const chave = [L.W, L.H, s, dpr, extra].join('|');
    let c = caches[id];
    if (c && c.chave === chave) return c.cv;
    const cv = (c && c.cv) || document.createElement('canvas');
    cv.width = Math.max(1, Math.round(L.W * s * dpr));
    cv.height = Math.max(1, Math.round(L.H * s * dpr));
    const ctx = cv.getContext('2d');
    ctx.setTransform(s * dpr, 0, 0, s * dpr, 0, 0);
    ctx.clearRect(0, 0, L.W, L.H);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    sala.fundo(ctx, L);
    caches[id] = { chave, cv };
    return cv;
  }

  function limparCache() {
    Object.keys(caches).forEach((k) => delete caches[k]);
  }

  CH.cenarios = { C, fundo, limparCache, periodo, ceu, caixa, poli, elip, linha, texto, nuvem: nuvemDesenho };
})(window.CH);
