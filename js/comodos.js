// O que se faz em cada cômodo: comer, cozinhar, banho, vaso, dormir, guarda-roupa e lojas.
(function (CH) {
  const U = CH.U;
  const D = CH.dados;
  const E = CH.estado;
  const ui = CH.ui;
  const img = (id, t) => CH.desenhos.imagem(id, t);

  let G = null; // contexto do jogo, entregue pelo main.js

  const st = {
    cozinhando: 0,        // segundos restantes no fogão
    pratoPronto: null,
    chuveiro: false,
    banho: null,          // { espumou, enxaguou }
    descarga: 0,
    vaso: 0,              // segundos da Chorú sentada no vaso
    comendo: null,        // { id, t, mordidas }
    voo: null,            // comida voando até a boca
    arrasto: null,        // { tipo, id, x, y, pointerId }
    ultimoArrasto: 0,
    esfregado: 0,
    luzApagada: false,
  };

  // ---------- ações por cômodo ----------

  function acoes(id) {
    const s = E.s;
    switch (id) {
      case 'cozinha':
        return [
          { id: 'geladeira', icone: 'geladeira', rotulo: 'Geladeira', toque: () => alternarGeladeira(), classe: ui.gaveta.aberta ? 'ligado' : '' },
          { id: 'fogao', icone: 'fogao', rotulo: 'Fogão', toque: () => painelFogao() },
          { id: 'loja', icone: 'loja', rotulo: 'Mercado', toque: () => painelMercado() },
        ];
      case 'banheiro': {
        const l = [
          { id: 'sabonete', icone: 'sabonete', rotulo: 'Sabonete', arrastar: (e) => iniciarArrasto('sabonete', 'sabonete', e) },
          { id: 'chuveiro', icone: 'chuveiro', rotulo: 'Chuveiro', segurar: () => chuveiro(true), soltar: () => chuveiro(false) },
          { id: 'remedio', icone: 'remedio', rotulo: 'Remédio', toque: () => painelRemedio(), classe: s.status.saude < 30 ? 'destaque' : '' },
        ];
        if (s.apertada > 0) l.unshift({ id: 'vaso', icone: 'vaso', rotulo: 'Vaso', toque: () => usarVaso(), classe: 'destaque' });
        return l;
      }
      case 'quarto':
        return [
          { id: 'luz', icone: s.dormindo ? 'lua' : 'luz', rotulo: s.dormindo ? 'Acender' : 'Apagar', toque: () => alternarLuz(), classe: s.dormindo ? 'ligado' : '' },
          { id: 'roupas', icone: 'cabide', rotulo: 'Roupas', toque: () => painelRoupas() },
        ];
      case 'sala':
        return [
          { id: 'empilha', icone: 'blocos', rotulo: 'Tetris', toque: () => jogar('empilha') },
          { id: 'chuva', icone: 'chuva', rotulo: 'Chuva', toque: () => jogar('chuva') },
          { id: 'pulo', icone: 'pulo', rotulo: 'Pulo', toque: () => jogar('pulo') },
          { id: 'vr', icone: 'vr_icone', rotulo: 'Biruleibe', toque: () => jogar('biruleibe') },
        ];
      case 'quintal':
        return [
          { id: 'passear', icone: 'passear', rotulo: 'Passear', toque: () => jogar('passeio'), classe: s.status.diversao < 40 ? 'destaque' : '' },
        ];
    }
    return [];
  }

  function atualizarAcoes() {
    ui.acoes(acoes(E.s.comodo));
  }

  function entrar(id) {
    atualizarAcoes();
    if (id !== 'quarto') CH.som.volumeTrilha(1);
  }

  function sair(id) {
    if (ui.gaveta.aberta) ui.gaveta.fechar();
    chuveiro(false);
    cancelarArrasto();
    if (id === 'quarto' && E.s.dormindo) acordar(true);
  }

  // ---------- cozinha: comer ----------

  function itensGeladeira() {
    const inv = E.s.inventario;
    return Object.keys(inv)
      .filter((k) => inv[k] > 0 && D.comidas[k])
      .sort((a, b) => (D.comidas[a].receita ? 0 : 1) - (D.comidas[b].receita ? 0 : 1) || (D.comidas[a].preco || 0) - (D.comidas[b].preco || 0))
      .map((k) => ({ id: k, nome: D.comidas[k].nome, qtd: inv[k] }));
  }

  function alternarGeladeira(forcar) {
    if (ui.gaveta.aberta && forcar !== true) { ui.gaveta.fechar(); CH.som.fechar(); atualizarAcoes(); return; }
    ui.gaveta.abrir('Geladeira', itensGeladeira(), pegarComida, () => painelMercado());
    CH.som.abrir();
    atualizarAcoes();
  }

  function pegarComida(id, e) {
    if (!e) {
      // toque simples: a comida voa até a boca
      if (performance.now() - st.ultimoArrasto < 400 || st.arrasto) return;
      const el = document.querySelector('.item[data-id="' + id + '"]');
      const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight - 200, width: 0, height: 0 };
      const p = G.paraMundo(r.left + r.width / 2, r.top + r.height / 2);
      st.voo = { id, x0: p.x, y0: p.y, t: 0 };
      return;
    }
    iniciarArrasto('comida', id, e);
  }

  function comer(id) {
    const s = E.s;
    const c = D.comidas[id];
    if (!c || !s.inventario[id]) return;
    if (s.dormindo) { G.falar(D.falas.recusa.dormindo); return; }
    if (st.comendo) return;
    if (c.recusa) {
      const fala = D.falas.recusa[c.recusa];
      G.expressao(c.recusa === 'pessego' ? 'bravo' : c.recusa === 'maca' ? 'susto' : 'nojo', 2.4);
      G.choru.cutucar(0.8);
      G.falar(fala);
      CH.som.erro();
      return;
    }
    if (s.status.fome >= 97 && !c.bebida) {
      G.expressao('nojo', 1.6);
      G.falar(D.falas.recusa.cheia);
      return;
    }
    E.item(id, -1);
    st.comendo = { id, t: 0, mordidas: 0 };
    if (ui.gaveta.aberta) ui.gaveta.preencher(itensGeladeira());
  }

  function terminarDeComer(id) {
    const c = D.comidas[id];
    E.efeito(c.efeito);
    E.vontade(c.bebida ? 8 : 12);
    E.s.contagem.comidas++;
    E.ganharXP(c.receita ? 5 : 2);
    CH.som.engolir();
    if (id === 'gororoba') {
      G.expressao('nojo', 2);
      G.falar(D.falas.gororoba[0]);
    } else if (c.favorita || c.receita) {
      G.expressao('gargalhada', 1.8);
      G.falar(U.pick(D.falas.favorita));
      G.choru.pular(0.6);
      G.particulas('coracao', 4);
    } else {
      G.expressao('feliz', 1.4);
      if (U.chance(0.45)) G.falar(U.pick(D.falas.gostou));
    }
  }

  // ---------- arrastar comida e sabonete ----------

  function iniciarArrasto(tipo, id, e) {
    if (st.arrasto) return;
    if (tipo === 'comida' && E.s.dormindo) { G.falar(D.falas.recusa.dormindo); return; }
    st.arrasto = { tipo, id, pointerId: e.pointerId, x: e.clientX, y: e.clientY, ultimo: null };
    ui.arrasto.mostrar(id);
    ui.arrasto.mover(e.clientX, e.clientY);
    window.addEventListener('pointermove', moverArrasto);
    window.addEventListener('pointerup', soltarArrasto);
    window.addEventListener('pointercancel', cancelarArrasto);
    if (tipo === 'sabonete') st.banho = st.banho || { espumou: 0, enxaguou: 0 };
  }

  function moverArrasto(e) {
    const a = st.arrasto;
    if (!a || e.pointerId !== a.pointerId) return;
    a.x = e.clientX; a.y = e.clientY;
    ui.arrasto.mover(a.x, a.y);
    const p = G.paraMundo(a.x, a.y);
    G.choru.olhar = p;
    if (a.tipo === 'sabonete') {
      const dentro = G.choru.dentro(p.x, p.y, 1.05);
      if (dentro && a.ultimo) {
        const d = Math.hypot(a.x - a.ultimo.x, a.y - a.ultimo.y);
        st.esfregado += d;
        if (st.esfregado > 16) {
          st.esfregado = 0;
          const l = G.choru.local(p.x, p.y);
          const esp = G.choru.espuma;
          if (esp.length < 70) {
            esp.push({ x: l.x + U.rnd(-8, 8), y: l.y + U.rnd(-8, 8), r: U.rnd(7, 15) });
            st.banho.espumou++;
          }
          if (U.chance(0.35)) CH.som.esfregar();
          if (U.chance(0.2)) CH.som.bolha();
          G.expressao('feliz', 0.6);
        }
      }
      a.ultimo = { x: a.x, y: a.y };
    } else {
      const boca = G.choru.bocaMundo();
      const d = U.dist(p.x, p.y, boca.x, boca.y);
      if (d < 190 * G.k()) G.expressao('esperando', 0.3);
    }
  }

  function soltarArrasto(e) {
    const a = st.arrasto;
    if (!a || (e && e.pointerId !== a.pointerId)) return;
    const p = G.paraMundo(a.x, a.y);
    if (a.tipo === 'comida') {
      const boca = G.choru.bocaMundo();
      const perto = U.dist(p.x, p.y, boca.x, boca.y) < 110 * G.k() || G.choru.dentro(p.x, p.y, 0.95);
      if (perto) comer(a.id);
    }
    cancelarArrasto();
  }

  function cancelarArrasto() {
    if (!st.arrasto) return;
    st.arrasto = null;
    st.ultimoArrasto = performance.now();
    G.choru.olhar = null;
    ui.arrasto.esconder();
    window.removeEventListener('pointermove', moverArrasto);
    window.removeEventListener('pointerup', soltarArrasto);
    window.removeEventListener('pointercancel', cancelarArrasto);
  }

  // ---------- banheiro ----------

  function chuveiro(ligar) {
    if (ligar === st.chuveiro) return;
    st.chuveiro = ligar;
    CH.som.chuveiro(ligar);
    if (ligar) {
      st.banho = st.banho || { espumou: 0, enxaguou: 0 };
      if (E.s.dormindo) acordar();
    } else if (st.banho && st.banho.enxaguou > 8 && !G.choru.espuma.length) {
      // banho completo
      E.s.contagem.banhos++;
      E.ganharXP(8);
      G.expressao('gargalhada', 1.6);
      G.falar(D.falas.aliviada);
      G.particulas('brilho', 6);
      st.banho = null;
    }
  }

  function usarVaso() {
    const s = E.s;
    if (st.vaso > 0) return;
    if (s.comodo !== 'banheiro') return;
    if (s.apertada <= 0 && s.vontade < 40) {
      G.falar('Não tô com vontade');
      return;
    }
    st.vaso = 2.6;
    G.expressao('apertada', 1.2);
  }

  function painelRemedio() {
    const s = E.s;
    ui.painel('Remédio', (c) => {
      c.appendChild(ui.el('p', '', s.status.saude >= 95
        ? 'A Chorú está com a saúde em dia. Guarde o remédio pra quando ela disser "Eu não tô 100%!".'
        : 'Um comprimido devolve 40 de saúde. Custa ' + D.remedio.preco + ' moedas.'));
      const f = ui.el('div', 'fila');
      const b = ui.el('button', 'botao verde', '<img alt="" src="' + img('remedio', 64) + '" style="width:32px;height:32px"> Dar remédio · ' + D.remedio.preco);
      b.type = 'button';
      b.disabled = s.moedas < D.remedio.preco || s.status.saude >= 95;
      b.onclick = () => {
        if (!E.gastar(D.remedio.preco)) return;
        ui.fecharPainel();
        E.efeito(D.remedio.efeito);
        E.ganharXP(3);
        CH.som.engolir();
        G.expressao('nojo', 1.2);
        setTimeout(() => { G.expressao('feliz', 1.5); G.falar('Aí sim!'); }, 1200);
      };
      f.appendChild(b);
      c.appendChild(f);
      if (s.moedas < D.remedio.preco) c.appendChild(ui.el('p', '', 'Faltam moedas. Jogue na Sala de Jogos ou passeie pra ganhar mais.'));
    });
  }

  // ---------- quarto ----------

  function alternarLuz() {
    CH.som.interruptor();
    if (E.s.dormindo) acordar();
    else dormir();
  }

  function dormir() {
    const s = E.s;
    s.dormindo = true;
    st.luzApagada = true;
    E.salvar();
    G.expressao(null);
    CH.som.volumeTrilha(0.45);
    atualizarAcoes();
    ui.atualizar();
  }

  function acordar(silencioso) {
    const s = E.s;
    if (!s.dormindo) return;
    s.dormindo = false;
    st.luzApagada = false;
    E.salvar();
    CH.som.volumeTrilha(1);
    ui.atualizar();
    if (!silencioso) {
      G.expressao('susto', 0.8);
      G.choru.cutucar(1);
      setTimeout(() => G.falar(s.status.energia > 90 ? 'Aí sim!' : D.falas.acordou), 300);
    }
    atualizarAcoes();
  }

  // ---------- caquinhas ----------

  function posCaquinha(c, L) {
    return { x: L.cx + c.x * Math.min(L.W * 0.9, 680), y: L.base + 26 };
  }

  function desenharCaquinhas(ctx, L, t, comodo) {
    E.s.caquinhas.filter((c) => c.comodo === comodo).forEach((c, i) => {
      const p = posCaquinha(c, L);
      const tam = 70;
      ctx.save();
      ctx.fillStyle = 'rgba(39,35,34,0.18)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, tam * 0.4, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      CH.desenhos.desenhar(ctx, 'caquinha', p.x, p.y - tam * 0.32, tam, Math.sin(t * 2 + i) * 0.04);
      // mosquinhas
      for (let m = 0; m < 2; m++) {
        const a = t * (3 + m) + i * 2 + m * 3;
        const mx = p.x + Math.cos(a) * 34, my = p.y - 60 + Math.sin(a * 1.7) * 14;
        ctx.fillStyle = U.TINTA;
        ctx.beginPath(); ctx.arc(mx, my, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.ellipse(mx - 2, my - 3.5, 3, 1.8, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(mx + 2, my - 3.5, 3, 1.8, 0.5, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  function toqueCaquinha(wx, wy, L) {
    const lista = E.s.caquinhas.filter((c) => c.comodo === E.s.comodo);
    for (const c of lista) {
      const p = posCaquinha(c, L);
      if (U.dist(wx, wy, p.x, p.y - 22) < 60) {
        E.limparCaquinha(c.id);
        E.ganharXP(2);
        CH.som.puf();
        G.particulas('puf', 8, p.x, p.y - 20);
        G.falar(D.falas.aliviada);
        return true;
      }
    }
    return false;
  }

  // ---------- toques no cenário ----------

  function toque(wx, wy, L) {
    if (toqueCaquinha(wx, wy, L)) return true;
    const sala = CH.cenarios.C[E.s.comodo];
    const pts = sala.pontos ? sala.pontos(L) : [];
    const p = pts.find((h) => wx >= h.x && wx <= h.x + h.w && wy >= h.y && wy <= h.y + h.h);
    if (!p) return false;
    CH.som.botao();
    switch (p.id) {
      case 'geladeira': alternarGeladeira(); break;
      case 'fogao': painelFogao(); break;
      case 'vaso': usarVaso(); break;
      case 'remedios': painelRemedio(); break;
      case 'luz': alternarLuz(); break;
      case 'guarda-roupa': painelRoupas(); break;
      case 'fliperama': painelFliperama(); break;
      case 'vr': jogar('biruleibe'); break;
      case 'portao': jogar('passeio'); break;
    }
    return true;
  }

  function painelFliperama() {
    ui.painel('Fliperama', (c) => {
      c.appendChild(ui.el('p', '', 'Escolha um jogo. Cada um dá moedas conforme os pontos.'));
      const g = ui.el('div', 'grade');
      [['empilha', 'blocos', 'Tetris'], ['chuva', 'chuva', 'Chuva de Comida'], ['pulo', 'pulo', 'Pulo da Maçã'], ['biruleibe', 'vr_icone', 'Biruleibe VR']].forEach(([id, ic, nome]) => {
        const p = ui.el('div', 'produto');
        p.innerHTML = '<img alt="" src="' + img(ic, 128) + '"><div class="nome">' + nome + '</div><div class="efeito">Recorde: ' + U.num(E.s.recordes[id] || 0) + '</div>';
        const b = ui.el('button', 'preco', 'Jogar');
        b.type = 'button';
        b.onclick = () => { ui.fecharPainel(); jogar(id); };
        p.appendChild(b);
        g.appendChild(p);
      });
      c.appendChild(g);
    });
  }

  function jogar(nome) {
    const s = E.s;
    const min = nome === 'passeio' ? 15 : 10;
    if (s.dormindo) { G.falar(D.falas.recusa.dormindo); return; }
    if (s.status.energia < min) {
      G.expressao('sono', 2);
      G.falar(nome === 'passeio' ? D.falas.passeioCansada : D.falas.sono);
      return;
    }
    CH.jogos.abrir(nome);
  }

  // ---------- fogão e receitas ----------

  function receitaDe(a, b) {
    return D.receitas.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));
  }

  function painelFogao() {
    if (st.cozinhando > 0) { ui.toast('Já tem coisa no fogo'); return; }
    const slots = [null, null];
    ui.painel('Fogão', (c) => {
      const desenhar = () => {
        c.innerHTML = '';
        c.appendChild(ui.el('p', '', 'Junte dois ingredientes. Se for uma receita, sai um prato especial.'));
        const area = ui.el('div', 'fogao-area');
        slots.forEach((id, i) => {
          const sl = ui.el('button', 'slot' + (id ? ' cheio' : ''), id ? '<img alt="" src="' + img(id) + '">' : 'vazio');
          sl.type = 'button';
          sl.setAttribute('aria-label', id ? 'Tirar ' + D.comidas[id].nome : 'Espaço vazio');
          sl.onclick = () => { slots[i] = null; desenhar(); };
          area.appendChild(sl);
          if (i === 0) area.appendChild(ui.el('span', 'mais', '+'));
        });
        c.appendChild(area);
        const f = ui.el('div', 'fila');
        const coz = ui.el('button', 'botao', 'Cozinhar');
        coz.type = 'button';
        coz.disabled = !(slots[0] && slots[1]);
        coz.onclick = () => cozinhar(slots[0], slots[1]);
        f.appendChild(coz);
        c.appendChild(f);

        c.appendChild(ui.el('h3', '', 'Seus ingredientes')).style.cssText = 'font-family:var(--fonte-titulo);font-weight:400;margin:16px 0 8px';
        const inv = E.s.inventario;
        const lista = Object.keys(inv).filter((k) => D.comidas[k] && !D.comidas[k].receita && inv[k] > 0);
        if (!lista.length) c.appendChild(ui.el('p', '', 'Nada na geladeira. Compre ingredientes no Mercado.'));
        const g = ui.el('div', 'grade');
        lista.forEach((k) => {
          const usados = slots.filter((x) => x === k).length;
          const resta = inv[k] - usados;
          const p = ui.el('button', 'produto', '<img alt="" src="' + img(k) + '"><div class="nome">' + D.comidas[k].nome + '</div><div class="efeito">' + resta + ' na geladeira</div>');
          p.type = 'button';
          p.disabled = resta <= 0;
          if (resta <= 0) p.style.opacity = 0.45;
          p.onclick = () => {
            const i = slots.indexOf(null);
            if (i < 0) return;
            slots[i] = k;
            CH.som.toque();
            desenhar();
          };
          g.appendChild(p);
        });
        c.appendChild(g);

        // livro de receitas
        const h = ui.el('h3', '', 'Livro de receitas');
        h.style.cssText = 'font-family:var(--fonte-titulo);font-weight:400;margin:18px 0 6px;display:flex;align-items:center;gap:8px';
        h.insertAdjacentHTML('afterbegin', '<img alt="" src="assets/jogo/medalha-05.webp" style="width:40px;height:40px">');
        c.appendChild(h);
        D.receitas.forEach((r) => {
          const sabe = E.s.receitas.includes(r.r);
          const linha = ui.el('div', 'receita-linha' + (sabe ? '' : ' desconhecida'));
          linha.innerHTML = sabe
            ? '<img alt="" src="' + img(r.a) + '"><span class="eq">+</span><img alt="" src="' + img(r.b) + '"><span class="eq">=</span><img alt="" src="' + img(r.r) + '"><span class="nome-r">' + D.comidas[r.r].nome + '</span>'
            : '<span class="nome-r">??? + ??? = ???</span>';
          c.appendChild(linha);
        });
        c.appendChild(ui.el('p', '', '<br>' + E.s.receitas.length + ' de ' + D.receitas.length + ' receitas descobertas.'));
      };
      desenhar();
    });
  }

  function cozinhar(a, b) {
    if (!a || !b) return;
    const inv = E.s.inventario;
    if (a === b ? (inv[a] || 0) < 2 : !inv[a] || !inv[b]) return;
    E.item(a, -1);
    E.item(b, -1);
    const r = receitaDe(a, b);
    st.pratoPronto = r ? r.r : 'gororoba';
    st.cozinhando = 2.4;
    ui.fecharPainel();
    CH.som.cozinhar();
    G.expressao('esperando', 2.4);
  }

  function pratoSaiu() {
    const id = st.pratoPronto;
    st.pratoPronto = null;
    E.item(id, 1);
    CH.som.pronto();
    const nova = id !== 'gororoba' && !E.s.receitas.includes(id);
    if (nova) {
      E.s.receitas.push(id);
      E.ganharXP(15);
      ui.toast('Receita nova: ' + D.comidas[id].nome + '!', id);
      G.falar('Aqui é explosão de chorume!');
      G.choru.dancar(2);
    } else if (id === 'gororoba') {
      ui.toast('Saiu uma gororoba...', 'gororoba');
      G.falar('BUUUUUUUUT');
      G.expressao('nojo', 1.6);
    } else {
      ui.toast(D.comidas[id].nome + ' pronto!', id);
      E.ganharXP(6);
    }
    if (ui.gaveta.aberta) ui.gaveta.preencher(itensGeladeira());
  }

  // ---------- mercado ----------

  function painelMercado() {
    const s = E.s;
    ui.painel('Mercado', (c) => {
      const desenhar = () => {
        c.innerHTML = '';
        c.appendChild(ui.el('p', '', 'Você tem <b>' + U.num(s.moedas) + '</b> moedas.'));
        const g = ui.el('div', 'grade');
        Object.keys(D.comidas)
          .filter((k) => !D.comidas[k].receita)
          .sort((a, b) => D.comidas[a].nivel - D.comidas[b].nivel || D.comidas[a].preco - D.comidas[b].preco)
          .forEach((k) => {
            const it = D.comidas[k];
            const bloq = it.nivel > s.nivel;
            const p = ui.el('div', 'produto');
            const tem = s.inventario[k] || 0;
            p.innerHTML = '<img alt="" src="' + img(k, 128) + '"><div class="nome">' + it.nome + '</div>' +
              '<div class="efeito">' + (it.ingrediente && !it.efeito ? 'ingrediente' : ui.efeitoTexto(it.efeito) || (it.recusa ? 'hmm...' : '')) + '</div>' +
              (tem ? '<div class="tem">' + tem + '</div>' : '');
            if (bloq) {
              p.appendChild(ui.el('div', 'bloqueio', 'Nível ' + it.nivel));
              p.style.opacity = 0.6;
            } else {
              const b = ui.preco(it.preco, s.moedas < it.preco);
              b.onclick = () => {
                if (!E.gastar(it.preco)) return;
                E.item(k, 1);
                CH.som.compra();
                desenhar();
                if (ui.gaveta.aberta) ui.gaveta.preencher(itensGeladeira());
              };
              p.appendChild(b);
            }
            g.appendChild(p);
          });
        c.appendChild(g);
      };
      desenhar();
    });
  }

  // ---------- guarda-roupa ----------

  const retratos = {};
  function retrato(op) {
    const chave = JSON.stringify(op);
    if (retratos[chave]) return retratos[chave];
    const cv = document.createElement('canvas');
    cv.width = 160; cv.height = 160;
    const ctx = cv.getContext('2d');
    const ch = CH.choru.criar();
    ch.update(1);
    ch.piscar = 0;
    ch.desenhar(ctx, 80, 148, 0.56, Object.assign({ sombra: false }, op));
    let url = '';
    try { url = cv.toDataURL('image/png'); } catch (e) { url = ''; }
    retratos[chave] = url;
    return url;
  }

  function painelRoupas() {
    const s = E.s;
    let grupo = 'cabeca';
    ui.painel('Guarda-roupa', (c) => {
      const desenhar = () => {
        c.innerHTML = '';
        const prov = ui.el('div', 'provador');
        const cv = document.createElement('canvas');
        cv.width = 360; cv.height = 340;
        prov.appendChild(cv);
        c.appendChild(prov);
        const pctx = cv.getContext('2d');
        const ch = CH.choru.criar();
        ch.expressao('feliz');
        ch.update(1);
        ch.desenhar(pctx, 180, 318, 1.08, { pele: s.roupas.cor, cabeca: s.roupas.cabeca, olhos: s.roupas.olhos });

        const abas = ui.el('div', 'abas');
        D.gruposRoupa.forEach((gr) => {
          const a = ui.el('button', 'aba' + (gr.id === grupo ? ' ativa' : ''), gr.nome);
          a.type = 'button';
          a.onclick = () => { grupo = gr.id; desenhar(); };
          abas.appendChild(a);
        });
        c.appendChild(abas);

        const g = ui.el('div', 'grade');
        Object.keys(D.roupas).filter((k) => D.roupas[k].grupo === grupo).forEach((k) => {
          const r = D.roupas[k];
          const possui = s.roupas.possui.includes(k);
          const usando = (grupo === 'cor' ? s.roupas.cor : s.roupas[grupo]) === k;
          const bloq = r.nivel > s.nivel;
          const p = ui.el('div', 'produto' + (usando ? ' usando' : ''));
          const op = grupo === 'cor' ? { pele: k } : grupo === 'cabeca' ? { cabeca: k } : { olhos: k };
          const src = r.medalha ? 'assets/jogo/' + r.medalha + '.webp' : retrato(op);
          p.innerHTML = '<img alt="" src="' + src + '"><div class="nome">' + r.nome + '</div>';
          if (bloq && !possui) {
            p.appendChild(ui.el('div', 'bloqueio', 'Nível ' + r.nivel));
            p.style.opacity = 0.6;
          } else if (!possui) {
            const b = ui.preco(r.preco, s.moedas < r.preco);
            b.onclick = () => {
              if (!E.gastar(r.preco)) return;
              s.roupas.possui.push(k);
              CH.som.compra();
              vestir(k);
              desenhar();
            };
            p.appendChild(b);
          } else {
            const b = ui.el('button', 'preco', usando ? (grupo === 'cor' ? 'Usando' : 'Tirar') : 'Usar');
            b.type = 'button';
            if (usando && grupo === 'cor') b.disabled = true;
            b.onclick = () => {
              if (usando) despir(grupo); else vestir(k);
              desenhar();
            };
            p.appendChild(b);
          }
          g.appendChild(p);
        });
        c.appendChild(g);
      };
      desenhar();
    });
  }

  function vestir(k) {
    const s = E.s;
    const r = D.roupas[k];
    if (r.recusa) {
      ui.fecharPainel();
      G.expressao('bravo', 2.6);
      G.choru.cutucar(1);
      G.falar(D.falas.pessegoRoupa, 3);
      CH.som.erro();
      return;
    }
    if (r.grupo === 'cor') s.roupas.cor = k;
    else s.roupas[r.grupo] = k;
    G.aplicarRoupas();
    E.salvar();
    G.expressao('feliz', 1.2);
    CH.som.boing();
  }

  function despir(grupo) {
    E.s.roupas[grupo] = null;
    G.aplicarRoupas();
    E.salvar();
  }

  // ---------- atualização por quadro ----------

  function update(dt) {
    const s = E.s;
    // comida voando até a boca
    if (st.voo) {
      st.voo.t += dt / 0.35;
      if (st.voo.t >= 1) { const id = st.voo.id; st.voo = null; comer(id); }
      else G.expressao('esperando', 0.2);
    }
    // mastigando
    if (st.comendo) {
      const c = st.comendo;
      c.t += dt;
      const mordida = Math.floor(c.t / 0.42);
      if (mordida > c.mordidas && mordida <= 3) {
        c.mordidas = mordida;
        CH.som.mordida();
        G.particulas('farelo', 5);
        G.choru.cutucar(0.35);
      }
      G.choru.mastigar = 1;
      if (c.t > 1.5) {
        st.comendo = null;
        G.choru.mastigar = 0;
        terminarDeComer(c.id);
      }
    }
    // fogão
    if (st.cozinhando > 0) {
      st.cozinhando -= dt;
      if (st.cozinhando <= 0) { st.cozinhando = 0; pratoSaiu(); }
    }
    // chuveiro enxaguando
    if (st.chuveiro) {
      const esp = G.choru.espuma;
      G.choru.molhada = 1;
      G.expressao('mastigando', 0.2);
      let tirar = Math.min(esp.length, Math.ceil(30 * dt + U.rand()));
      while (tirar-- > 0 && esp.length) {
        esp.splice(Math.floor(U.rand() * esp.length), 1);
        E.efeito({ higiene: 1.15 });
        if (st.banho) st.banho.enxaguou++;
      }
      if (!esp.length) E.efeito({ higiene: 3 * dt });
    }
    // descarga
    st.descarga = Math.max(0, st.descarga - dt);
    if (st.vaso > 0) {
      const antes = st.vaso;
      st.vaso -= dt;
      if (antes > 1.2 && st.vaso <= 1.2) {
        CH.som.descarga();
        st.descarga = 1.4;
        E.aliviar();
        E.ganharXP(3);
        G.expressao('feliz', 1.4);
        G.falar(D.falas.aliviada);
        atualizarAcoes();
      }
      if (st.vaso <= 0) st.vaso = 0;
    }
    st.luzApagada = s.dormindo;
  }

  // Desenha a comida na boca enquanto ela mastiga, e a que está voando.
  function desenharComida(ctx) {
    const k = G.k();
    if (st.voo) {
      const b = G.choru.bocaMundo();
      const t = U.ease.outCubic(st.voo.t);
      const x = U.lerp(st.voo.x0, b.x, t), y = U.lerp(st.voo.y0, b.y, t) - Math.sin(t * Math.PI) * 120;
      CH.desenhos.desenhar(ctx, st.voo.id, x, y, 90 * k * (1 - t * 0.3), t * 3);
    }
    if (st.comendo) {
      const b = G.choru.bocaMundo();
      const frac = 1 - st.comendo.mordidas * 0.3;
      if (frac > 0.1) CH.desenhos.desenhar(ctx, st.comendo.id, b.x + 14 * k, b.y + 6 * k, 76 * k * frac, -0.2);
    }
  }

  // Camada da frente do cômodo, depois da Chorú.
  function desenharFrente(ctx, L, t, comodo) {
    if (comodo === 'quarto' && E.s.dormindo) {
      ctx.fillStyle = 'rgba(24, 26, 64, 0.58)';
      ctx.fillRect(-10, -10, L.W + 20, L.H + 20);
      // Zzz
      const ch = G.choru;
      const top = ch.mundo(60, -110);
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.45 + i / 3) % 1;
        ctx.save();
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        CH.cenarios.texto(ctx, 'Z', top.x + ph * 60 + Math.sin(ph * 6) * 10, top.y - ph * 120, 26 + ph * 26, '#FFFFFF', U.TINTA, -0.2);
        ctx.restore();
      }
    }
  }

  CH.comodos = {
    st,
    init(g) { G = g; },
    acoes, atualizarAcoes, entrar, sair,
    toque, update, desenharComida, desenharFrente, desenharCaquinhas,
    alternarGeladeira, painelMercado, painelRoupas, painelFogao, painelRemedio,
    usarVaso, acordar, dormir, jogar, comer, retrato,
    get ocupado() { return !!(st.comendo || st.voo || st.vaso > 0); },
  };
})(window.CH);
