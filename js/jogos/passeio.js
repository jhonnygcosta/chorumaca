// Passeio: a Chorú corre pela calçada de pedra portuguesa. Toque pra pular, segure pra pular mais alto.
(function (CH) {
  const U = CH.U;
  const J = CH.jogos;
  const T = U.TINTA;
  const cen = () => CH.cenarios;

  const LOJAS = [
    { nome: 'PADARIA', cor: '#FFE9AD', toldo: ['#F24B64', '#FBF5EE'] },
    { nome: 'BANCA', cor: '#A6CFD9', toldo: ['#5B8E9C', '#FBF5EE'] },
    { nome: 'FEIRA', cor: '#F7C9D2', toldo: ['#8C6FB8', '#FBF5EE'] },
    { nome: 'SORVETES', cor: '#D1ED92', toldo: ['#F24B64', '#FFE9AD'] },
    { nome: 'LANCHONETE', cor: '#FFCB6E', toldo: ['#4B6765', '#FFCB6E'] },
    { nome: 'FRUTARIA', cor: '#F7A6B5', toldo: ['#5DA03A', '#FBF5EE'] },
  ];

  function chaoY(a) { return a.H * 0.78; }

  function novoObstaculo(a) {
    const u = a.u;
    const prog = U.clamp(a.t / 90, 0, 1);
    const r = U.rand();
    let o;
    if (r < 0.34) o = { tipo: 'caule', w: u * 6, h: u * 12 };
    else if (r < 0.62) o = { tipo: 'poca', w: u * U.rnd(18, 26), h: u * 2 };
    else if (r < 0.62 + 0.18 + prog * 0.2) o = { tipo: 'liquidificador', w: u * 13, h: u * 20, extra: u * 40 * (0.6 + prog) };
    else o = { tipo: 'caule', w: u * 6, h: u * 18, duplo: true };
    o.x = a.W + o.w + 20;
    a.obst.push(o);
  }

  function novasMoedas(a) {
    const u = a.u;
    const n = U.rndInt(3, 6);
    const alto = U.chance(0.5);
    for (let i = 0; i < n; i++) {
      const arco = alto ? Math.sin((i / (n - 1)) * Math.PI) * u * 26 : 0;
      a.moedasCena.push({ x: a.W + 40 + i * u * 11, y: chaoY(a) - u * 14 - arco - (alto ? u * 6 : 0) });
    }
  }

  J.registrar('passeio', {
    titulo: 'Passeio',
    rotuloPontos: 'Metros',
    gastoEnergia: 12,
    divisorDiversao: 12,
    saidaConta: true,
    musica: 'quintal',
    moedas: (a) => a.pontos / 10,
    efeitoExtra: (a) => (a.lama ? { higiene: -6 * a.lama } : {}),

    iniciar(a) {
      const u = a.u;
      a.dist = 0;
      a.vel = u * 70;
      a.y = 0; a.vy = 0; a.noChao = true; a.segura = false;
      a.vidas = 3; a.invencivel = 0;
      a.obst = []; a.moedasCena = []; a.respingos = [];
      a.proxObst = 1.6; a.proxMoeda = 1;
      a.lama = 0;
      a.periodo = cen().periodo();
      a.r = U.mulberry32(Math.floor(Date.now() / 86400000));
      a.lojas = [];
      for (let i = 0; i < 8; i++) a.lojas.push(LOJAS[Math.floor(a.r() * LOJAS.length)]);
      a.dica('Toque pra pular. Segure pra ir mais alto.', 3.2);
      a.falar('Frutofóbicos não passarão!');
      a.info('');
    },

    apertar(a) { pular(a); a.segura = true; },
    soltar(a) { a.segura = false; },
    tecla(a, k, desce, e) {
      if (k === ' ' || k === 'ArrowUp' || k === 'w') {
        e.preventDefault();
        if (desce && !e.repeat) pular(a);
        a.segura = desce;
      }
    },

    update(a, dt) {
      if (a.fim) return;
      const u = a.u;
      const ch = a.choru;
      const prog = U.clamp(a.t / 100, 0, 1);
      a.vel = u * U.lerp(70, 130, prog);
      const dx = a.vel * dt;
      a.dist += dx / (u * 12);
      if (Math.floor(a.dist) > a.pontos) a.ponto(Math.floor(a.dist) - a.pontos);

      // pulo com gravidade variável
      const g = u * (a.segura && a.vy < 0 ? 220 : 520);
      a.vy += g * dt;
      a.y += a.vy * dt;
      if (a.y >= 0) {
        if (!a.noChao) { ch.cutucar(1); CH.som.pouso(); }
        a.y = 0; a.vy = 0; a.noChao = true;
      }

      // obstáculos e moedas
      a.proxObst -= dt;
      if (a.proxObst <= 0) {
        novoObstaculo(a);
        a.proxObst = U.rnd(1.1, 2.1) * U.lerp(1, 0.7, prog);
      }
      a.proxMoeda -= dt;
      if (a.proxMoeda <= 0) { novasMoedas(a); a.proxMoeda = U.rnd(2, 3.5); }

      const k = u * 0.11;
      const cx = a.W * 0.24;
      const meia = 80 * k;
      const pes = chaoY(a) + a.y;
      a.obst.forEach((o) => {
        o.x -= dx + (o.extra || 0) * dt;
        if (o.atingiu) return;
        const sobre = Math.abs(o.x - cx) < o.w / 2 + meia * 0.6;
        if (!sobre) return;
        if (o.tipo === 'poca') {
          if (pes > chaoY(a) - u * 2) {
            o.atingiu = true;
            a.lama++;
            CH.som.splash();
            ch.expressao('nojo');
            a.expAte = a.t + 0.7;
            for (let i = 0; i < 8; i++) a.respingos.push({ x: o.x, y: chaoY(a), vx: U.rnd(-120, 120), vy: U.rnd(-300, -120), t: 0 });
          }
        } else if (pes > chaoY(a) - o.h * 0.85 && a.invencivel <= 0) {
          o.atingiu = true;
          a.vidas--;
          a.invencivel = 1.2;
          CH.som.batida();
          ch.cutucar(1.6);
          ch.expressao('susto');
          a.expAte = a.t + 0.8;
          a.falar(o.tipo === 'caule' ? 'Não são permitidos caules!' : 'BUUUUUUUUT');
          if (a.vidas <= 0) {
            ch.expressao('triste');
            a.terminar();
          }
        }
      });
      a.obst = a.obst.filter((o) => o.x > -o.w - 40);
      a.moedasCena.forEach((m) => {
        m.x -= dx;
        if (!m.pegou && Math.abs(m.x - cx) < meia && Math.abs(m.y - (pes - 70 * k)) < u * 14) {
          m.pegou = true; a.moedas++; CH.som.moeda();
          if (a.moedas % 15 === 0) a.falar('Ih mané, pingou hein!');
        }
      });
      a.moedasCena = a.moedasCena.filter((m) => m.x > -40 && !m.pegou);
      a.respingos.forEach((r) => { r.t += dt; r.x += r.vx * dt - dx; r.y += r.vy * dt; r.vy += 900 * dt; });
      a.respingos = a.respingos.filter((r) => r.t < 0.8);
      a.invencivel = Math.max(0, a.invencivel - dt);

      a.info(a.moedas + ' moedas');
      if (!a.expAte || a.t > a.expAte) ch.expressao(a.noChao ? 'deboche' : 'feliz');
      ch.sujeira = U.clamp(a.lama * 0.18, 0, 1);
      a.k = k; a.cx = cx;
      a.desloc = (a.desloc || 0) + dx;
    },

    desenhar(a, c) {
      const u = a.u;
      const chao = chaoY(a);
      const per = a.periodo;
      const d = a.desloc || 0;
      cen().ceu(c, 0, 0, a.W, chao, per, a.t, true);

      // prédios ao fundo (parallax lento)
      const r = U.mulberry32(21);
      const larg = 110;
      const off = (d * 0.2) % larg;
      for (let i = -1; i < a.W / larg + 2; i++) {
        const idx = Math.floor((d * 0.2) / larg) + i;
        const rr = U.mulberry32(idx * 977 + 3);
        const h = chao * (0.25 + rr() * 0.3);
        const x = i * larg - off;
        cen().caixa(c, x, chao - h - 40, larg - 14, h + 40, 4, per.id === 'noite' ? '#55608F' : ['#F7C9D2', '#CFE7F2', '#FFE9AD', '#E6DAF2'][Math.floor(rr() * 4)], 3.5);
        c.fillStyle = per.id === 'noite' ? '#FFE07A' : '#FFFFFF';
        for (let wy = chao - h - 20; wy < chao - 60; wy += 34) {
          c.fillRect(x + 14, wy, 18, 18); c.fillRect(x + 54, wy, 18, 18);
        }
      }
      r();

      // lojas e palmeiras (parallax médio)
      const lj = u * 52;
      const off2 = (d * 0.55) % lj;
      for (let i = -1; i < a.W / lj + 2; i++) {
        const idx = Math.floor((d * 0.55) / lj) + i;
        const rr = U.mulberry32(idx * 131 + 7);
        const x = i * lj - off2;
        if (rr() < 0.25) {
          // palmeira e orelhão
          c.beginPath();
          c.moveTo(x + lj * 0.3, chao); c.quadraticCurveTo(x + lj * 0.2, chao - u * 30, x + lj * 0.36, chao - u * 46);
          c.lineWidth = u * 3.4; c.strokeStyle = T; c.stroke();
          c.lineWidth = u * 2; c.strokeStyle = '#B07A50'; c.stroke();
          for (let f = 0; f < 5; f++) {
            const ang = -2.6 + f * 0.55;
            c.beginPath();
            c.moveTo(x + lj * 0.36, chao - u * 46);
            c.quadraticCurveTo(x + lj * 0.36 + Math.cos(ang) * u * 12, chao - u * 50 + Math.sin(ang) * u * 6, x + lj * 0.36 + Math.cos(ang) * u * 20, chao - u * 44 + Math.sin(ang) * u * 12);
            c.lineWidth = u * 2.4; c.strokeStyle = T; c.stroke();
            c.lineWidth = u * 1.2; c.strokeStyle = '#7DBA4A'; c.stroke();
          }
          // orelhão
          const ox = x + lj * 0.72;
          c.beginPath(); c.moveTo(ox, chao); c.lineTo(ox, chao - u * 18); c.lineWidth = 5; c.strokeStyle = T; c.stroke();
          c.beginPath(); c.ellipse(ox, chao - u * 22, u * 6, u * 7, 0, Math.PI, 0); c.lineTo(ox + u * 6, chao - u * 16); c.lineTo(ox - u * 6, chao - u * 16); c.closePath();
          U.pinta(c, '#F2D04A', 3.5);
        } else {
          const loja = LOJAS[Math.floor(rr() * LOJAS.length)];
          const h = u * 34;
          cen().caixa(c, x + 4, chao - h, lj - 8, h, 4, loja.cor, 4);
          // toldo listrado
          c.save();
          c.beginPath(); c.rect(x, chao - h - u * 2, lj, u * 7); c.clip();
          for (let s = 0; s < 10; s++) {
            c.fillStyle = loja.toldo[s % 2];
            c.fillRect(x + s * (lj / 8), chao - h - u * 2, lj / 8, u * 7);
          }
          c.restore();
          c.beginPath(); c.rect(x, chao - h - u * 2, lj, u * 7); U.pinta(c, null, 3.5);
          cen().caixa(c, x + lj * 0.18, chao - h * 0.62, lj * 0.3, h * 0.62, 3, '#4B6765', 3.5);
          cen().caixa(c, x + lj * 0.56, chao - h * 0.62, lj * 0.3, h * 0.32, 3, '#CFE7F2', 3.5);
          cen().texto(c, loja.nome, x + lj / 2, chao - h - u * 6, Math.min(u * 4.4, 22), '#FFFFFF', T);
        }
      }

      // calçada de pedra portuguesa
      c.fillStyle = '#F4F0EA';
      c.fillRect(0, chao, a.W, a.H - chao);
      c.save();
      c.beginPath(); c.rect(0, chao, a.W, a.H - chao); c.clip();
      c.strokeStyle = '#2C2827';
      for (let i = 0, y = chao + 18; y < a.H + 40; y += 46, i++) {
        c.lineWidth = 13 + i * 3;
        c.beginPath();
        for (let x = -20; x <= a.W + 20; x += 8) {
          const yy = y + Math.sin((x + d + i * 50) * 0.022) * (10 + i * 2);
          if (x === -20) c.moveTo(x, yy); else c.lineTo(x, yy);
        }
        c.stroke();
      }
      c.restore();
      c.fillStyle = '#D9D2C8'; c.fillRect(0, chao - 4, a.W, 10);
      U.tinta(c, 4);
      c.beginPath(); c.moveTo(0, chao - 4); c.lineTo(a.W, chao - 4); c.stroke();

      // obstáculos
      a.obst.forEach((o) => {
        if (o.tipo === 'poca') {
          c.beginPath(); c.ellipse(o.x, chao + 6, o.w / 2, u * 3.2, 0, 0, Math.PI * 2);
          U.pinta(c, '#7FC4D3', 3.5);
          c.beginPath(); c.ellipse(o.x - o.w * 0.15, chao + 4, o.w * 0.18, u * 0.9, 0, 0, Math.PI * 2);
          c.fillStyle = '#E6F3F8'; c.fill();
        } else if (o.tipo === 'caule') {
          const n = o.duplo ? 2 : 1;
          for (let i = 0; i < n; i++) {
            const x = o.x + (i - (n - 1) / 2) * o.w * 0.9;
            c.beginPath(); U.ret(c, x - o.w * 0.35, chao - o.h, o.w * 0.7, o.h + 4, o.w * 0.3);
            U.pinta(c, '#9CD167', 3.5);
            c.beginPath(); c.ellipse(x - o.w * 0.4, chao - o.h - 4, o.w * 0.6, o.w * 0.35, -0.5, 0, Math.PI * 2);
            U.pinta(c, '#6DB23F', 3);
          }
        } else {
          // liquidificador rolando
          c.save();
          c.translate(o.x, chao - o.h / 2);
          c.rotate(-a.t * 6);
          c.beginPath(); U.ret(c, -o.w / 2, -o.h / 2, o.w, o.h * 0.68, 6);
          U.pinta(c, 'rgba(207,231,242,0.9)', 4);
          c.beginPath(); U.ret(c, -o.w / 2 - 3, o.h * 0.18, o.w + 6, o.h * 0.32, 6);
          U.pinta(c, '#F24B64', 4);
          c.beginPath(); U.ret(c, -o.w / 2 + 2, -o.h / 2 - 6, o.w - 4, 9, 4);
          U.pinta(c, '#4A3F45', 3);
          U.tinta(c, 3);
          c.beginPath(); c.moveTo(-o.w * 0.3, 0); c.lineTo(o.w * 0.3, -o.h * 0.1); c.moveTo(-o.w * 0.3, -o.h * 0.1); c.lineTo(o.w * 0.3, 0); c.stroke();
          // olhos de vilão
          c.fillStyle = '#FFFFFF';
          c.beginPath(); c.ellipse(-o.w * 0.18, -o.h * 0.24, 5, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
          c.beginPath(); c.ellipse(o.w * 0.18, -o.h * 0.24, 5, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
          c.restore();
        }
      });

      a.moedasCena.forEach((m) => CH.desenhos.desenhar(c, 'i_moeda', m.x, m.y, u * 8, Math.sin(a.t * 5 + m.x * 0.05) * 0.4));

      // Chorú correndo (piscando quando acabou de bater)
      const pisca = a.invencivel > 0 && Math.floor(a.t * 12) % 2 === 0;
      const quique = a.noChao ? -Math.abs(Math.sin(a.t * 12)) * u * 2.4 : 0;
      if (!pisca) a.choru.desenhar(c, a.cx || a.W * 0.24, chao + a.y + quique, a.k || u * 0.11, { sombra: a.noChao });

      a.respingos.forEach((r) => {
        c.globalAlpha = 1 - r.t / 0.8;
        c.beginPath(); c.arc(r.x, r.y, 5, 0, Math.PI * 2); c.fillStyle = '#7FC4D3'; c.fill();
        c.globalAlpha = 1;
      });
      J.coracoes(c, a.W - 30, a.topo + 30, a.vidas, 3);
    },
  });

  function pular(a) {
    if (!a.noChao || a.fim) return;
    a.noChao = false;
    a.vy = -a.u * 150;
    a.choru.cutucar(-1.4);
    CH.som.pulo();
  }
})(window.CH);
