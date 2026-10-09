// Estado da Chorú: status, tempo real, moedas, nível e salvamento.
(function (CH) {
  const U = CH.U;
  const CHAVE = 'chorumaca-save-v1';
  const HORA = 3600000;

  // Quanto cada status cai por hora.
  const QUEDA = { fome: 6, higiene: 4, energia: 5, diversao: 7 };
  const STATUS = ['fome', 'higiene', 'energia', 'diversao', 'saude'];

  function novo() {
    const agora = Date.now();
    return {
      v: 1,
      criado: agora,
      ultimo: agora,
      status: { fome: 70, higiene: 80, energia: 85, diversao: 70, saude: 100 },
      vontade: 20,
      apertada: 0,           // segundos restantes até a caquinha; 0 = não está apertada
      caquinhas: [],          // { id, comodo, x, t }
      dormindo: false,
      comodo: 'cozinha',
      moedas: 100,
      xp: 0,
      nivel: 1,
      inventario: { coxinha: 2, pao_frances: 2, banana: 2, leite: 1, ovo: 1, queijo: 1, brigadeiro: 1 },
      receitas: [],
      roupas: { possui: ['classica'], cabeca: null, olhos: null, cor: 'classica' },
      recordes: { chuva: 0, pulo: 0, biruleibe: 0, passeio: 0, empilha: 0 },
      bonusDia: '',
      config: { som: true, musica: true },
      contagem: { comidas: 0, banhos: 0, jogos: 0, passeios: 0 },
    };
  }

  let s = null;
  let salvarTimer = null;

  function migrar(dados) {
    const base = novo();
    const r = Object.assign(base, dados);
    r.status = Object.assign(novo().status, dados.status || {});
    r.roupas = Object.assign(novo().roupas, dados.roupas || {});
    r.recordes = Object.assign(novo().recordes, dados.recordes || {});
    r.config = Object.assign(novo().config, dados.config || {});
    r.contagem = Object.assign(novo().contagem, dados.contagem || {});
    r.inventario = dados.inventario || {};
    r.caquinhas = Array.isArray(dados.caquinhas) ? dados.caquinhas : [];
    return r;
  }

  function lerLocal() {
    try {
      const j = localStorage.getItem(CHAVE);
      return j ? JSON.parse(j) : null;
    } catch (e) { return null; }
  }

  function gravarLocal() {
    try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch (e) { /* armazenamento indisponível */ }
  }

  function limitar() {
    STATUS.forEach((k) => { s.status[k] = U.clamp(s.status[k], 0, 100); });
    s.vontade = U.clamp(s.vontade, 0, 100);
  }

  // Avança o mundo em "h" horas, em passos pequenos.
  function simular(h, offline) {
    const resumo = { caquinhas: 0 };
    while (h > 1e-6) {
      const d = Math.min(h, 0.1);
      passo(d, offline, resumo);
      h -= d;
    }
    return resumo;
  }

  function passo(d, offline, resumo) {
    const st = s.status;
    st.fome -= QUEDA.fome * d;
    st.diversao -= QUEDA.diversao * d * (s.dormindo ? 0.3 : 1);
    st.higiene -= QUEDA.higiene * d;
    if (s.dormindo) st.energia += 20 * d;
    else st.energia -= QUEDA.energia * d;

    if (s.caquinhas.length) st.higiene -= 1.5 * d * s.caquinhas.length;

    const zerados = ['fome', 'higiene', 'energia', 'diversao'].filter((k) => st[k] <= 0.5).length;
    const caquinhaVelha = s.caquinhas.some((c) => s.ultimo - c.t > HORA);
    if (zerados) st.saude -= 5 * zerados * d;
    if (caquinhaVelha) st.saude -= 3 * d;
    if (!zerados && !caquinhaVelha && ['fome', 'higiene', 'energia', 'diversao'].every((k) => st[k] > 50)) st.saude += 2 * d;

    // Com o jogo fechado, a vontade acumulada vira caquinha.
    if (offline) {
      s.vontade += 4 * d;
      if (s.vontade >= 100 || s.apertada > 0) {
        if (s.caquinhas.length < 3) {
          novaCaquinha(s.dormindo ? 'quarto' : s.comodo);
          resumo.caquinhas++;
        }
        s.vontade = 0;
        s.apertada = 0;
      }
    }
    limitar();
  }

  function novaCaquinha(comodo, x) {
    s.caquinhas.push({
      id: Math.floor(U.rand() * 1e9).toString(36),
      comodo,
      x: x != null ? x : U.pick([-1, 1]) * U.rnd(0.22, 0.36),
      t: Date.now(),
    });
  }

  const E = {
    QUEDA,
    STATUS,
    get s() { return s; },

    carregar() {
      const dados = lerLocal();
      s = dados ? migrar(dados) : novo();
      const agora = Date.now();
      const horas = U.clamp((agora - s.ultimo) / HORA, 0, 48);
      const resumo = horas > 0.01 ? simular(horas, true) : { caquinhas: 0 };
      resumo.horas = horas;
      s.ultimo = agora;
      gravarLocal();
      return resumo;
    },

    // Troca o estado inteiro (usado pela sincronização com a conta).
    substituir(dados) {
      s = migrar(dados);
      const horas = U.clamp((Date.now() - s.ultimo) / HORA, 0, 48);
      if (horas > 0.01) simular(horas, true);
      s.ultimo = Date.now();
      gravarLocal();
      CH.ev.emit('estado');
    },

    // Avança o relógio do jogo (usado pelas ferramentas de teste).
    avancar(horas) {
      const r = simular(horas, true);
      s.ultimo = Date.now();
      gravarLocal();
      CH.ev.emit('estado');
      return r;
    },

    // Grava só no navegador, sem avisar a sincronização (usado pelo salvamento periódico).
    salvarLocal() {
      if (!s) return;
      s.ultimo = Date.now();
      gravarLocal();
    },

    // Chamado pelo laço do jogo com o tempo real decorrido.
    tick(ms, emCasa) {
      const agora = Date.now();
      simular(ms / HORA, false);
      s.ultimo = agora;
      if (emCasa && s.apertada > 0) {
        s.apertada -= ms / 1000;
        if (s.apertada <= 0) {
          s.apertada = 0;
          s.vontade = 0;
          novaCaquinha(s.comodo);
          CH.ev.emit('caquinha');
          E.salvar();
        }
      }
    },

    salvar() {
      clearTimeout(salvarTimer);
      salvarTimer = setTimeout(E.salvarJa, 800);
    },

    salvarJa() {
      clearTimeout(salvarTimer);
      if (!s) return;
      s.ultimo = Date.now();
      gravarLocal();
      CH.ev.emit('salvou', s);
    },

    // Aplica um efeito como { fome: 10, diversao: 5 }.
    efeito(ef) {
      if (!ef) return;
      Object.keys(ef).forEach((k) => {
        if (k in s.status) s.status[k] += ef[k];
      });
      limitar();
      CH.ev.emit('status');
      E.salvar();
    },

    vontade(n) {
      if (s.apertada > 0) return;
      s.vontade += n;
      if (s.vontade >= 100) {
        s.vontade = 100;
        s.apertada = 60;
        CH.ev.emit('apertada');
      }
    },

    aliviar() {
      s.vontade = 0;
      s.apertada = 0;
      E.salvar();
    },

    novaCaquinha,

    limparCaquinha(id) {
      s.caquinhas = s.caquinhas.filter((c) => c.id !== id);
      E.salvar();
    },

    ganharXP(n) {
      s.xp += n;
      let subiu = false;
      while (s.xp >= E.xpProximo()) {
        s.xp -= E.xpProximo();
        s.nivel++;
        subiu = true;
        const premio = 10 * s.nivel;
        s.moedas += premio;
        CH.ev.emit('nivel', s.nivel, premio);
      }
      CH.ev.emit('xp');
      E.salvar();
      return subiu;
    },

    xpProximo() { return 50 * s.nivel; },

    estagio() {
      return CH.dados.estagios.find((e) => s.nivel <= e.ate);
    },

    // Fator de tamanho: cresce do nível 1 ao 15.
    crescimento() {
      return U.lerp(0.74, 1, U.clamp((s.nivel - 1) / 14, 0, 1));
    },

    moedas(n) {
      s.moedas = Math.max(0, s.moedas + n);
      CH.ev.emit('moedas', n);
      E.salvar();
    },

    gastar(n) {
      if (s.moedas < n) return false;
      E.moedas(-n);
      return true;
    },

    item(id, n) {
      s.inventario[id] = Math.max(0, (s.inventario[id] || 0) + n);
      if (!s.inventario[id]) delete s.inventario[id];
      CH.ev.emit('inventario');
      E.salvar();
    },

    // Humor geral para escolher expressões e falas.
    necessidade() {
      const st = s.status;
      if (s.apertada > 0) return 'apertada';
      if (st.saude < 30) return 'doente';
      const baixos = ['fome', 'energia', 'higiene', 'diversao']
        .map((k) => [k, st[k]])
        .sort((a, b) => a[1] - b[1]);
      if (baixos[0][1] < 25) return baixos[0][0];
      return null;
    },

    resetar() {
      s = novo();
      gravarLocal();
      CH.ev.emit('estado');
    },
  };

  CH.estado = E;
})(window.CH);
