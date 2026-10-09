// Comidas, objetos e ícones desenhados em código, numa caixa de 100×100.
// Cada desenho vira imagem uma vez (para a interface) e também pode ser
// desenhado direto no canvas do jogo.
(function (CH) {
  const U = CH.U;
  const T = U.TINTA;
  const PI = Math.PI;

  function f(ctx, cor, construir, linha = 4.5) {
    ctx.beginPath();
    construir(ctx);
    if (cor) { ctx.fillStyle = cor; ctx.fill(); }
    if (linha) { U.tinta(ctx, linha); ctx.stroke(); }
  }
  function circulo(ctx, x, y, r, cor, linha = 4.5) {
    f(ctx, cor, (c) => c.arc(x, y, r, 0, PI * 2), linha);
  }
  function elipse(ctx, x, y, rx, ry, rot, cor, linha = 4.5) {
    f(ctx, cor, (c) => c.ellipse(x, y, rx, ry, rot, 0, PI * 2), linha);
  }
  function ret(ctx, x, y, w, h, r, cor, linha = 4.5) {
    f(ctx, cor, (c) => U.ret(c, x, y, w, h, r), linha);
  }
  function brilho(ctx, x1, y1, x2, y2, cx, cy, larg = 3.5, cor = 'rgba(255,255,255,0.85)') {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.lineWidth = larg; ctx.strokeStyle = cor; ctx.lineCap = 'round'; ctx.stroke();
  }
  function pontos(ctx, lista, r, cor) {
    ctx.fillStyle = cor;
    lista.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, PI * 2); ctx.fill(); });
  }
  function prato(ctx, y = 78) {
    elipse(ctx, 50, y, 42, 11, 0, '#F4F1EC');
    elipse(ctx, 50, y - 2, 30, 6, 0, null, 2.4);
  }

  const DES = {};

  // ---------- comidas ----------

  DES.coxinha = (ctx) => {
    f(ctx, '#E9A23B', (c) => {
      c.moveTo(50, 12);
      c.bezierCurveTo(62, 30, 86, 50, 84, 70);
      c.bezierCurveTo(82, 90, 62, 94, 50, 94);
      c.bezierCurveTo(38, 94, 18, 90, 16, 70);
      c.bezierCurveTo(14, 50, 38, 30, 50, 12);
    });
    pontos(ctx, [[36, 62], [58, 54], [66, 74], [44, 80], [52, 40], [30, 76]], 2.6, '#C2741F');
    brilho(ctx, 30, 70, 44, 34, 30, 48);
  };

  DES.pao_frances = (ctx) => {
    ctx.save(); ctx.translate(50, 54); ctx.rotate(-0.35);
    elipse(ctx, 0, 0, 42, 22, 0, '#E8A856');
    f(ctx, '#F7D9A2', (c) => { c.moveTo(-26, -2); c.quadraticCurveTo(0, -18, 28, -4); c.quadraticCurveTo(2, -6, -26, -2); }, 3);
    brilho(ctx, -30, 8, 10, 14, -12, 16, 3, 'rgba(255,255,255,0.5)');
    ctx.restore();
  };

  DES.pao_queijo = (ctx) => {
    circulo(ctx, 34, 62, 20, '#F2C46A');
    circulo(ctx, 66, 62, 20, '#F2C46A');
    circulo(ctx, 50, 40, 20, '#F5CD78');
    pontos(ctx, [[30, 58], [40, 68], [62, 66], [72, 56], [46, 36], [56, 44]], 2.4, '#D99A3E');
    brilho(ctx, 40, 32, 52, 26, 44, 26, 3);
  };

  DES.brigadeiro = (ctx) => {
    f(ctx, '#FFCB6E', (c) => {
      c.moveTo(18, 56);
      for (let i = 0; i <= 8; i++) c.lineTo(18 + i * 8, 56 + (i % 2 ? -4 : 0));
      c.lineTo(76, 88); c.lineTo(24, 88); c.closePath();
    });
    ctx.beginPath();
    [30, 40, 50, 60, 70].forEach((x) => { ctx.moveTo(x - 2, 60); ctx.lineTo(x - 4, 86); });
    ctx.lineWidth = 2.2; ctx.strokeStyle = '#ECA555'; ctx.stroke();
    circulo(ctx, 50, 44, 26, '#5A3420');
    ctx.fillStyle = '#2E1A0E';
    [[38, 34, 0.4], [52, 28, -0.6], [62, 40, 1.1], [44, 50, 0.2], [58, 54, -1], [34, 46, 1.4], [66, 30, 0.8], [48, 40, 2]].forEach(([x, y, a]) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-4, -1.6, 8, 3.2); ctx.restore();
    });
    brilho(ctx, 36, 28, 46, 22, 38, 22, 3);
  };

  DES.guarana = (ctx) => {
    ret(ctx, 28, 16, 44, 74, 10, '#2F8F3D');
    ctx.save(); ctx.beginPath(); U.ret(ctx, 28, 16, 44, 74, 10); ctx.clip();
    ctx.fillStyle = '#F2D04A'; ctx.fillRect(20, 44, 60, 18);
    ctx.fillStyle = '#E8333F'; ctx.beginPath(); ctx.arc(50, 53, 6, 0, PI * 2); ctx.fill();
    ctx.restore();
    ret(ctx, 28, 16, 44, 74, 10, null);
    elipse(ctx, 50, 17, 20, 5, 0, '#D9DCE0', 3.4);
    brilho(ctx, 36, 26, 36, 80, 33, 52, 4, 'rgba(255,255,255,0.55)');
  };

  DES.banana = (ctx) => {
    f(ctx, '#F7D64A', (c) => {
      c.moveTo(18, 28);
      c.bezierCurveTo(14, 70, 52, 92, 86, 72);
      c.bezierCurveTo(80, 66, 76, 66, 72, 68);
      c.bezierCurveTo(48, 76, 30, 56, 30, 28);
      c.closePath();
    });
    f(ctx, '#7A5A2E', (c) => { c.moveTo(18, 28); c.lineTo(16, 18); c.lineTo(28, 18); c.lineTo(30, 28); c.closePath(); }, 3.4);
    brilho(ctx, 24, 44, 52, 80, 28, 72, 3, 'rgba(255,255,255,0.6)');
  };

  DES.leite = (ctx) => {
    f(ctx, '#FBF7F0', (c) => { c.moveTo(26, 34); c.lineTo(50, 14); c.lineTo(74, 34); c.lineTo(74, 90); c.lineTo(26, 90); c.closePath(); });
    f(ctx, '#5B8E9C', (c) => { c.rect(26, 50, 48, 22); }, 0);
    f(ctx, null, (c) => { c.moveTo(26, 34); c.lineTo(50, 14); c.lineTo(74, 34); c.lineTo(74, 90); c.lineTo(26, 90); c.closePath(); });
    f(ctx, null, (c) => { c.moveTo(26, 34); c.lineTo(74, 34); }, 3);
    f(ctx, '#FFFFFF', (c) => { c.ellipse(50, 61, 9, 6, 0, 0, PI * 2); }, 2.6);
    ret(ctx, 44, 8, 12, 10, 2, '#F2F0EE', 3);
  };

  DES.ovo = (ctx) => {
    f(ctx, '#FFF7E8', (c) => {
      c.moveTo(50, 12);
      c.bezierCurveTo(74, 12, 84, 54, 80, 70);
      c.bezierCurveTo(76, 88, 62, 92, 50, 92);
      c.bezierCurveTo(38, 92, 24, 88, 20, 70);
      c.bezierCurveTo(16, 54, 26, 12, 50, 12);
    });
    brilho(ctx, 32, 58, 42, 26, 30, 36, 4);
  };

  DES.queijo = (ctx) => {
    f(ctx, '#F7D04A', (c) => { c.moveTo(12, 70); c.lineTo(80, 30); c.lineTo(88, 52); c.lineTo(88, 82); c.lineTo(12, 82); c.closePath(); });
    f(ctx, '#FBE07A', (c) => { c.moveTo(12, 70); c.lineTo(80, 30); c.lineTo(88, 52); c.lineTo(12, 70); c.closePath(); }, 3.4);
    [[34, 76, 5], [58, 72, 6], [76, 64, 4], [48, 60, 3.5]].forEach(([x, y, r]) => circulo(ctx, x, y, r, '#E2B437', 2.4));
  };

  DES.farinha = (ctx) => {
    f(ctx, '#EADBC0', (c) => {
      c.moveTo(30, 30);
      c.bezierCurveTo(18, 50, 16, 88, 30, 90);
      c.lineTo(70, 90);
      c.bezierCurveTo(84, 88, 82, 50, 70, 30);
      c.closePath();
    });
    f(ctx, '#EADBC0', (c) => { c.moveTo(30, 30); c.lineTo(36, 14); c.lineTo(50, 22); c.lineTo(64, 14); c.lineTo(70, 30); c.closePath(); }, 3.6);
    ret(ctx, 32, 26, 36, 7, 3, '#C79A5A', 3);
    f(ctx, '#FFFFFF', (c) => c.ellipse(50, 62, 14, 12, 0, 0, PI * 2), 2.6);
    pontos(ctx, [[22, 16], [80, 20], [86, 32]], 3, '#FFFFFF');
  };

  DES.aipo = (ctx) => {
    [[34, -0.12], [50, 0], [66, 0.12]].forEach(([x, a]) => {
      ctx.save(); ctx.translate(x, 90); ctx.rotate(a);
      ret(ctx, -7, -62, 14, 62, 6, '#9CD167', 3.6);
      ctx.beginPath(); ctx.moveTo(-2, -56); ctx.lineTo(-2, -6); ctx.lineWidth = 2.2; ctx.strokeStyle = '#6FA548'; ctx.stroke();
      ctx.restore();
    });
    [[30, 24], [48, 18], [66, 24], [40, 30], [58, 30]].forEach(([x, y]) => circulo(ctx, x, y, 9, '#6DB23F', 3.2));
  };

  DES.pessego = (ctx) => {
    f(ctx, '#FFB287', (c) => {
      c.moveTo(50, 28);
      c.bezierCurveTo(76, 14, 94, 48, 82, 70);
      c.bezierCurveTo(74, 88, 58, 92, 50, 90);
      c.bezierCurveTo(42, 92, 26, 88, 18, 70);
      c.bezierCurveTo(6, 48, 24, 14, 50, 28);
    });
    ctx.save(); ctx.beginPath(); ctx.ellipse(36, 58, 26, 34, 0.1, 0, PI * 2); ctx.fillStyle = 'rgba(236,135,91,0.6)'; ctx.fill(); ctx.restore();
    f(ctx, null, (c) => { c.moveTo(50, 30); c.quadraticCurveTo(44, 60, 52, 88); }, 3);
    f(ctx, '#A3D16D', (c) => { c.moveTo(52, 26); c.quadraticCurveTo(66, 6, 84, 14); c.quadraticCurveTo(70, 28, 52, 26); }, 3.6);
    brilho(ctx, 66, 38, 76, 58, 76, 44, 3.4);
  };

  DES.maca = (ctx) => {
    f(ctx, '#D9283A', (c) => {
      c.moveTo(50, 30);
      c.bezierCurveTo(70, 16, 92, 34, 86, 62);
      c.bezierCurveTo(82, 84, 62, 94, 50, 86);
      c.bezierCurveTo(38, 94, 18, 84, 14, 62);
      c.bezierCurveTo(8, 34, 30, 16, 50, 30);
    });
    f(ctx, null, (c) => { c.moveTo(50, 32); c.lineTo(54, 14); }, 5);
    f(ctx, '#7DBA4A', (c) => { c.moveTo(54, 20); c.quadraticCurveTo(70, 8, 80, 18); c.quadraticCurveTo(66, 28, 54, 20); }, 3.4);
    brilho(ctx, 26, 46, 30, 66, 22, 54, 4);
  };

  DES.pastel = (ctx) => {
    f(ctx, '#F0BE58', (c) => { c.moveTo(10, 72); c.bezierCurveTo(10, 18, 90, 18, 90, 72); c.closePath(); });
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = PI + (i / 12) * PI;
      const x = 50 + Math.cos(a) * 36, y = 70 + Math.sin(a) * 40;
      ctx.moveTo(x, y); ctx.lineTo(50 + Math.cos(a) * 30, 70 + Math.sin(a) * 33);
    }
    ctx.lineWidth = 2.4; ctx.strokeStyle = '#C98A2E'; ctx.stroke();
    pontos(ctx, [[42, 52], [58, 48], [50, 60]], 4, '#F7DC9A');
  };

  DES.pipoca = (ctx) => {
    const balde = (c) => { c.moveTo(22, 40); c.lineTo(78, 40); c.lineTo(70, 92); c.lineTo(30, 92); c.closePath(); };
    [[22, 18], [36, 12], [52, 10], [66, 14], [78, 20], [30, 30], [46, 24], [62, 26], [72, 32]].forEach(([x, y]) => circulo(ctx, x, y + 6, 10, '#FFF6D6', 3));
    f(ctx, '#FBF5EE', balde);
    ctx.save(); ctx.beginPath(); balde(ctx); ctx.clip();
    ctx.fillStyle = '#F24B64';
    [28, 48, 68].forEach((x) => { ctx.beginPath(); ctx.moveTo(x - 6, 40); ctx.lineTo(x + 6, 40); ctx.lineTo(x + 4, 92); ctx.lineTo(x - 4, 92); ctx.closePath(); ctx.fill(); });
    ctx.restore();
    f(ctx, null, balde);
  };

  DES.morango = (ctx) => {
    f(ctx, '#E8394A', (c) => {
      c.moveTo(50, 92);
      c.bezierCurveTo(24, 76, 14, 46, 24, 34);
      c.bezierCurveTo(34, 24, 66, 24, 76, 34);
      c.bezierCurveTo(86, 46, 76, 76, 50, 92);
    });
    pontos(ctx, [[36, 46], [50, 42], [64, 46], [40, 60], [56, 60], [48, 74], [32, 34], [68, 34]], 2.4, '#FFE27A');
    f(ctx, '#6DB23F', (c) => {
      c.moveTo(30, 30); c.lineTo(42, 20); c.lineTo(50, 28); c.lineTo(58, 18); c.lineTo(70, 30); c.lineTo(56, 34); c.lineTo(50, 40); c.lineTo(44, 34); c.closePath();
    }, 3.4);
  };

  DES.picole = (ctx) => {
    ret(ctx, 44, 64, 12, 30, 5, '#E2B77A', 3.6);
    f(ctx, '#F7798B', (c) => U.ret(c, 26, 10, 48, 62, 22));
    f(ctx, '#FBF5EE', (c) => { c.moveTo(26, 30); c.quadraticCurveTo(50, 20, 74, 30); c.lineTo(74, 32); c.quadraticCurveTo(50, 22, 26, 32); c.closePath(); }, 0);
    f(ctx, '#F7798B', (c) => c.ellipse(64, 74, 4, 7, 0, 0, PI * 2), 2.6);
    brilho(ctx, 36, 22, 36, 56, 32, 40, 4, 'rgba(255,255,255,0.6)');
  };

  DES.melancia = (ctx) => {
    f(ctx, '#5DA03A', (c) => { c.moveTo(8, 36); c.quadraticCurveTo(50, 110, 92, 36); c.closePath(); });
    f(ctx, '#F2F7E0', (c) => { c.moveTo(14, 36); c.quadraticCurveTo(50, 100, 86, 36); c.closePath(); }, 0);
    f(ctx, '#F2505F', (c) => { c.moveTo(18, 36); c.quadraticCurveTo(50, 92, 82, 36); c.closePath(); }, 3);
    ctx.fillStyle = T;
    [[34, 46], [50, 50], [66, 46], [42, 60], [58, 60]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 2.6, 4, 0, 0, PI * 2); ctx.fill(); });
    f(ctx, null, (c) => { c.moveTo(8, 36); c.quadraticCurveTo(50, 110, 92, 36); c.closePath(); });
  };

  DES.pizza = (ctx) => {
    f(ctx, '#F6C84A', (c) => { c.moveTo(50, 92); c.lineTo(14, 22); c.quadraticCurveTo(50, 8, 86, 22); c.closePath(); });
    f(ctx, '#D99A3E', (c) => { c.moveTo(14, 22); c.quadraticCurveTo(50, 8, 86, 22); c.lineTo(82, 30); c.quadraticCurveTo(50, 18, 18, 30); c.closePath(); }, 3.6);
    [[40, 40], [58, 42], [50, 62], [34, 30]].forEach(([x, y]) => circulo(ctx, x, y, 6.5, '#C0392B', 2.6));
    f(ctx, '#F6C84A', (c) => c.ellipse(66, 64, 3.4, 7, 0, 0, PI * 2), 2.2);
  };

  DES.suco_abacaxi = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(74, 46); c.bezierCurveTo(94, 46, 94, 74, 72, 74); }, 6);
    f(ctx, '#E8823A', (c) => U.ret(c, 22, 32, 54, 60, 16));
    ctx.save(); ctx.beginPath(); U.ret(ctx, 22, 32, 54, 60, 16); ctx.clip();
    ctx.beginPath();
    for (let i = -4; i < 8; i++) { ctx.moveTo(10 + i * 12, 30); ctx.lineTo(50 + i * 12, 96); ctx.moveTo(90 - i * 12, 30); ctx.lineTo(50 - i * 12, 96); }
    ctx.lineWidth = 2.2; ctx.strokeStyle = '#C65F24'; ctx.stroke();
    ctx.restore();
    f(ctx, null, (c) => U.ret(c, 22, 32, 54, 60, 16));
    [[-0.5, 30], [-0.2, 36], [0.15, 34], [0.5, 30]].forEach(([a, h]) => {
      ctx.save(); ctx.translate(49, 34); ctx.rotate(a);
      f(ctx, '#6DB23F', (c) => { c.moveTo(-6, 0); c.quadraticCurveTo(0, -h * 1.1, 2, -h); c.quadraticCurveTo(4, -h * 0.5, 6, 0); c.closePath(); }, 3);
      ctx.restore();
    });
  };

  DES.acai = (ctx) => {
    f(ctx, '#4B1E5A', (c) => c.ellipse(50, 46, 38, 12, 0, 0, PI * 2));
    pontos(ctx, [[34, 44], [44, 40], [58, 42], [66, 48], [40, 50]], 3, '#C08A4A');
    [[46, 44], [60, 46]].forEach(([x, y]) => circulo(ctx, x, y, 6, '#F7E3A0', 2.4));
    f(ctx, '#E6F3F8', (c) => { c.moveTo(12, 46); c.quadraticCurveTo(14, 90, 50, 90); c.quadraticCurveTo(86, 90, 88, 46); c.quadraticCurveTo(50, 60, 12, 46); });
    f(ctx, '#5B8E9C', (c) => { c.moveTo(18, 62); c.quadraticCurveTo(50, 74, 82, 62); c.lineTo(80, 68); c.quadraticCurveTo(50, 80, 20, 68); c.closePath(); }, 0);
    f(ctx, null, (c) => c.ellipse(50, 46, 38, 12, 0, 0, PI * 2));
  };

  // ---------- pratos do fogão ----------

  DES.misto = (ctx) => {
    prato(ctx);
    f(ctx, '#E8B064', (c) => { c.moveTo(16, 70); c.lineTo(50, 22); c.lineTo(84, 70); c.closePath(); });
    f(ctx, '#F7D04A', (c) => { c.moveTo(24, 66); c.lineTo(76, 66); c.lineTo(72, 74); c.lineTo(60, 72); c.lineTo(54, 80); c.lineTo(46, 72); c.lineTo(28, 74); c.closePath(); }, 3);
    f(ctx, '#F2C47A', (c) => { c.moveTo(22, 64); c.lineTo(50, 28); c.lineTo(78, 64); c.closePath(); }, 3.4);
    ctx.beginPath(); ctx.moveTo(38, 52); ctx.lineTo(50, 40); ctx.moveTo(50, 56); ctx.lineTo(62, 44);
    ctx.lineWidth = 3; ctx.strokeStyle = '#B87A30'; ctx.stroke();
  };

  DES.omelete = (ctx) => {
    prato(ctx);
    f(ctx, '#F7D44A', (c) => { c.moveTo(14, 70); c.bezierCurveTo(14, 30, 86, 30, 86, 70); c.closePath(); });
    pontos(ctx, [[36, 50], [56, 46], [66, 58], [44, 62]], 3.2, '#5DA03A');
    pontos(ctx, [[50, 54], [30, 60]], 3, '#E8394A');
  };

  DES.vitamina = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(56, 30); c.lineTo(70, 6); }, 6);
    ctx.beginPath(); ctx.moveTo(56, 30); ctx.lineTo(70, 6); ctx.lineWidth = 3; ctx.strokeStyle = '#F24B64'; ctx.stroke();
    f(ctx, '#F7E7A6', (c) => { c.moveTo(28, 26); c.lineTo(72, 26); c.lineTo(66, 92); c.lineTo(34, 92); c.closePath(); });
    f(ctx, 'rgba(255,255,255,0.55)', (c) => { c.moveTo(28, 26); c.lineTo(72, 26); c.lineTo(71, 36); c.lineTo(29, 36); c.closePath(); }, 0);
    circulo(ctx, 28, 28, 10, '#F7E3A0', 3.4);
    f(ctx, null, (c) => { c.moveTo(28, 26); c.lineTo(72, 26); c.lineTo(66, 92); c.lineTo(34, 92); c.closePath(); });
    brilho(ctx, 36, 44, 40, 84, 36, 64, 3.4, 'rgba(255,255,255,0.6)');
  };

  DES.pudim = (ctx) => {
    prato(ctx, 82);
    f(ctx, '#F7D27A', (c) => { c.moveTo(26, 78); c.lineTo(34, 30); c.lineTo(66, 30); c.lineTo(74, 78); c.closePath(); });
    f(ctx, '#A0521E', (c) => {
      c.moveTo(33, 34); c.lineTo(34, 30); c.lineTo(66, 30); c.lineTo(67, 34);
      c.quadraticCurveTo(64, 46, 60, 40); c.quadraticCurveTo(54, 50, 50, 40); c.quadraticCurveTo(44, 52, 40, 40); c.quadraticCurveTo(36, 46, 33, 34);
    }, 3);
    elipse(ctx, 50, 30, 16, 4.5, 0, '#8A4419', 3);
  };

  DES.milkshake = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(58, 24); c.lineTo(72, 2); }, 6);
    ctx.beginPath(); ctx.moveTo(58, 24); ctx.lineTo(72, 2); ctx.lineWidth = 3; ctx.strokeStyle = '#5B8E9C'; ctx.stroke();
    [[34, 26, 11], [50, 20, 13], [66, 26, 11]].forEach(([x, y, r]) => circulo(ctx, x, y, r, '#FFFFFF', 3.4));
    f(ctx, '#F7A6B5', (c) => { c.moveTo(26, 30); c.lineTo(74, 30); c.lineTo(66, 92); c.lineTo(34, 92); c.closePath(); });
    circulo(ctx, 50, 8, 7, '#E8394A', 3);
    brilho(ctx, 36, 42, 40, 84, 36, 64, 3.4, 'rgba(255,255,255,0.6)');
  };

  DES.bolo = (ctx) => {
    prato(ctx, 84);
    f(ctx, '#E9B872', (c) => U.ret(c, 18, 40, 64, 42, 8));
    f(ctx, '#6B3A1E', (c) => {
      c.moveTo(18, 52); c.lineTo(18, 46); c.quadraticCurveTo(18, 38, 26, 38); c.lineTo(74, 38); c.quadraticCurveTo(82, 38, 82, 46); c.lineTo(82, 54);
      c.quadraticCurveTo(76, 62, 72, 52); c.quadraticCurveTo(64, 66, 58, 52); c.quadraticCurveTo(50, 62, 44, 52); c.quadraticCurveTo(36, 66, 30, 52); c.quadraticCurveTo(24, 60, 18, 52);
    }, 3.4);
    ret(ctx, 47, 14, 6, 24, 2, '#F24B64', 3);
    f(ctx, '#FFCB6E', (c) => { c.moveTo(50, 2); c.quadraticCurveTo(56, 10, 50, 14); c.quadraticCurveTo(44, 10, 50, 2); }, 2.6);
  };

  DES.fornada = (ctx) => {
    ret(ctx, 8, 52, 84, 34, 8, '#9AA3A8');
    ret(ctx, 14, 56, 72, 26, 5, '#C5CCD0', 2.6);
    [[24, 50], [42, 46], [60, 46], [78, 50], [33, 36], [51, 32], [69, 36]].forEach(([x, y]) => circulo(ctx, x, y + 6, 11, '#F2C46A', 3.2));
    pontos(ctx, [[22, 54], [44, 50], [62, 52], [52, 36], [70, 42]], 2, '#D99A3E');
  };

  DES.torta_banana = (ctx) => {
    f(ctx, '#D99A3E', (c) => { c.moveTo(10, 56); c.lineTo(90, 56); c.lineTo(82, 82); c.lineTo(18, 82); c.closePath(); });
    elipse(ctx, 50, 54, 42, 16, 0, '#F2C46A');
    [[30, 52], [46, 48], [62, 50], [74, 56], [40, 60], [58, 60]].forEach(([x, y]) => elipse(ctx, x, y, 7, 4.5, 0, '#F7E3A0', 2.4));
    pontos(ctx, [[30, 52], [46, 48], [62, 50]], 1.4, '#B88A3A');
  };

  DES.gororoba = (ctx) => {
    prato(ctx);
    f(ctx, '#7D8A5A', (c) => {
      c.moveTo(20, 72); c.bezierCurveTo(16, 48, 36, 36, 50, 44); c.bezierCurveTo(62, 30, 86, 46, 80, 72); c.closePath();
    });
    pontos(ctx, [[36, 58], [56, 52], [66, 64]], 4, '#5A6640');
    [[34, 26], [52, 18], [68, 28]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.bezierCurveTo(x - 8, y + 6, x + 8, y, x, y - 8);
      ctx.lineWidth = 3.4; ctx.strokeStyle = '#8A8F96'; ctx.stroke();
    });
  };

  DES.remedio = (ctx) => {
    ctx.save(); ctx.translate(50, 52); ctx.rotate(-0.6);
    f(ctx, '#F24B64', (c) => { c.moveTo(0, -16); c.lineTo(-24, -16); c.arc(-24, 0, 16, -PI / 2, PI / 2, true); c.lineTo(0, 16); c.closePath(); });
    f(ctx, '#FBF5EE', (c) => { c.moveTo(0, -16); c.lineTo(24, -16); c.arc(24, 0, 16, -PI / 2, PI / 2); c.lineTo(0, 16); c.closePath(); });
    brilho(ctx, -30, -8, -6, -8, -18, -11, 3.4);
    ctx.restore();
  };

  // ---------- ícones de status e botões ----------

  DES.i_fome = (ctx) => {
    ctx.save(); ctx.translate(50, 54); ctx.scale(0.86, 0.86); ctx.translate(-50, -54);
    DES.coxinha(ctx);
    ctx.restore();
  };
  DES.i_higiene = (ctx) => {
    circulo(ctx, 40, 58, 26, '#BFE3EE');
    circulo(ctx, 70, 34, 15, '#BFE3EE');
    circulo(ctx, 72, 72, 11, '#BFE3EE');
    brilho(ctx, 26, 52, 34, 40, 26, 42, 4.5, '#FFFFFF');
    brilho(ctx, 64, 30, 68, 25, 64, 26, 3.5, '#FFFFFF');
  };
  DES.i_energia = (ctx) => {
    f(ctx, '#FFCB6E', (c) => { c.moveTo(58, 6); c.lineTo(22, 56); c.lineTo(46, 56); c.lineTo(38, 94); c.lineTo(78, 40); c.lineTo(54, 40); c.closePath(); });
    brilho(ctx, 52, 18, 34, 46, 40, 30, 3.4, '#FFF3C4');
  };
  DES.i_diversao = (ctx) => {
    f(ctx, '#5B8E9C', (c) => {
      c.moveTo(24, 32); c.lineTo(76, 32); c.bezierCurveTo(96, 32, 100, 84, 82, 84); c.bezierCurveTo(70, 84, 68, 70, 60, 70);
      c.lineTo(40, 70); c.bezierCurveTo(32, 70, 30, 84, 18, 84); c.bezierCurveTo(0, 84, 4, 32, 24, 32);
    });
    f(ctx, '#FBF5EE', (c) => { c.rect(22, 46, 16, 6); c.rect(27, 41, 6, 16); }, 0);
    circulo(ctx, 70, 44, 5, '#F24B64', 2.6);
    circulo(ctx, 78, 54, 5, '#FFCB6E', 2.6);
  };
  DES.i_saude = (ctx) => {
    f(ctx, '#F24B64', (c) => {
      c.moveTo(50, 90); c.bezierCurveTo(10, 62, 6, 36, 20, 24); c.bezierCurveTo(32, 14, 46, 20, 50, 32);
      c.bezierCurveTo(54, 20, 68, 14, 80, 24); c.bezierCurveTo(94, 36, 90, 62, 50, 90);
    });
    f(ctx, '#FBF5EE', (c) => { c.rect(44, 36, 12, 32); c.rect(34, 46, 32, 12); }, 2.6);
    brilho(ctx, 22, 40, 30, 28, 22, 30, 4, '#FFFFFF');
  };
  DES.i_moeda = (ctx) => {
    circulo(ctx, 50, 50, 40, '#FFCB6E');
    circulo(ctx, 50, 50, 29, '#ECA555', 3);
    // maçãzinha em relevo
    f(ctx, '#FFE9AD', (c) => {
      c.moveTo(50, 40); c.bezierCurveTo(60, 32, 70, 42, 66, 56); c.bezierCurveTo(62, 68, 54, 68, 50, 64);
      c.bezierCurveTo(46, 68, 38, 68, 34, 56); c.bezierCurveTo(30, 42, 40, 32, 50, 40);
    }, 3);
    f(ctx, null, (c) => { c.moveTo(50, 40); c.lineTo(53, 30); }, 3.4);
    brilho(ctx, 24, 42, 34, 22, 24, 28, 4, '#FFF6D6');
  };
  DES.i_estrela = (ctx) => {
    f(ctx, '#FFCB6E', (c) => {
      for (let i = 0; i < 10; i++) {
        const a = -PI / 2 + (i * PI) / 5, r = i % 2 ? 18 : 42;
        const x = 50 + Math.cos(a) * r, y = 54 + Math.sin(a) * r;
        if (i) c.lineTo(x, y); else c.moveTo(x, y);
      }
      c.closePath();
    });
  };
  DES.geladeira = (ctx) => {
    ret(ctx, 22, 6, 56, 88, 10, '#E6F3F8');
    f(ctx, null, (c) => { c.moveTo(22, 38); c.lineTo(78, 38); }, 4);
    ret(ctx, 64, 16, 6, 14, 3, '#9AA3A8', 2.6);
    ret(ctx, 64, 46, 6, 22, 3, '#9AA3A8', 2.6);
    brilho(ctx, 30, 46, 30, 84, 28, 64, 3.4, '#FFFFFF');
  };
  DES.fogao = (ctx) => {
    ret(ctx, 12, 40, 76, 52, 6, '#E6F3F8');
    ret(ctx, 20, 58, 60, 28, 4, '#4B6765', 3);
    [26, 42, 58, 74].forEach((x) => circulo(ctx, x, 48, 4, '#9AA3A8', 2.4));
    f(ctx, '#4A3F45', (c) => U.ret(c, 22, 18, 48, 18, 6));
    f(ctx, null, (c) => { c.moveTo(70, 26); c.lineTo(92, 22); }, 6);
    [32, 46, 60].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 12); ctx.bezierCurveTo(x - 5, 6, x + 5, 2, x, -4); ctx.lineWidth = 3; ctx.strokeStyle = '#9AA3A8'; ctx.stroke(); });
  };
  DES.livro = (ctx) => {
    f(ctx, '#FBF5EE', (c) => U.ret(c, 26, 18, 56, 74, 6));
    f(ctx, '#8C6FB8', (c) => U.ret(c, 18, 10, 56, 74, 6));
    f(ctx, '#6C52A0', (c) => { c.rect(18, 10, 10, 74); }, 0);
    f(ctx, null, (c) => U.ret(c, 18, 10, 56, 74, 6));
    f(ctx, '#FFCB6E', (c) => U.ret(c, 36, 30, 30, 18, 4), 3);
    ctx.fillStyle = T; ctx.font = '12px "Gochi Hand", cursive'; ctx.textAlign = 'center';
    ctx.fillText('Receitas', 51, 43);
  };
  DES.loja = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(36, 34); c.bezierCurveTo(36, 8, 64, 8, 64, 34); }, 6);
    f(ctx, '#F24B64', (c) => { c.moveTo(18, 30); c.lineTo(82, 30); c.lineTo(88, 92); c.lineTo(12, 92); c.closePath(); });
    f(ctx, '#FFCB6E', (c) => { c.arc(50, 60, 14, 0, PI * 2); }, 3);
    f(ctx, null, (c) => { c.moveTo(18, 30); c.lineTo(82, 30); c.lineTo(88, 92); c.lineTo(12, 92); c.closePath(); });
  };
  DES.sabonete = (ctx) => {
    circulo(ctx, 74, 22, 9, '#E6F3F8', 3);
    circulo(ctx, 86, 38, 6, '#E6F3F8', 2.6);
    circulo(ctx, 22, 26, 7, '#E6F3F8', 2.6);
    f(ctx, '#F7A6B5', (c) => U.ret(c, 14, 36, 72, 50, 22));
    f(ctx, '#FBD0D8', (c) => U.ret(c, 24, 44, 52, 26, 13), 3);
    brilho(ctx, 30, 52, 46, 48, 36, 47, 3.4, '#FFFFFF');
  };
  DES.chuveiro = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(80, 6); c.lineTo(80, 20); c.quadraticCurveTo(80, 28, 64, 28); }, 7);
    ctx.beginPath(); ctx.moveTo(80, 6); ctx.lineTo(80, 20); ctx.quadraticCurveTo(80, 28, 64, 28); ctx.lineWidth = 3; ctx.strokeStyle = '#C5CCD0'; ctx.stroke();
    f(ctx, '#C5CCD0', (c) => { c.moveTo(28, 50); c.quadraticCurveTo(28, 22, 64, 24); c.lineTo(70, 30); c.quadraticCurveTo(70, 56, 44, 62); c.closePath(); });
    [[30, 72], [44, 78], [56, 70], [40, 92], [58, 88], [22, 86]].forEach(([x, y]) => {
      f(ctx, '#7FC4D3', (c) => { c.moveTo(x, y - 9); c.quadraticCurveTo(x + 6, y, x, y + 4); c.quadraticCurveTo(x - 6, y, x, y - 9); }, 2.6);
    });
  };
  DES.vaso = (ctx) => {
    ret(ctx, 24, 6, 52, 30, 6, '#FBF7F0');
    f(ctx, '#FBF7F0', (c) => { c.moveTo(14, 46); c.lineTo(86, 46); c.quadraticCurveTo(86, 74, 62, 78); c.lineTo(66, 94); c.lineTo(34, 94); c.lineTo(38, 78); c.quadraticCurveTo(14, 74, 14, 46); });
    elipse(ctx, 50, 46, 38, 10, 0, '#E6F3F8');
    elipse(ctx, 50, 46, 24, 5, 0, '#7FC4D3', 2.6);
    ret(ctx, 62, 14, 10, 6, 2, '#9AA3A8', 2.4);
  };
  DES.luz = (ctx) => {
    f(ctx, '#FFE9AD', (c) => { c.arc(50, 40, 28, PI * 0.8, PI * 2.2); c.lineTo(62, 70); c.lineTo(38, 70); c.closePath(); });
    ret(ctx, 36, 70, 28, 18, 4, '#9AA3A8');
    f(ctx, null, (c) => { c.moveTo(36, 78); c.lineTo(64, 78); }, 3);
    brilho(ctx, 36, 34, 46, 22, 36, 24, 4, '#FFFFFF');
  };
  DES.lua = (ctx) => {
    f(ctx, '#FFE9AD', (c) => { c.arc(50, 50, 36, PI * 0.35, PI * 1.65); c.bezierCurveTo(48, 28, 46, 72, 64, 82); });
    pontos(ctx, [[34, 42], [40, 64]], 4, '#F2D58A');
    DES.mini_estrela(ctx, 78, 30, 9);
  };
  DES.mini_estrela = (ctx, x, y, r) => CH.choru.estrela(ctx, x, y, r, '#FFFFFF');
  DES.cabide = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(50, 38); c.lineTo(50, 28); c.bezierCurveTo(50, 18, 64, 16, 64, 26); }, 5);
    f(ctx, '#E2B77A', (c) => { c.moveTo(50, 38); c.lineTo(88, 70); c.quadraticCurveTo(92, 76, 84, 76); c.lineTo(16, 76); c.quadraticCurveTo(8, 76, 12, 70); c.closePath(); });
    f(ctx, '#8C6FB8', (c) => { c.moveTo(24, 70); c.lineTo(76, 70); c.lineTo(72, 92); c.lineTo(28, 92); c.closePath(); }, 3.4);
  };
  DES.chuva = (ctx) => {
    ctx.save(); ctx.translate(18, 4); ctx.scale(0.42, 0.42); DES.coxinha(ctx); ctx.restore();
    ctx.save(); ctx.translate(54, 16); ctx.scale(0.4, 0.4); DES.brigadeiro(ctx); ctx.restore();
    ctx.save(); ctx.translate(30, 46); ctx.scale(0.5, 0.5); DES.pao_queijo(ctx); ctx.restore();
    [[22, 50], [78, 62], [60, 8]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.lineWidth = 3.4; ctx.strokeStyle = '#5B8E9C'; ctx.stroke(); });
  };
  DES.pulo = (ctx) => {
    f(ctx, '#FFFFFF', (c) => {
      c.moveTo(14, 82); c.bezierCurveTo(6, 66, 26, 58, 34, 66); c.bezierCurveTo(38, 52, 62, 52, 66, 66); c.bezierCurveTo(78, 58, 96, 70, 86, 82); c.closePath();
    });
    f(ctx, null, (c) => { c.moveTo(50, 48); c.lineTo(50, 12); c.moveTo(38, 24); c.lineTo(50, 10); c.lineTo(62, 24); }, 6);
  };
  // Ícone do Tetris: um T roxo encaixado num L rosa.
  DES.blocos = (ctx) => {
    const b = (x, y, cor) => {
      f(ctx, cor, (c) => U.ret(c, x, y, 26, 26, 6), 3.6);
      brilho(ctx, x + 6, y + 15, x + 15, y + 6, x + 6, y + 6, 3, 'rgba(255,255,255,0.8)');
    };
    [[11, 12], [37, 12], [63, 12], [37, 38]].forEach(([x, y]) => b(x, y, '#8C6FB8'));
    [[63, 38], [11, 64], [37, 64], [63, 64]].forEach(([x, y]) => b(x, y, '#F24B64'));
  };

  // Bateria carregando (três quadros da animação), pra energia enquanto ela dorme.
  [1, 2, 3].forEach((n) => {
    DES['bateria' + n] = (ctx) => {
      f(ctx, '#FBF5EE', (c) => U.ret(c, 14, 24, 64, 52, 10));
      f(ctx, '#272322', (c) => U.ret(c, 80, 40, 8, 20, 3), 0);
      const larg = (52 * n) / 3;
      f(ctx, '#8BD15A', (c) => U.ret(c, 20, 30, larg, 40, 6), 0);
      f(ctx, null, (c) => U.ret(c, 14, 24, 64, 52, 10));
      f(ctx, '#FFCB6E', (c) => { c.moveTo(52, 26); c.lineTo(36, 52); c.lineTo(48, 52); c.lineTo(42, 76); c.lineTo(60, 46); c.lineTo(48, 46); c.closePath(); }, 3.4);
    };
  });

  // Balão de conversa do chat.
  DES.chat = (ctx) => {
    f(ctx, '#FFFFFF', (c) => {
      c.moveTo(22, 18); c.lineTo(78, 18); c.quadraticCurveTo(92, 18, 92, 32); c.lineTo(92, 58);
      c.quadraticCurveTo(92, 72, 78, 72); c.lineTo(46, 72); c.lineTo(26, 88); c.lineTo(30, 72); c.lineTo(22, 72);
      c.quadraticCurveTo(8, 72, 8, 58); c.lineTo(8, 32); c.quadraticCurveTo(8, 18, 22, 18); c.closePath();
    });
    [30, 50, 70].forEach((x, i) => circulo(ctx, x, 45, 6.5, ['#F24B64', '#FFCB6E', '#5B8E9C'][i], 3));
  };

  DES.vr_icone = (ctx) => {
    ret(ctx, 10, 30, 80, 42, 16, '#F2F0EE');
    ret(ctx, 18, 38, 64, 26, 10, '#2E2A33', 3);
    f(ctx, null, (c) => { c.moveTo(26, 46); c.lineTo(42, 46); }, 0);
    ctx.beginPath(); ctx.moveTo(26, 46); ctx.lineTo(42, 46); ctx.lineWidth = 4; ctx.strokeStyle = '#7FC4D3'; ctx.stroke();
    ret(ctx, 40, 64, 20, 10, 4, '#F2F0EE', 3);
  };
  DES.passear = (ctx) => {
    f(ctx, '#7FC4D3', (c) => c.arc(50, 50, 42, 0, PI * 2));
    ctx.save(); ctx.beginPath(); ctx.arc(50, 50, 42, 0, PI * 2); ctx.clip();
    f(ctx, '#FFCB6E', (c) => c.arc(70, 34, 12, 0, PI * 2), 3);
    f(ctx, '#7DBA4A', (c) => { c.moveTo(0, 74); c.quadraticCurveTo(50, 52, 100, 74); c.lineTo(100, 100); c.lineTo(0, 100); c.closePath(); }, 3.4);
    ctx.fillStyle = '#FBF5EE';
    ctx.fillRect(0, 84, 100, 20);
    ctx.beginPath();
    for (let x = 0; x < 100; x += 16) { ctx.moveTo(x, 92); ctx.quadraticCurveTo(x + 4, 86, x + 8, 92); ctx.quadraticCurveTo(x + 12, 98, x + 16, 92); }
    ctx.lineWidth = 3; ctx.strokeStyle = T; ctx.stroke();
    ctx.restore();
    f(ctx, null, (c) => c.arc(50, 50, 42, 0, PI * 2));
  };
  DES.engrenagem = (ctx) => {
    f(ctx, '#E6F3F8', (c) => {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * PI * 2, r = i % 2 ? 30 : 40;
        const a2 = a + PI / 16;
        c.lineTo(50 + Math.cos(a) * r, 50 + Math.sin(a) * r);
        c.lineTo(50 + Math.cos(a2) * r, 50 + Math.sin(a2) * r);
      }
      c.closePath();
    });
    circulo(ctx, 50, 50, 12, '#5B8E9C', 4);
  };
  DES.vassoura = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(78, 8); c.lineTo(48, 56); }, 7);
    ctx.beginPath(); ctx.moveTo(78, 8); ctx.lineTo(48, 56); ctx.lineWidth = 3; ctx.strokeStyle = '#E2B77A'; ctx.stroke();
    f(ctx, '#FFCB6E', (c) => { c.moveTo(40, 50); c.lineTo(58, 62); c.lineTo(44, 94); c.lineTo(10, 74); c.closePath(); });
    ctx.beginPath(); ctx.moveTo(32, 64); ctx.lineTo(20, 80); ctx.moveTo(42, 70); ctx.lineTo(30, 88); ctx.lineWidth = 2.4; ctx.strokeStyle = '#ECA555'; ctx.stroke();
  };
  DES.caquinha = (ctx) => {
    f(ctx, '#8A5A34', (c) => {
      c.moveTo(14, 86); c.quadraticCurveTo(10, 70, 26, 68); c.quadraticCurveTo(22, 52, 40, 50); c.quadraticCurveTo(40, 30, 54, 26);
      c.quadraticCurveTo(52, 38, 64, 46); c.quadraticCurveTo(78, 52, 72, 66); c.quadraticCurveTo(90, 70, 86, 86); c.closePath();
    });
    brilho(ctx, 30, 72, 44, 66, 36, 66, 3.4, 'rgba(255,255,255,0.45)');
    brilho(ctx, 46, 54, 58, 50, 52, 49, 3, 'rgba(255,255,255,0.45)');
  };
  DES.fechar = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(26, 26); c.lineTo(74, 74); c.moveTo(74, 26); c.lineTo(26, 74); }, 12);
    ctx.beginPath(); ctx.moveTo(26, 26); ctx.lineTo(74, 74); ctx.moveTo(74, 26); ctx.lineTo(26, 74);
    ctx.lineWidth = 5; ctx.strokeStyle = '#FBF5EE'; ctx.stroke();
  };
  DES.panela = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(70, 52); c.lineTo(94, 46); }, 8);
    f(ctx, '#4A3F45', (c) => { c.moveTo(12, 44); c.lineTo(76, 44); c.lineTo(72, 80); c.quadraticCurveTo(44, 90, 16, 80); c.closePath(); });
    elipse(ctx, 44, 44, 32, 8, 0, '#6B5B63', 3.4);
  };
  DES.som = (ctx) => {
    f(ctx, '#E6F3F8', (c) => { c.moveTo(16, 38); c.lineTo(34, 38); c.lineTo(56, 18); c.lineTo(56, 82); c.lineTo(34, 62); c.lineTo(16, 62); c.closePath(); });
    f(ctx, null, (c) => { c.arc(56, 50, 18, -0.8, 0.8); }, 4.5);
    f(ctx, null, (c) => { c.arc(56, 50, 32, -0.8, 0.8); }, 4.5);
  };
  DES.musica = (ctx) => {
    f(ctx, null, (c) => { c.moveTo(38, 74); c.lineTo(38, 20); c.lineTo(78, 12); c.lineTo(78, 64); }, 6);
    elipse(ctx, 30, 76, 12, 9, -0.4, '#E6F3F8');
    elipse(ctx, 70, 66, 12, 9, -0.4, '#E6F3F8');
  };
  DES.creditos = (ctx) => {
    DES.i_estrela(ctx);
  };

  // ---------- conversão para imagem ----------

  const cache = {};
  function imagem(id, tam = 96) {
    const chave = id + '@' + tam;
    if (cache[chave]) return cache[chave];
    const cv = document.createElement('canvas');
    cv.width = cv.height = tam;
    const ctx = cv.getContext('2d');
    ctx.scale(tam / 100, tam / 100);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (DES[id]) DES[id](ctx);
    let url = '';
    try { url = cv.toDataURL('image/png'); } catch (e) { url = ''; }
    cache[chave] = url;
    return url;
  }

  function desenhar(ctx, id, x, y, tam, rot = 0) {
    if (!DES[id]) return;
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.scale(tam / 100, tam / 100);
    ctx.translate(-50, -50);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    DES[id](ctx);
    ctx.restore();
  }

  CH.desenhos = { DES, imagem, desenhar };
})(window.CH);
