// Pulo da Maçã: a Chorú pula sozinha de nuvem em nuvem, e você guia pros lados.
(function (CH) {
  const U = CH.U;
  const J = CH.jogos;

  function plataforma(a, y, prog) {
    const u = a.u;
    const r = U.rand();
    let tipo = 'nuvem';
    if (r < 0.12 + prog * 0.18) tipo = 'biscoito';
    else if (r < 0.24 + prog * 0.28) tipo = 'skate';
    const w = u * U.lerp(26, 20, prog);
    const p = { x: U.rnd(w / 2 + 8, a.W - w / 2 - 8), y, w, tipo, vx: tipo === 'skate' ? u * U.rnd(18, 34) * U.pick([-1, 1]) : 0 };
    if (tipo !== 'biscoito' && U.chance(0.08)) p.mola = true;
    if (U.chance(0.22)) p.moeda = true;
    return p;
  }

  J.registrar('pulo', {
    titulo: 'Pulo da Maçã',
    rotuloPontos: 'Altura (m)',
    gastoEnergia: 7,
    divisorDiversao: 25,
    moedas: (a) => a.pontos / 12,

    iniciar(a) {
      const u = a.u;
      a.g = u * 270;
      a.vPulo = u * 152;
      a.px = a.W / 2; a.py = a.H - 140;
      a.vx = 0; a.vy = -a.vPulo;
      a.cam = 0;
      a.inicioY = a.py;
      a.alvo = null; a.teclas = {};
      a.plats = [{ x: a.W / 2, y: a.H - 100, w: a.W * 0.9, tipo: 'chao', vx: 0 }];
      let y = a.H - 100;
      while (y > -a.H) {
        y -= U.rnd(u * 16, u * 26);
        a.plats.push(plataforma(a, y, 0));
      }
      a.topoGerado = y;
      a.efeitos = [];
      a.dica('Toque nos lados pra guiar a Chorú', 3);
      a.info('');
    },

    apertar(a, x) { a.alvo = x; },
    mover(a, x, y, e) { if (a.alvo != null || e.pointerType === 'mouse') a.alvo = x; },
    soltar(a, x, y, e) { if (e.pointerType !== 'mouse') a.alvo = null; },
    tecla(a, k, desce) {
      if (k === 'ArrowLeft' || k === 'a') a.teclas.esq = desce;
      if (k === 'ArrowRight' || k === 'd') a.teclas.dir = desce;
    },

    update(a, dt) {
      if (a.fim) return;
      const u = a.u;
      const ch = a.choru;
      const k = u * 0.11;
      const meiaL = 92 * k;

      // controle horizontal
      let ax = 0;
      if (a.teclas.esq) ax -= 1;
      if (a.teclas.dir) ax += 1;
      if (ax) a.vx = U.aproximar(a.vx, ax * u * 110, 8, dt);
      else if (a.alvo != null) {
        let dx = a.alvo - a.px;
        a.vx = U.clamp(dx * 6, -u * 120, u * 120);
      } else a.vx = U.aproximar(a.vx, 0, 4, dt);
      a.px += a.vx * dt;
      if (a.px < -meiaL) a.px += a.W + meiaL * 2;
      if (a.px > a.W + meiaL) a.px -= a.W + meiaL * 2;
      ch.vira = U.clamp(a.vx / (u * 600), -0.25, 0.25);

      // gravidade e pouso nas plataformas
      const antes = a.py;
      a.vy += a.g * dt;
      a.py += a.vy * dt;
      if (a.vy > 0) {
        for (const p of a.plats) {
          if (p.quebrou) continue;
          const topo = p.y - 6;
          if (antes <= topo && a.py >= topo && Math.abs(a.px - p.x) < p.w / 2 + meiaL * 0.55) {
            a.py = topo;
            a.vy = -a.vPulo * (p.mola ? 1.75 : 1);
            ch.cutucar(-1.2);
            if (p.mola) { CH.som.boing(); a.falar('Aí sim!'); }
            else CH.som.pulo();
            if (p.tipo === 'biscoito') { p.quebrou = true; p.queda = 0; CH.som.mordida(); }
            break;
          }
        }
      }
      a.plats.forEach((p) => {
        if (p.vx) {
          p.x += p.vx * dt;
          if (p.x < p.w / 2 || p.x > a.W - p.w / 2) p.vx *= -1;
        }
        if (p.quebrou) { p.queda += dt; p.y += 300 * dt * p.queda * 3; }
        if (p.moeda && !p.pegou && Math.abs(a.px - p.x) < meiaL && Math.abs((a.py - 60 * k) - (p.y - u * 10)) < u * 12) {
          p.pegou = true;
          a.moedas++;
          CH.som.moeda();
          a.efeitos.push({ x: p.x, y: p.y - u * 10, t: 0 });
        }
      });

      // câmera e pontuação
      const linha = a.cam + a.H * 0.42;
      if (a.py < linha) a.cam -= linha - a.py;
      const altura = Math.max(0, (a.inicioY - a.py) / (u * 4));
      if (altura > a.pontos) a.ponto(Math.floor(altura) - a.pontos);

      // novas plataformas lá em cima
      const prog = U.clamp(a.pontos / 600, 0, 1);
      while (a.topoGerado > a.cam - a.H) {
        a.topoGerado -= U.rnd(u * U.lerp(16, 26, prog), u * U.lerp(26, 34, prog));
        a.plats.push(plataforma(a, a.topoGerado, prog));
      }
      a.plats = a.plats.filter((p) => p.y < a.cam + a.H + 200);
      a.efeitos.forEach((e) => { e.t += dt; });
      a.efeitos = a.efeitos.filter((e) => e.t < 0.6);

      ch.expressao(a.vy < 0 ? 'feliz' : a.vy > a.vPulo * 0.9 ? 'susto' : 'deboche');

      // caiu
      if (a.py > a.cam + a.H + 80) {
        ch.expressao('triste');
        CH.som.erro();
        a.falar('BUUUUUUUUT');
        a.terminar();
      }
      a.k = k;
      a.offY = a.cam;
    },

    desenhar(a, c) {
      const u = a.u;
      const alt = U.clamp(a.pontos / 800, 0, 1);
      const g = c.createLinearGradient(0, 0, 0, a.H);
      g.addColorStop(0, U.misturar(U.misturar('#9ED8F0', '#2B3566', alt), '#1A1F3F', alt * alt));
      g.addColorStop(1, U.misturar('#FFE7EB', '#5B6FB0', alt));
      c.fillStyle = g;
      c.fillRect(0, 0, a.W, a.H);
      if (alt > 0.35) {
        const r = U.mulberry32(5);
        c.fillStyle = 'rgba(255,255,255,' + (alt - 0.35) * 1.5 + ')';
        for (let i = 0; i < 50; i++) {
          const x = r() * a.W, y = (r() * a.H * 2 - a.cam * 0.2) % a.H;
          c.fillRect(x, (y + a.H) % a.H, 2.5, 2.5);
        }
      }
      c.save();
      c.translate(0, -a.cam);
      a.plats.forEach((p) => {
        const y = p.y;
        if (p.tipo === 'chao') {
          c.fillStyle = '#9FD1B6'; c.fillRect(-10, y, a.W + 20, a.H);
          U.tinta(c, 4); c.beginPath(); c.moveTo(-10, y); c.lineTo(a.W + 10, y); c.stroke();
          return;
        }
        if (p.tipo === 'nuvem') {
          const forma = () => {
            c.beginPath();
            c.ellipse(p.x, y + 6, p.w / 2, u * 4, 0, 0, Math.PI * 2);
            c.moveTo(p.x - p.w * 0.2 + u * 5, y + 2); c.arc(p.x - p.w * 0.2, y + 2, u * 5, 0, Math.PI * 2);
            c.moveTo(p.x + p.w * 0.12 + u * 6, y); c.arc(p.x + p.w * 0.12, y, u * 6, 0, Math.PI * 2);
          };
          forma(); c.lineWidth = 7; c.strokeStyle = U.TINTA; c.stroke();
          forma(); c.fillStyle = '#FFFFFF'; c.fill();
        } else if (p.tipo === 'biscoito') {
          c.save();
          c.translate(p.x, y + 6);
          if (p.quebrou) c.rotate(p.queda * 2);
          c.beginPath(); U.ret(c, -p.w / 2, -u * 3, p.w, u * 6.5, u * 3);
          U.pinta(c, '#E8B064', 3.5);
          c.fillStyle = '#B87A30';
          for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * p.w * 0.18, 0, 2.6, 0, Math.PI * 2); c.fill(); }
          c.restore();
        } else {
          c.beginPath(); U.ret(c, p.x - p.w / 2, y, p.w, u * 3.4, u * 1.6);
          U.pinta(c, '#5B8E9C', 3.5);
          [-0.32, 0.32].forEach((f) => { c.beginPath(); c.arc(p.x + p.w * f, y + u * 4.6, u * 2.2, 0, Math.PI * 2); U.pinta(c, '#FFCB6E', 3); });
        }
        if (p.mola) {
          U.tinta(c, 4);
          c.beginPath();
          for (let i = 0; i <= 4; i++) c.lineTo(p.x + (i % 2 ? 8 : -8), y - 4 - i * 4);
          c.stroke();
          c.beginPath(); U.ret(c, p.x - 12, y - 24, 24, 6, 3); U.pinta(c, '#F24B64', 3);
        }
        if (p.moeda && !p.pegou) CH.desenhos.desenhar(c, 'i_moeda', p.x, y - u * 10, u * 8, Math.sin(a.t * 4 + p.x) * 0.3);
      });
      a.efeitos.forEach((e) => {
        c.save(); c.globalAlpha = 1 - e.t / 0.6;
        CH.cenarios.texto(c, '+1', e.x, e.y - e.t * 60, 24, '#FFCB6E', '#272322');
        c.restore();
      });
      a.choru.desenhar(c, a.px, a.py, a.k || u * 0.11, { sombra: false });
      c.restore();
    },
  });
})(window.CH);
