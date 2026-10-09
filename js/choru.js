// A Chorú desenhada em código, no traço da campanha.
// Coordenadas locais: o corpo cabe num raio de ~100 unidades, centro em (0,0) e base em y = 85.
(function (CH) {
  const U = CH.U;
  const T = U.TINTA;

  const PELES = {
    classica: { luz: '#F24B64', sombra: '#BC314A', topo: '#D1ED92', topoSombra: '#A9A46A', borda: '#FFE1E6', rubor: '#F98A9C' },
    verde:    { luz: '#98CF58', sombra: '#5C9935', topo: '#EAF8A8', topoSombra: '#A7C16A', borda: '#F4FFDC', rubor: '#F6A58E' },
    amor:     { luz: '#E21F38', sombra: '#930F23', topo: '#F0485C', topoSombra: '#B3152C', borda: '#FFD3D9', rubor: '#FF8696', palito: true, brilho: true },
    dourada:  { luz: '#F5C242', sombra: '#C8891E', topo: '#FFF1A6', topoSombra: '#E1BE60', borda: '#FFF8DA', rubor: '#F7A27A', faisca: true },
    pessego:  { luz: '#FFB287', sombra: '#EC875B', topo: '#FFDFA6', topoSombra: '#E8B479', borda: '#FFF1E6', rubor: '#FF8C78' },
  };

  // Contorno do corpo. Começa e termina no encaixe do cabinho para formar o "biquinho" do topo.
  const CORPO = [
    [18, -63], [46, -73], [80, -56], [99, -14], [93, 34], [65, 69], [28, 84], [-2, 86],
    [-42, 78], [-79, 52], [-99, 3], [-86, -52], [-52, -82], [-14, -84], [18, -63],
  ];
  const LADO_ESCURO = [[-30, -120], [-50, -64], [-60, -20], [-54, 30], [-36, 70], [-16, 120], [-160, 120], [-160, -120]];
  const TOPO = [
    [-130, -74], [-96, -72], [-70, -66], [-46, -60], [-26, -50], [-8, -56], [10, -44], [30, -52],
    [50, -42], [68, -50], [86, -40], [108, -48], [130, -40], [130, -140], [-130, -140],
  ];
  const MANCHAS = [[-62, 22, 10], [32, -34, 8], [62, 44, 11], [-18, 58, 9], [-76, -22, 8], [12, 18, 6], [78, -2, 7], [-40, -58, 7]];

  const BASE = {
    palpebra: 0.2, inclina: 0, olharX: 0.25, olharY: -0.5, tamPupila: 1, olhoAb: 1,
    feliz: 0, fechados: 0, bocaAb: 0.75, bocaLarg: 1, bocaSorriso: 0.75, bocaO: 0, rubor: 0.75,
  };

  const EXP = {
    deboche: {},
    feliz: { palpebra: 0.1, olharX: 0.2, olharY: -0.2, feliz: 1, bocaAb: 1, bocaSorriso: 1, rubor: 1, bocaLarg: 1.05 },
    gargalhada: { feliz: 1, bocaAb: 1.25, bocaSorriso: 1, rubor: 1, bocaLarg: 1.1 },
    esperando: { palpebra: 0.04, olhoAb: 1.12, tamPupila: 1.05, bocaO: 0.8, bocaAb: 1.05, rubor: 0.6 },
    mastigando: { palpebra: 0.3, bocaAb: 0.12, bocaSorriso: 0.6, rubor: 0.85 },
    susto: { palpebra: 0, olhoAb: 1.25, tamPupila: 0.62, bocaO: 1, bocaAb: 0.95, rubor: 0.3, olharX: 0, olharY: 0 },
    sono: { palpebra: 0.7, bocaAb: 0.1, bocaSorriso: 0.2, rubor: 0.4, olharY: 0.3, olharX: 0 },
    dormindo: { fechados: 1, bocaO: 0.7, bocaAb: 0.22, rubor: 0.55 },
    triste: { palpebra: 0.44, inclina: -0.65, olharY: 0.5, olharX: -0.1, bocaAb: 0.2, bocaSorriso: -0.85, rubor: 0.3 },
    doente: { palpebra: 0.6, inclina: -0.45, olharY: 0.4, olharX: 0, bocaAb: 0.25, bocaSorriso: -0.55, rubor: 0.1 },
    bravo: { palpebra: 0.5, inclina: 0.8, olharX: 0, olharY: 0.1, bocaAb: 0.45, bocaSorriso: -0.75, rubor: 0.2 },
    nojo: { palpebra: 0.52, inclina: 0.35, bocaAb: 0.3, bocaSorriso: -0.9, bocaLarg: 0.8, rubor: 0.2 },
    apertada: { palpebra: 0.28, inclina: -0.35, olhoAb: 1.1, tamPupila: 0.8, bocaAb: 0.3, bocaSorriso: -0.35, bocaLarg: 0.75, rubor: 0.95, olharX: 0, olharY: 0 },
    fome: { palpebra: 0.34, inclina: -0.3, olharX: 0, olharY: -0.3, bocaAb: 0.55, bocaO: 0.5, rubor: 0.4 },
  };

  // Posições do rosto em coordenadas locais.
  const OLHO_E = { x: -36, y: -31, rx: 24, ry: 15, rot: -0.14, lado: 1 };
  const OLHO_D = { x: 46, y: 3, rx: 20, ry: 12.5, rot: -0.06, lado: -1 };

  function corpoPath(ond, t) {
    if (!ond) return U.caminho(CORPO, false, 1);
    const pts = CORPO.map((p, i) => {
      if (i === 0 || i === CORPO.length - 1) return p;
      const a = Math.atan2(p[1], p[0]);
      const d = Math.sin(t * 18 + i * 1.7) * ond;
      return [p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d];
    });
    return U.caminho(pts, false, 1);
  }

  // ---------- rosto ----------

  function olho(ctx, o, p, pele, olharLocal) {
    const ab = p.olhoAb;
    const rx = o.rx, ry = o.ry * ab;
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot);
    U.tinta(ctx, 4.6);

    if (p.fechados > 0.5) {
      ctx.beginPath();
      ctx.moveTo(-rx * 0.85, -ry * 0.05);
      ctx.quadraticCurveTo(0, ry * 1.1, rx * 0.85, -ry * 0.05);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (p.feliz > 0.5) {
      ctx.beginPath();
      ctx.moveTo(-rx * 0.85, ry * 0.45);
      ctx.quadraticCurveTo(0, -ry * 1.3, rx * 0.85, ry * 0.45);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const palp = U.clamp(p.palpebraEf, 0, 1);
    if (palp > 0.96) {
      ctx.beginPath();
      ctx.moveTo(-rx, ry * 0.1);
      ctx.quadraticCurveTo(0, ry * 0.45, rx, ry * 0.1);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const E = new Path2D();
    E.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FBF5EE';
    ctx.fill(E);

    ctx.save();
    ctx.clip(E);
    // pupila
    const lx = U.clamp(olharLocal.x, -1, 1), ly = U.clamp(olharLocal.y, -1, 1);
    const pr = o.ry * 0.78 * p.tamPupila;
    const px = lx * (rx - pr * 0.75), py = ly * (ry - pr * 0.5);
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = T;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + pr * 0.35, py - pr * 0.35, pr * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#FBF5EE';
    ctx.fill();
    // pálpebra
    const base = -ry + 2 * ry * palp;
    const inc = p.inclina * ry * 0.75 * o.lado;
    ctx.beginPath();
    ctx.moveTo(-rx - 4, -ry - 6);
    ctx.lineTo(rx + 4, -ry - 6);
    ctx.lineTo(rx + 4, base + inc);
    ctx.lineTo(-rx - 4, base - inc);
    ctx.closePath();
    ctx.fillStyle = pele.luz;
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 2.6;
    ctx.stroke(E);
    // linha grossa da pálpebra
    ctx.save();
    const E2 = new Path2D();
    E2.ellipse(0, 0, rx + 2.6, ry + 2.6, 0, 0, Math.PI * 2);
    ctx.clip(E2);
    ctx.beginPath();
    ctx.moveTo(-rx - 4, base - inc);
    ctx.lineTo(rx + 4, base + inc);
    ctx.lineWidth = palp < 0.06 ? 3.2 : 5.4;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function bocaPontos(p) {
    const larg = p.bocaLarg, ab = Math.max(0, p.bocaAb), sor = p.bocaSorriso;
    const L = [-34 * larg, 11 - 8 * sor], R = [39 * larg, 28 - 9 * sor];
    const mx = (L[0] + R[0]) / 2, my = (L[1] + R[1]) / 2;
    const up = [mx, my - 16 * Math.max(0, -sor) - 3 * Math.max(0, sor)];
    const lo = [mx, up[1] + 3 + 66 * ab * (0.55 + 0.45 * Math.max(0, sor))];
    const N = 12;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      pts.push(quad(L, up, R, t));
    }
    for (let i = 1; i < N; i++) {
      const t = i / N;
      pts.push(quad(R, lo, L, t));
    }
    const o = U.clamp(p.bocaO, 0, 1);
    if (o > 0.001) {
      const cx = mx + 2, cy = my + 6;
      const rx = 9 + 7 * ab, ry = 5 + 17 * ab;
      const M = pts.length;
      for (let i = 0; i < M; i++) {
        const a = Math.PI + (i / M) * Math.PI * 2;
        const ex = cx + Math.cos(a) * rx, ey = cy + Math.sin(a) * ry * (i <= N ? 1 : 1);
        pts[i] = [U.lerp(pts[i][0], ex, o), U.lerp(pts[i][1], ey, o)];
      }
    }
    return { pts, L, R, up, lo, mx, my, abertura: ab * (1 - o) + o * (0.3 + ab) };
  }

  function quad(a, c, b, t) {
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
  }

  function boca(ctx, p) {
    const b = bocaPontos(p);
    U.tinta(ctx, 4.6);
    if (b.abertura < 0.06) {
      ctx.beginPath();
      ctx.moveTo(b.L[0], b.L[1]);
      ctx.quadraticCurveTo(b.up[0], b.up[1] + 4, b.R[0], b.R[1]);
      ctx.stroke();
      return b;
    }
    const P = new Path2D();
    P.moveTo(b.pts[0][0], b.pts[0][1]);
    for (let i = 1; i < b.pts.length; i++) P.lineTo(b.pts[i][0], b.pts[i][1]);
    P.closePath();
    ctx.fillStyle = '#4A2730';
    ctx.fill(P);
    ctx.save();
    ctx.clip(P);
    // dentes
    if (p.bocaO < 0.6) {
      ctx.beginPath();
      ctx.moveTo(b.L[0], b.L[1]);
      ctx.quadraticCurveTo(b.up[0], b.up[1], b.R[0], b.R[1]);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#FBF5EE';
      ctx.stroke();
    }
    // língua
    ctx.beginPath();
    const fundo = p.bocaO > 0.5 ? b.my + 6 + (5 + 17 * Math.max(0, p.bocaAb)) : 0.5 * (b.my + b.lo[1]);
    ctx.ellipse(b.mx - 2, fundo - 3, 17 * p.bocaLarg, 11, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#E597A5';
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 4.6;
    ctx.strokeStyle = T;
    ctx.stroke(P);
    return b;
  }

  function rubor(ctx, p, pele) {
    if (p.rubor <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = U.clamp(p.rubor, 0, 1);
    ctx.fillStyle = pele.rubor;
    ctx.beginPath(); ctx.ellipse(-68, -10, 10, 6.5, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(66, 24, 9, 6, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(70, 22, 3.6, 2.6, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // risquinhos ao lado do olho, como na arte
    U.tinta(ctx, 2.2);
    ctx.beginPath();
    ctx.moveTo(-78, -40); ctx.lineTo(-74, -37);
    ctx.moveTo(-80, -33); ctx.lineTo(-76, -30);
    ctx.moveTo(26, -8); ctx.lineTo(29, -5);
    ctx.stroke();
  }

  // ---------- topo: cabinho, folha ou palito ----------

  function folha(ctx, pele) {
    if (pele.palito) {
      ctx.beginPath();
      U.ret(ctx, 15, -142, 10, 84, 4);
      U.tinta(ctx, 4.2);
      ctx.fillStyle = '#E2B77A';
      ctx.fill(); ctx.stroke();
      return;
    }
    // cabinho
    ctx.beginPath();
    ctx.moveTo(17, -62);
    ctx.quadraticCurveTo(20, -82, 30, -96);
    ctx.lineWidth = 11; ctx.strokeStyle = T; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 5.5; ctx.strokeStyle = '#8C9469'; ctx.stroke();
    // folha
    const F = new Path2D();
    F.moveTo(30, -95);
    F.bezierCurveTo(10, -130, -40, -136, -76, -110);
    F.bezierCurveTo(-48, -110, -6, -104, 30, -95);
    F.closePath();
    ctx.fillStyle = '#A3D16D';
    ctx.fill(F);
    ctx.save();
    ctx.clip(F);
    ctx.beginPath();
    ctx.moveTo(32, -93);
    ctx.bezierCurveTo(-6, -102, -48, -108, -80, -108);
    ctx.lineWidth = 9; ctx.strokeStyle = '#7DAE4C'; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, -116);
    ctx.quadraticCurveTo(-20, -130, -52, -124);
    ctx.lineWidth = 3; ctx.strokeStyle = '#F2FBE6'; ctx.stroke();
    ctx.restore();
    U.tinta(ctx, 4.2);
    ctx.stroke(F);
  }

  // ---------- acessórios ----------

  const ACESS = {
    bone(ctx) {
      const C = new Path2D();
      C.moveTo(-74, -58);
      C.bezierCurveTo(-78, -112, 50, -128, 66, -66);
      C.bezierCurveTo(30, -76, -30, -72, -74, -58);
      C.closePath();
      ctx.fillStyle = '#8C6FB8'; ctx.fill(C);
      ctx.save(); ctx.clip(C);
      ctx.beginPath();
      ctx.moveTo(-80, -50); ctx.bezierCurveTo(-74, -120, -10, -126, -6, -70); ctx.closePath();
      ctx.fillStyle = '#F4F0F8'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(40, -96, 22, 10, 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#A88ED0'; ctx.fill();
      ctx.restore();
      U.tinta(ctx, 4.4); ctx.stroke(C);
      ctx.beginPath(); ctx.moveTo(-6, -118); ctx.quadraticCurveTo(-4, -96, -6, -72); ctx.lineWidth = 2.6; ctx.stroke();
      // aba
      ctx.beginPath();
      ctx.moveTo(-70, -60);
      ctx.bezierCurveTo(-96, -66, -124, -58, -128, -48);
      ctx.bezierCurveTo(-110, -40, -86, -46, -64, -52);
      ctx.closePath();
      ctx.fillStyle = '#5F4A86'; ctx.fill(); U.tinta(ctx, 4.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(-4, -121, 5, 0, Math.PI * 2); ctx.fillStyle = '#5F4A86'; ctx.fill(); ctx.stroke();
    },
    fone(ctx) {
      U.tinta(ctx, 15);
      ctx.beginPath();
      ctx.moveTo(-98, -14);
      ctx.bezierCurveTo(-100, -118, 96, -126, 100, -8);
      ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = '#6E5E66'; ctx.stroke();
      const concha = (x, y) => {
        ctx.beginPath(); ctx.ellipse(x, y, 15, 26, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#4A3F45'; ctx.fill(); U.tinta(ctx, 4.2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, 7, 16, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#7D6471'; ctx.fill(); ctx.lineWidth = 2.4; ctx.stroke();
      };
      // microfone
      ctx.beginPath();
      ctx.moveTo(-96, 6);
      ctx.quadraticCurveTo(-86, 42, -46, 40);
      U.tinta(ctx, 7); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = '#6E5E66'; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-42, 40, 7, 5.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#4A3F45'; ctx.fill(); U.tinta(ctx, 3); ctx.stroke();
      concha(-100, -10);
      concha(101, -4);
    },
    laco(ctx) {
      ctx.save();
      ctx.translate(-46, -88);
      ctx.rotate(-0.35);
      const asa = (s) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(s * 18, -26, s * 46, -18, s * 40, 2);
        ctx.bezierCurveTo(s * 44, 20, s * 18, 22, 0, 0);
        ctx.closePath();
        ctx.fillStyle = '#5B8E9C'; ctx.fill(); U.tinta(ctx, 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 10, -4); ctx.quadraticCurveTo(s * 24, -12, s * 32, -6);
        ctx.lineWidth = 3; ctx.strokeStyle = '#A6CFD9'; ctx.stroke();
      };
      asa(-1); asa(1);
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#4B7783'; ctx.fill(); U.tinta(ctx, 4); ctx.stroke();
      ctx.restore();
    },
    chef(ctx) {
      U.tinta(ctx, 4.4);
      ctx.beginPath();
      ctx.arc(-34, -122, 26, 0, Math.PI * 2);
      ctx.arc(0, -138, 30, 0, Math.PI * 2);
      ctx.arc(36, -120, 25, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.save();
      ctx.beginPath(); ctx.arc(-34, -122, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(36, -120, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -138, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(-50, -112); ctx.lineTo(52, -110); ctx.lineTo(48, -76);
      ctx.quadraticCurveTo(0, -86, -48, -78); ctx.closePath();
      ctx.fillStyle = '#F4F1EC'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-16, -108); ctx.lineTo(-16, -84); ctx.moveTo(16, -108); ctx.lineTo(16, -84);
      ctx.lineWidth = 2.4; ctx.stroke();
    },
    touca(ctx) {
      const C = new Path2D();
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const x = U.lerp(-86, 84, t);
        const y = -46 + Math.sin(t * Math.PI) * -8 + (i % 2 ? 7 : 0);
        pts.push([x, y]);
      }
      C.moveTo(pts[0][0], pts[0][1]);
      pts.forEach((p) => C.lineTo(p[0], p[1]));
      C.bezierCurveTo(90, -120, -92, -130, -86, -46);
      C.closePath();
      ctx.fillStyle = '#BFE3EE'; ctx.fill(C);
      ctx.save(); ctx.clip(C);
      ctx.fillStyle = '#FFFFFF';
      [[-50, -80], [-10, -100], [30, -84], [62, -66], [-70, -58], [6, -66], [-28, -64]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      U.tinta(ctx, 4.2); ctx.stroke(C);
    },
    coroa(ctx) {
      const C = new Path2D();
      C.moveTo(-44, -84); C.lineTo(-52, -136); C.lineTo(-24, -110); C.lineTo(-2, -146);
      C.lineTo(22, -110); C.lineTo(50, -134); C.lineTo(44, -82);
      C.quadraticCurveTo(0, -92, -44, -84); C.closePath();
      ctx.fillStyle = '#FFCB6E'; ctx.fill(C);
      ctx.save(); ctx.clip(C);
      ctx.fillStyle = '#ECA555';
      ctx.fillRect(-60, -98, 120, 20);
      ctx.restore();
      U.tinta(ctx, 4.2); ctx.stroke(C);
      [[-30, -92, '#F24B64'], [0, -95, '#5B8E9C'], [28, -92, '#F24B64']].forEach(([x, y, c]) => {
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2.6; ctx.stroke();
      });
      [[-52, -136], [-2, -146], [50, -134]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = '#FFE9AD'; ctx.fill(); ctx.lineWidth = 2.6; ctx.stroke();
      });
    },
    oculos(ctx) {
      const lente = (o, w, h) => {
        ctx.save();
        ctx.translate(o.x + 1, o.y + 1);
        ctx.rotate(-0.08);
        ctx.beginPath();
        U.ret(ctx, -w / 2, -h / 2, w, h, 8);
        ctx.fillStyle = '#1E1A1A'; ctx.fill();
        ctx.save(); ctx.clip();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.moveTo(-w * 0.1, -h); ctx.lineTo(w * 0.12, -h); ctx.lineTo(-w * 0.12, h); ctx.lineTo(-w * 0.34, h); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w * 0.2, -h); ctx.lineTo(w * 0.3, -h); ctx.lineTo(w * 0.08, h); ctx.lineTo(-w * 0.02, h); ctx.closePath(); ctx.fill();
        ctx.restore();
        U.tinta(ctx, 4); ctx.stroke();
        ctx.restore();
      };
      U.tinta(ctx, 7);
      ctx.beginPath(); ctx.moveTo(-16, -26); ctx.quadraticCurveTo(6, -24, 24, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-60, -36); ctx.lineTo(-96, -30); ctx.moveTo(68, 0); ctx.lineTo(98, 4); ctx.stroke();
      lente(OLHO_E, 52, 34);
      lente(OLHO_D, 46, 30);
    },
    vr(ctx) {
      ctx.save();
      ctx.translate(5, -14);
      ctx.rotate(0.38);
      U.tinta(ctx, 12);
      ctx.beginPath(); ctx.moveTo(-104, 0); ctx.lineTo(104, 0); ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = '#4A3F45'; ctx.stroke();
      ctx.beginPath(); U.ret(ctx, -64, -26, 128, 52, 18);
      ctx.fillStyle = '#F2F0EE'; ctx.fill(); U.tinta(ctx, 4.4); ctx.stroke();
      ctx.beginPath(); U.ret(ctx, -54, -17, 108, 34, 12);
      ctx.fillStyle = '#2E2A33'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-40, -8); ctx.lineTo(-10, -8);
      ctx.lineWidth = 4; ctx.strokeStyle = '#7FC4D3'; ctx.stroke();
      ctx.beginPath(); ctx.arc(46, -18, 3, 0, Math.PI * 2); ctx.fillStyle = '#F24B64'; ctx.fill();
      ctx.restore();
    },
    monoculo(ctx) {
      const o = OLHO_D;
      ctx.beginPath(); ctx.arc(o.x, o.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,240,255,0.25)'; ctx.fill();
      U.tinta(ctx, 8); ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = '#FFCB6E'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x + 14, o.y + 15);
      ctx.bezierCurveTo(o.x + 30, o.y + 50, o.x + 4, o.y + 70, o.x + 20, o.y + 86);
      ctx.setLineDash([4, 5]); ctx.lineWidth = 3; ctx.strokeStyle = '#C8891E'; ctx.stroke(); ctx.setLineDash([]);
    },
  };

  const ESCONDE_FOLHA = { bone: true, chef: true, touca: true };

  // ---------- instância animada ----------

  function criar() {
    const p = Object.assign({}, BASE);
    const inst = {
      p,
      alvo: Object.assign({}, BASE),
      exp: 'deboche',
      t: U.rnd(0, 100),
      piscar: 0, proxPiscar: U.rnd(1.5, 4),
      squash: 0, squashV: 0,
      ondula: 0,
      pulo: 0, puloV: 0,
      danca: 0,
      tremor: 0,
      falar: 0,
      mastigar: 0,
      olhar: null,           // ponto do mundo para onde olhar
      olharLivre: { x: 0.55, y: -0.75 }, olharTroca: U.rnd(2, 5),
      vira: 0,               // inclinação extra
      ultimo: null,          // transformação do último desenho, para conversões
      pele: 'classica', cabeca: null, olhos: null,
      espuma: [], molhada: 0,
      sujeira: 0, doente: 0, suor: false, mosquinhas: false, fedor: 0,
    };

    inst.expressao = function (nome) {
      inst.exp = nome;
      inst.alvo = Object.assign({}, BASE, EXP[nome] || {});
    };

    inst.cutucar = function (forca = 1) {
      inst.squashV += 5.5 * forca;
      inst.ondula = Math.max(inst.ondula, 4.5 * forca);
    };

    inst.pular = function (forca = 1) {
      if (inst.pulo > 1) return;
      inst.puloV = 520 * forca;
      inst.squashV -= 3;
    };

    inst.dancar = function (seg) { inst.danca = seg; };
    inst.falarPor = function (seg) { inst.falar = Math.max(inst.falar, seg); };

    inst.update = function (dt) {
      inst.t += dt;
      const rate = 14;
      Object.keys(inst.alvo).forEach((k) => {
        inst.p[k] = U.aproximar(inst.p[k], inst.alvo[k], rate, dt);
      });
      // expressões binárias trocam na hora
      inst.p.feliz = inst.alvo.feliz;
      inst.p.fechados = inst.alvo.fechados;

      // piscar
      inst.proxPiscar -= dt;
      if (inst.proxPiscar <= 0) {
        inst.piscar = 0.16;
        inst.proxPiscar = U.chance(0.2) ? 0.25 : U.rnd(2, 5);
      }
      inst.piscar = Math.max(0, inst.piscar - dt);
      const b = inst.piscar > 0 ? Math.sin((1 - inst.piscar / 0.16) * Math.PI) : 0;
      inst.p.palpebraEf = inst.p.palpebra + (1 - inst.p.palpebra) * b;

      // olhar livre muda de tempos em tempos
      inst.olharTroca -= dt;
      if (inst.olharTroca <= 0) {
        inst.olharTroca = U.rnd(2.5, 6);
        inst.olharLivre = U.chance(0.55)
          ? { x: inst.alvo.olharX, y: inst.alvo.olharY }
          : { x: U.rnd(-0.8, 0.8), y: U.rnd(-0.6, 0.4) };
      }

      // mola do squash
      const k = 160, amort = 11;
      const acc = -k * inst.squash - amort * inst.squashV;
      inst.squashV += acc * dt;
      inst.squash += inst.squashV * dt;
      inst.ondula = Math.max(0, inst.ondula - dt * 9);

      // pulo
      if (inst.pulo > 0 || inst.puloV > 0) {
        inst.puloV -= 1900 * dt;
        inst.pulo += inst.puloV * dt;
        if (inst.pulo <= 0) {
          inst.pulo = 0; inst.puloV = 0;
          inst.squashV += 4.5;
        }
      }

      inst.danca = Math.max(0, inst.danca - dt);
      inst.falar = Math.max(0, inst.falar - dt);
      inst.molhada = Math.max(0, inst.molhada - dt * 0.15);
    };

    // Converte ponto local em ponto do mundo, usando o último desenho.
    inst.mundo = function (lx, ly) {
      const u = inst.ultimo;
      if (!u) return { x: 0, y: 0 };
      const ax = lx * u.k * u.sx, ay = (ly - 85) * u.k * u.sy;
      const c = Math.cos(u.rot), s = Math.sin(u.rot);
      return { x: u.x + ax * c - ay * s, y: u.y - u.pulo + ax * s + ay * c };
    };
    inst.local = function (wx, wy) {
      const u = inst.ultimo;
      if (!u) return { x: 0, y: 0 };
      const dx = wx - u.x, dy = wy - (u.y - u.pulo);
      const c = Math.cos(-u.rot), s = Math.sin(-u.rot);
      const rx = dx * c - dy * s, ry = dx * s + dy * c;
      return { x: rx / (u.k * u.sx), y: ry / (u.k * u.sy) + 85 };
    };
    inst.dentro = function (wx, wy, folga = 1) {
      const l = inst.local(wx, wy);
      return (l.x / 102) ** 2 + (l.y / 92) ** 2 <= folga * folga;
    };
    inst.bocaMundo = function () {
      return inst.mundo(4, 26);
    };

    inst.desenhar = function (ctx, x, y, escala, opts = {}) {
      const p = inst.p;
      const pele = PELES[opts.pele || inst.pele] || PELES.classica;
      const t = inst.t;

      // respiração, mastigação, fala e dança
      const resp = Math.sin(t * (opts.dormindo ? 1.6 : 2.4));
      const ampResp = opts.dormindo ? 0.035 : 0.018;
      let sx = 1 - resp * ampResp * 0.8 + inst.squash * 0.7;
      let sy = 1 + resp * ampResp - inst.squash;
      let rot = inst.vira;
      let dx = 0;
      if (inst.danca > 0) {
        const f = Math.min(1, inst.danca);
        rot += Math.sin(t * 13) * 0.16 * f;
        dx += Math.sin(t * 6.5) * 10 * f;
        sy += Math.abs(Math.sin(t * 13)) * -0.06 * f;
      }
      if (inst.tremor > 0) dx += Math.sin(t * 70) * 1.8 * inst.tremor;

      const bocaBase = p.bocaAb;
      if (inst.falar > 0) p.bocaAb = bocaBase * 0.3 + Math.abs(Math.sin(t * 17)) * 0.8;
      if (inst.mastigar > 0) p.bocaAb = Math.abs(Math.sin(t * 11)) * 0.32;

      const k = escala;
      const yb = y;
      inst.ultimo = { x: x + dx, y: yb, k, sx, sy, rot, pulo: inst.pulo };

      // sombra no chão
      if (opts.sombra !== false) {
        const enc = U.clamp(1 - inst.pulo / 300, 0.35, 1);
        ctx.save();
        ctx.fillStyle = 'rgba(39,35,34,0.22)';
        ctx.beginPath();
        ctx.ellipse(x + dx, yb + 2 * k, 84 * k * enc * sx, 12 * k * enc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(x + dx, yb - inst.pulo);
      ctx.rotate(rot);
      ctx.scale(k * sx, k * sy);
      ctx.translate(0, -85);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const C = corpoPath(inst.ondula, t);

      // corpo
      ctx.fillStyle = pele.luz;
      ctx.fill(C);
      ctx.save();
      ctx.clip(C);
      const esc = U.caminho(LADO_ESCURO, true, 1);
      const topo = U.caminho(TOPO, true, 1);
      ctx.fillStyle = pele.sombra;
      ctx.fill(esc);
      ctx.fillStyle = pele.topo;
      ctx.fill(topo);
      ctx.save();
      ctx.clip(esc);
      ctx.fillStyle = pele.topoSombra;
      ctx.fill(topo);
      ctx.restore();
      // luz de borda do lado direito
      ctx.save();
      const brilho = new Path2D();
      brilho.ellipse(100, 8, 34, 74, 0, 0, Math.PI * 2);
      ctx.clip(brilho);
      ctx.lineWidth = 22;
      ctx.strokeStyle = pele.borda;
      ctx.stroke(C);
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(56, -64); ctx.quadraticCurveTo(76, -58, 84, -44);
      ctx.lineWidth = 5; ctx.strokeStyle = pele.borda; ctx.stroke();
      if (pele.brilho) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.ellipse(-50, -40, 10, 24, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(62, 40, 6, 14, 0.5, 0, Math.PI * 2); ctx.fill();
      }
      // doente: tom esverdeado
      if (inst.doente > 0.01) {
        ctx.fillStyle = 'rgba(132,190,80,' + (0.38 * inst.doente) + ')';
        ctx.fillRect(-130, -130, 260, 260);
      }
      // sujeira
      const nSujo = Math.round(inst.sujeira * MANCHAS.length);
      for (let i = 0; i < nSujo; i++) {
        const [mx, my, r] = MANCHAS[i];
        ctx.fillStyle = 'rgba(107,78,46,0.55)';
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.arc(mx + r * 0.8, my + r * 0.5, r * 0.55, 0, Math.PI * 2);
        ctx.arc(mx - r * 0.6, my + r * 0.7, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      U.tinta(ctx, 6.4);
      ctx.stroke(C);

      // rosto
      const olharLocal = inst.calcOlhar(opts);
      rubor(ctx, p, pele);
      olho(ctx, OLHO_E, p, pele, olharLocal);
      olho(ctx, OLHO_D, p, pele, olharLocal);
      boca(ctx, p);
      p.bocaAb = bocaBase;

      // topo e acessórios
      const cab = opts.cabeca !== undefined ? opts.cabeca : inst.cabeca;
      const olh = opts.olhos !== undefined ? opts.olhos : inst.olhos;
      if (!(cab && ESCONDE_FOLHA[cab])) folha(ctx, pele);
      if (olh && ACESS[olh]) ACESS[olh](ctx);
      if (cab && ACESS[cab]) ACESS[cab](ctx);

      // gota de suor
      if (inst.suor) {
        const gy = -60 + ((t * 40) % 30);
        ctx.beginPath();
        ctx.moveTo(84, gy - 14);
        ctx.quadraticCurveTo(94, gy, 84, gy + 6);
        ctx.quadraticCurveTo(74, gy, 84, gy - 14);
        ctx.fillStyle = '#9ED8F0'; ctx.fill(); U.tinta(ctx, 2.6); ctx.stroke();
      }

      // gotas de água depois do banho
      if (inst.molhada > 0.05) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, inst.molhada * 2);
        [[-60, -30], [40, -50], [70, 30], [-30, 50], [10, -10]].forEach(([gx, gy], i) => {
          const yy = gy + ((t * 30 + i * 13) % 26);
          ctx.beginPath(); ctx.ellipse(gx, yy, 3.5, 5.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#CFF0FF'; ctx.fill();
          ctx.lineWidth = 1.6; ctx.strokeStyle = '#5B8E9C'; ctx.stroke();
        });
        ctx.restore();
      }

      // espuma
      if (inst.espuma.length) {
        inst.espuma.forEach((b) => {
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF'; ctx.fill();
          ctx.lineWidth = 1.8; ctx.strokeStyle = '#A9CFDA'; ctx.stroke();
          ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = '#E3F4F8'; ctx.fill();
        });
      }

      // faíscas da pele dourada
      if (pele.faisca) {
        for (let i = 0; i < 3; i++) {
          const ph = (t * 0.7 + i / 3) % 1;
          const a = i * 2.1 + Math.floor(t * 0.7 + i / 3) * 1.3;
          const r = 112;
          const fx = Math.cos(a) * r, fy = Math.sin(a) * r * 0.9;
          const s = Math.sin(ph * Math.PI) * 9;
          estrela(ctx, fx, fy, s, '#FFF1A6');
        }
      }

      ctx.restore();

      // ondinhas de fedor
      if (inst.fedor > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, inst.fedor);
        for (let i = 0; i < 3; i++) {
          const ph = (t * 0.55 + i / 3) % 1;
          const bx = x + (-62 + i * 62) * k;
          const by = yb - inst.pulo - (150 + ph * 70) * k;
          ctx.globalAlpha = Math.min(1, inst.fedor) * Math.sin(ph * Math.PI);
          ctx.beginPath();
          for (let s = 0; s <= 10; s++) {
            const yy = by - s * 4 * k;
            const xx = bx + Math.sin(s * 0.9 + t * 4 + i) * 7 * k;
            if (s === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
          }
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.lineWidth = 7 * k; ctx.strokeStyle = T; ctx.stroke();
          ctx.lineWidth = 3.6 * k; ctx.strokeStyle = '#A7C25E'; ctx.stroke();
        }
        ctx.restore();
      }

      // mosquinhas da sujeira
      if (inst.mosquinhas) {
        for (let i = 0; i < 3; i++) {
          const a = t * (2.4 + i * 0.6) + i * 2;
          const mx = x + Math.cos(a) * 110 * k + Math.sin(a * 2.3) * 12 * k;
          const my = yb - 150 * k + Math.sin(a * 1.4) * 40 * k - inst.pulo;
          ctx.fillStyle = T;
          ctx.beginPath(); ctx.arc(mx, my, 3.2 * k, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath(); ctx.ellipse(mx - 2 * k, my - 3 * k, 2.6 * k, 1.6 * k, -0.5, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(mx + 2 * k, my - 3 * k, 2.6 * k, 1.6 * k, 0.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    };

    inst.calcOlhar = function (opts) {
      const p = inst.p;
      let alvo = opts.olhar || inst.olhar;
      if (alvo && inst.ultimo) {
        const l = inst.local(alvo.x, alvo.y);
        const ex = (OLHO_E.x + OLHO_D.x) / 2, ey = (OLHO_E.y + OLHO_D.y) / 2;
        const dx = l.x - ex, dy = l.y - ey;
        const d = Math.max(1, Math.hypot(dx, dy));
        const f = Math.min(1, d / 90);
        return { x: (dx / d) * f, y: (dy / d) * f };
      }
      // mistura entre o olhar da expressão e o olhar livre
      const livre = inst.olharLivre;
      return { x: U.lerp(p.olharX, livre.x, 0.5), y: U.lerp(p.olharY, livre.y, 0.5) };
    };

    return inst;
  }

  function estrela(ctx, x, y, r, cor) {
    if (r <= 0.5) return;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fillStyle = cor; ctx.fill();
    U.tinta(ctx, 2); ctx.stroke();
  }

  CH.choru = { criar, PELES, EXP, estrela, ACESS };
})(window.CH);
