// Versão de testes: ferramentas pra testar tudo sem esperar o tempo real passar.
(function (CH) {
  const E = CH.estado;
  const ui = CH.ui;
  // Ferramentas pra testar tudo rápido, sem esperar o tempo real passar.
  const FERRAMENTAS = [
    ['+500 moedas', () => { E.moedas(500); }],
    ['Subir 1 nível', () => { E.ganharXP(E.xpProximo() - E.s.xp); }],
    ['Subir 10 níveis', () => { E.definirNivel(E.s.nivel + 10); }],
    ['Nível máximo (' + E.NIVEL_MAX + ')', () => { E.definirNivel(E.NIVEL_MAX); }],
    ['Voltar pro nível 1', () => { E.definirNivel(1); }],
    ['Passar 3 horas', () => { const r = E.avancar(3); if (r.caquinhas) ui.toast('Apareceu caquinha'); }],
    ['Deixar com fome', () => { E.s.status.fome = 12; E.efeito({}); }],
    ['Sujar a Chorú', () => { E.s.status.higiene = 10; E.efeito({}); }],
    ['Deixar com sono', () => { E.s.status.energia = 10; E.efeito({}); }],
    ['Deixar doente', () => { E.s.status.saude = 20; E.efeito({}); }],
    ['Vontade de ir ao banheiro', () => { E.s.vontade = 99; E.vontade(5); }],
    ['Fazer caquinha', () => { E.novaCaquinha(E.s.comodo); E.salvar(); }],
    ['Encher a geladeira', () => { ['ovo', 'leite', 'farinha', 'queijo', 'banana', 'morango', 'pao_frances', 'coxinha', 'pessego', 'aipo'].forEach((k) => E.item(k, 2)); }],
  ];

  function painelFerramentas() {
    ui.painel('Ferramentas de teste', (c) => {
      c.appendChild(ui.el('p', '', 'Atalhos pra testar o jogo sem esperar. Eles mudam o seu progresso de verdade.'));
      // ir direto pra um nível
      const linha = ui.el('div', 'ir-nivel');
      const rot = ui.el('label', '', 'Ir pro nível');
      rot.setAttribute('for', 'teste-nivel');
      const inp = document.createElement('input');
      inp.id = 'teste-nivel'; inp.type = 'number'; inp.min = '1'; inp.max = String(E.NIVEL_MAX); inp.inputMode = 'numeric';
      inp.value = String(E.s.nivel);
      const ir = ui.el('button', 'botao verde', 'Ir');
      ir.type = 'button';
      ir.onclick = () => {
        if (!E.definirNivel(inp.value)) {
          ui.toast('Digite um nível de 1 a ' + E.NIVEL_MAX);
          inp.value = String(E.s.nivel);
          return;
        }
        inp.value = String(E.s.nivel);
        ui.atualizar();
        ui.toast('Agora no nível ' + E.s.nivel, 'i_estrela');
        CH.som.botao();
      };
      linha.appendChild(rot); linha.appendChild(inp); linha.appendChild(ir);
      c.appendChild(linha);
      c.appendChild(ui.el('p', 'nota', 'O nível máximo é ' + E.NIVEL_MAX + '.'));
      const g = ui.el('div', 'fila');
      FERRAMENTAS.forEach(([nome, fn]) => {
        const b = ui.el('button', 'botao sec', nome);
        b.type = 'button';
        b.onclick = () => { fn(); ui.atualizar(); ui.toast(nome + ': feito'); CH.som.botao(); };
        g.appendChild(b);
      });
      c.appendChild(g);
    });
  }

  // Botão que entra no painel de configurações.
  function botoesConfig(c) {
    if (CH.config.teste) {
      const f = ui.el('div', 'fila');
      const fe = ui.el('button', 'botao sec', 'Ferramentas de teste');
      fe.type = 'button';
      fe.onclick = painelFerramentas;
      f.appendChild(fe);
      c.appendChild(f);
    }
    c.appendChild(ui.el('p', 'versao', 'Versão ' + CH.config.versao + (CH.config.teste ? ' · teste' : '')));
  }

  CH.teste = { painelFerramentas, botoesConfig };
})(window.CH);
