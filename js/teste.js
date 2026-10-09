// Versão de testes: ferramentas pra testar tudo sem esperar o tempo real passar.
(function (CH) {
  const E = CH.estado;
  const ui = CH.ui;
  // Ferramentas pra testar tudo rápido, sem esperar o tempo real passar.
  const FERRAMENTAS = [
    ['+500 moedas', () => { E.moedas(500); }],
    ['Subir de nível', () => { E.ganharXP(E.xpProximo() - E.s.xp); }],
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
