// Biruleibe VR: jogo de memória musical. Repita a sequência, que cresce a cada rodada.
(function (CH) {
  const U = CH.U;
  const J = CH.jogos;

  const PADS = [
    { cor: '#F24B64', claro: '#FF9AAA', txt: 'BABY' },
    { cor: '#8CC657', claro: '#D1ED92', txt: 'DO' },
    { cor: '#5B8E9C', claro: '#A6CFD9', txt: 'BIRU' },
    { cor: '#ECA555', claro: '#FFE9AD', txt: 'LEIBE' },
  ];

  function geometria(a) {
    const topoPads = a.H * 0.42;
    const lado = Math.min(a.W * 0.42, (a.H - topoPads - 40) * 0.48, 220);
    const gap = Math.max(12, lado * 0.08);
    const x0 = a.W / 2 - lado - gap / 2;
    const y0 = topoPads + (a.H - topoPads - 30 - (lado * 2 + gap)) / 2;
    return PADS.map((p, i) => ({ x: x0 + (i % 2) * (lado + gap), y: y0 + Math.floor(i / 2) * (lado + gap), lado }));
  }

  function novaRodada(a) {
    a.seq.push(U.rndInt(0, 3));
    a.fase = 'mostrando';
    a.i = 0;
    a.timer = 0.7;
    a.entrada = 0;
    a.info('Rodada ' + a.seq.length);
  }

  function acender(a, i, dur) {
    a.aceso[i] = dur;
    CH.som.pad(i);
    a.choru.falarPor(dur * 0.8);
  }

  function escolher(a, i) {
    if (a.fase !== 'vez' || a.fim) return;
    acender(a, i, 0.26);
    if (a.seq[a.entrada] !== i) {
      a.fase = 'erro';
      a.choru.expressao('susto');
      CH.som.erro();
      a.falar('BUUUUUUUUT');
      a.terminar();
      return;
    }
    a.entrada++;
    if (a.entrada >= a.seq.length) {
      a.ponto(1);
      a.fase = 'acertou';
      a.timer = 0.9;
      setTimeout(() => CH.som.acerto(), 250);
      a.choru.expressao('gargalhada');
      a.choru.pular(0.5);
      if (a.seq.length % 5 === 0) a.falar('Aí sim!');
    }
  }

  J.registrar('biruleibe', {
    titulo: 'Biruleibe VR',
    rotuloPontos: 'Rodadas',
    gastoEnergia: 5,
    divisorDiversao: 1,
    moedas: (a) => a.pontos * 3,

    iniciar(a) {
      a.seq = [];
      a.aceso = [0, 0, 0, 0];
      a.fase = 'pronto';
      a.timer = 1.4;
      a.dica('Olhe a sequência e repita', 2.6);
      a.info('');
    },

    apertar(a, x, y) {
      const g = geometria(a);
      g.forEach((p, i) => {
        if (x >= p.x && x <= p.x + p.lado && y >= p.y && y <= p.y + p.lado) escolher(a, i);
      });
    },
    tecla(a, k, desce) {
      if (!desce) return;
      const mapa = { 1: 0, 2: 1, 3: 2, 4: 3, ArrowUp: 0, ArrowRight: 1, ArrowLeft: 2, ArrowDown: 3 };
      if (k in mapa) escolher(a, mapa[k]);
    },

    update(a, dt) {
      a.aceso = a.aceso.map((v) => Math.max(0, v - dt));
      if (a.fim) return;
      a.timer -= dt;
      if (a.fase === 'pronto' && a.timer <= 0) novaRodada(a);
      else if (a.fase === 'mostrando' && a.timer <= 0) {
        if (a.i < a.seq.length) {
          const dur = Math.max(0.24, 0.46 - a.seq.length * 0.015);
          acender(a, a.seq[a.i], dur);
          a.i++;
          a.timer = dur + 0.14;
          a.choru.expressao('feliz');
        } else {
          a.fase = 'vez';
          a.choru.expressao('esperando');
        }
      } else if (a.fase === 'acertou' && a.timer <= 0) novaRodada(a);
      if (a.fase === 'vez') a.choru.expressao('deboche');
    },

    desenhar(a, c) {
      // fundo da realidade virtual: grade em perspectiva
      c.fillStyle = '#2B2440';
      c.fillRect(0, 0, a.W, a.H);
      const hz = a.H * 0.34;
      c.strokeStyle = '#4C6C8A';
      c.lineWidth = 2;
      for (let i = -12; i <= 12; i++) {
        c.beginPath(); c.moveTo(a.W / 2 + i * 20, hz); c.lineTo(a.W / 2 + i * a.W * 0.22, a.H); c.stroke();
      }
      for (let j = 0; j < 14; j++) {
        const f = ((j + (a.t * 0.8) % 1) / 14);
        const y = hz + (a.H - hz) * f * f;
        c.beginPath(); c.moveTo(0, y); c.lineTo(a.W, y); c.stroke();
      }
      c.fillStyle = '#3B2F5C';
      c.fillRect(0, 0, a.W, hz);
      const r = U.mulberry32(9);
      c.fillStyle = '#A6CFD9';
      for (let i = 0; i < 30; i++) c.fillRect(r() * a.W, r() * hz, 2, 2);

      // Chorú com óculos VR
      const k = Math.min(a.u * 0.13, (hz - a.topo) / 240);
      a.choru.desenhar(c, a.W / 2, hz + 8, k, { olhos: 'vr', sombra: false });

      // botões
      geometria(a).forEach((p, i) => {
        const pad = PADS[i];
        const luz = a.aceso[i] > 0;
        const afunda = luz ? 5 : 0;
        c.beginPath(); U.ret(c, p.x, p.y + 8, p.lado, p.lado, 26);
        c.fillStyle = U.TINTA; c.fill();
        c.beginPath(); U.ret(c, p.x, p.y + afunda, p.lado, p.lado, 26);
        U.pinta(c, luz ? pad.claro : pad.cor, 4.5);
        c.save();
        c.globalAlpha = 0.35;
        c.beginPath(); U.ret(c, p.x + 14, p.y + afunda + 12, p.lado * 0.5, 12, 6); c.fillStyle = '#FFFFFF'; c.fill();
        c.restore();
        CH.cenarios.texto(c, pad.txt, p.x + p.lado / 2, p.y + afunda + p.lado / 2, Math.min(34, p.lado * 0.22), '#FFFFFF', U.TINTA);
      });

      if (a.fase === 'vez' || a.fase === 'mostrando') {
        const msg = a.fase === 'vez' ? 'Sua vez!' : 'Olhe...';
        CH.cenarios.texto(c, msg, a.W / 2, a.H * 0.4, 26, '#FFFFFF', U.TINTA);
      }
    },
  });
})(window.CH);
