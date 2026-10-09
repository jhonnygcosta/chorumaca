// Chuva de Comida: arraste a Chorú pra pegar comida e desvie de caules e pêssegos.
(function (CH) {
  const U = CH.U;
  const J = CH.jogos;

  const BOAS = ['coxinha', 'pao_queijo', 'brigadeiro', 'pastel', 'pipoca', 'banana', 'morango', 'pizza', 'picole', 'melancia', 'pao_frances'];
  const RUINS = ['aipo', 'pessego'];
  const DURACAO = 60;

  J.registrar('chuva', {
    titulo: 'Chuva de Comida',
    rotuloPontos: 'Pontos',
    gastoEnergia: 6,
    moedas: (a) => a.pontos / 10,

    iniciar(a) {
      a.x = a.W / 2; a.alvoX = a.W / 2;
      a.itens = []; a.textos = [];
      a.vidas = 3; a.resta = DURACAO;
      a.prox = 0.8; a.teclas = {};
      a.combo = 0;
      a.dica('Arraste pra pegar a comida. Caule e pêssego não!', 3.4);
      a.info(DURACAO + ' s');
    },

    apertar(a, x) { a.alvoX = x; },
    mover(a, x, y, e) { if (e.buttons || e.pointerType !== 'mouse' || true) a.alvoX = x; },
    tecla(a, k, desce) {
      if (k === 'ArrowLeft' || k === 'a') a.teclas.esq = desce;
      if (k === 'ArrowRight' || k === 'd') a.teclas.dir = desce;
    },

    update(a, dt) {
      if (a.fim) return;
      const u = a.u;
      const chao = a.H - 70;
      const k = u * 0.15;
      const ch = a.choru;

      a.resta -= dt;
      a.info(Math.ceil(Math.max(0, a.resta)) + ' s');
      if (a.resta <= 0 || a.vidas <= 0) {
        ch.expressao(a.vidas > 0 ? 'gargalhada' : 'triste');
        if (a.vidas > 0) ch.dancar(2);
        a.terminar();
        return;
      }

      if (a.teclas.esq) a.alvoX -= 700 * dt;
      if (a.teclas.dir) a.alvoX += 700 * dt;
      a.alvoX = U.clamp(a.alvoX, 40, a.W - 40);
      const antes = a.x;
      a.x = U.aproximar(a.x, a.alvoX, 16, dt);
      ch.vira = U.clamp((a.x - antes) / Math.max(dt, 0.001) / 3000, -0.25, 0.25);

      // novas comidas
      const prog = 1 - a.resta / DURACAO;
      a.prox -= dt;
      if (a.prox <= 0) {
        a.prox = U.lerp(0.8, 0.34, prog) * U.rnd(0.7, 1.2);
        const r = U.rand();
        const tipo = r < 0.2 + prog * 0.12 ? 'ruim' : r < 0.3 + prog * 0.12 ? 'moeda' : 'boa';
        const id = tipo === 'ruim' ? U.pick(RUINS) : tipo === 'moeda' ? 'i_moeda' : U.pick(BOAS);
        a.itens.push({
          id, tipo,
          x: U.rnd(30, a.W - 30), y: a.topo + 10,
          vy: u * U.lerp(48, 110, prog) * U.rnd(0.85, 1.2),
          rot: U.rnd(0, 6), vr: U.rnd(-2, 2),
        });
      }

      const boca = ch.bocaMundo();
      let perto = false;
      a.itens.forEach((it) => {
        it.y += it.vy * dt;
        it.rot += it.vr * dt;
        const d = U.dist(it.x, it.y, boca.x, boca.y);
        if (it.tipo !== 'ruim' && it.y < boca.y && d < u * 30) perto = true;
        if (!it.pego && d < u * 12) {
          it.pego = true;
          if (it.tipo === 'ruim') {
            a.vidas--;
            a.combo = 0;
            CH.som.batida();
            ch.cutucar(1.4);
            ch.expressao('susto');
            a.expAte = a.t + 0.8;
            a.falar(it.id === 'aipo' ? 'Não são permitidos caules!' : 'Eu sou uma maçã!');
          } else if (it.tipo === 'moeda') {
            a.moedas++;
            a.ponto(5);
            CH.som.moeda();
            a.textos.push({ txt: '+1', x: it.x, y: it.y, t: 0, cor: '#ECA555' });
          } else {
            a.combo++;
            const p = (it.id === 'coxinha' ? 15 : 10) + Math.min(10, Math.floor(a.combo / 5) * 2);
            a.ponto(p);
            CH.som.mordida();
            ch.cutucar(0.5);
            ch.expressao('mastigando');
            a.expAte = a.t + 0.35;
            a.textos.push({ txt: '+' + p, x: it.x, y: it.y, t: 0, cor: '#272322' });
            if (a.combo === 10) a.falar('Aqui é explosão de chorume!');
          }
        }
      });
      a.itens = a.itens.filter((it) => !it.pego && it.y < chao + 40);
      a.textos.forEach((t) => { t.t += dt; t.y -= 50 * dt; });
      a.textos = a.textos.filter((t) => t.t < 0.8);

      if (!a.expAte || a.t > a.expAte) ch.expressao(perto ? 'esperando' : 'deboche');
      ch.mastigar = a.expAte && a.t < a.expAte && ch.exp === 'mastigando' ? 1 : 0;
      a.k = k; a.chao = chao;
    },

    desenhar(a, c) {
      const u = a.u;
      J.espiral(c, a.W, a.H, a.t, a.W / 2, a.H * 0.4);
      const chao = a.chao || a.H - 70;
      // toalha listrada no chão
      c.fillStyle = '#F3E3E7';
      c.fillRect(0, chao, a.W, a.H - chao);
      c.save();
      c.beginPath(); c.rect(0, chao, a.W, a.H - chao); c.clip();
      c.strokeStyle = '#F2C46A'; c.lineWidth = 8;
      for (let x = -a.H; x < a.W + a.H; x += 46) { c.beginPath(); c.moveTo(x, chao); c.lineTo(x + 120, a.H); c.stroke(); }
      c.restore();
      U.tinta(c, 4);
      c.beginPath(); c.moveTo(0, chao); c.lineTo(a.W, chao); c.stroke();

      a.itens.forEach((it) => {
        CH.desenhos.desenhar(c, it.id, it.x, it.y, u * (it.tipo === 'moeda' ? 10 : 14), it.rot * (it.tipo === 'moeda' ? 0 : 1));
      });
      a.choru.desenhar(c, a.x, chao + 4, a.k || u * 0.15, {});
      a.textos.forEach((t) => {
        c.save();
        c.globalAlpha = 1 - t.t / 0.8;
        CH.cenarios.texto(c, t.txt, t.x, t.y, 26, t.cor === '#ECA555' ? '#FFCB6E' : '#FFFFFF', '#272322');
        c.restore();
      });
      J.coracoes(c, a.W - 30, a.topo + 30, a.vidas, 3);
    },
  });
})(window.CH);
