// Catálogo do jogo: comidas, receitas, roupas, cômodos e falas.
(function (CH) {
  const D = {};

  // efeito: quanto cada status sobe (ou desce) ao comer.
  // recusa: motivo pelo qual a Chorú não come.
  D.comidas = {
    pao_frances:  { nome: 'Pão francês',     preco: 4,  nivel: 1, efeito: { fome: 10 }, ingrediente: true },
    pao_queijo:   { nome: 'Pão de queijo',   preco: 6,  nivel: 1, efeito: { fome: 12, diversao: 2 } },
    coxinha:      { nome: 'Coxinha',         preco: 8,  nivel: 1, efeito: { fome: 18, diversao: 5 }, favorita: true },
    brigadeiro:   { nome: 'Brigadeiro',      preco: 5,  nivel: 1, efeito: { fome: 6, diversao: 9, saude: -1 } },
    guarana:      { nome: 'Guaraná',         preco: 5,  nivel: 1, efeito: { fome: 3, diversao: 5, energia: 8 }, bebida: true },
    banana:       { nome: 'Banana',          preco: 3,  nivel: 1, efeito: { fome: 8, saude: 2 }, ingrediente: true },
    leite:        { nome: 'Leite',           preco: 4,  nivel: 1, efeito: { fome: 5, saude: 1 }, ingrediente: true, bebida: true },
    ovo:          { nome: 'Ovo',             preco: 3,  nivel: 1, ingrediente: true, recusa: 'cru' },
    queijo:       { nome: 'Queijo',          preco: 5,  nivel: 1, efeito: { fome: 8 }, ingrediente: true },
    farinha:      { nome: 'Farinha',         preco: 3,  nivel: 1, ingrediente: true, recusa: 'farinha' },
    aipo:         { nome: 'Aipo',            preco: 1,  nivel: 1, recusa: 'caule' },
    pessego:      { nome: 'Pêssego',         preco: 2,  nivel: 1, recusa: 'pessego' },
    pastel:       { nome: 'Pastel',          preco: 9,  nivel: 2, efeito: { fome: 18, diversao: 5 } },
    pipoca:       { nome: 'Pipoca',          preco: 5,  nivel: 2, efeito: { fome: 8, diversao: 7 } },
    morango:      { nome: 'Morango',         preco: 4,  nivel: 2, efeito: { fome: 6, saude: 2 }, ingrediente: true },
    picole:       { nome: 'Picolé',          preco: 6,  nivel: 2, efeito: { fome: 5, diversao: 9 } },
    melancia:     { nome: 'Melancia',        preco: 4,  nivel: 2, efeito: { fome: 7, saude: 3 } },
    maca:         { nome: 'Maçã',            preco: 2,  nivel: 2, recusa: 'maca' },
    pizza:        { nome: 'Pizza',           preco: 14, nivel: 3, efeito: { fome: 28, diversao: 7, saude: -2 } },
    suco_abacaxi: { nome: 'Suco de abacaxi', preco: 10, nivel: 3, efeito: { fome: 8, energia: 6, saude: 3 }, bebida: true },
    acai:         { nome: 'Açaí',            preco: 15, nivel: 4, efeito: { fome: 24, diversao: 7, energia: 6 } },
    // Pratos do fogão. Não aparecem na loja.
    misto:        { nome: 'Misto-quente',    receita: true, efeito: { fome: 26, diversao: 6 } },
    omelete:      { nome: 'Omelete',         receita: true, efeito: { fome: 24, saude: 3 } },
    vitamina:     { nome: 'Vitamina',        receita: true, efeito: { fome: 18, energia: 8, saude: 2 }, bebida: true },
    pudim:        { nome: 'Pudim',           receita: true, efeito: { fome: 16, diversao: 14 } },
    milkshake:    { nome: 'Milk-shake',      receita: true, efeito: { fome: 12, diversao: 14 }, bebida: true },
    bolo:         { nome: 'Bolo',            receita: true, efeito: { fome: 24, diversao: 12 } },
    fornada:      { nome: 'Fornada de pão de queijo', receita: true, efeito: { fome: 34, diversao: 8 } },
    torta_banana: { nome: 'Torta de banana', receita: true, efeito: { fome: 26, diversao: 9 } },
    gororoba:     { nome: 'Gororoba',        receita: true, efeito: { fome: 5, diversao: -6 } },
  };

  // Receitas do fogão: a ordem dos ingredientes não importa.
  D.receitas = [
    { a: 'pao_frances', b: 'queijo',  r: 'misto' },
    { a: 'ovo',         b: 'queijo',  r: 'omelete' },
    { a: 'leite',       b: 'banana',  r: 'vitamina' },
    { a: 'leite',       b: 'ovo',     r: 'pudim' },
    { a: 'leite',       b: 'morango', r: 'milkshake' },
    { a: 'farinha',     b: 'ovo',     r: 'bolo' },
    { a: 'farinha',     b: 'queijo',  r: 'fornada' },
    { a: 'farinha',     b: 'banana',  r: 'torta_banana' },
  ];

  D.remedio = { nome: 'Remédio', preco: 25, efeito: { saude: 40 } };

  // Guarda-roupa. "medalha" aponta para a arte da campanha usada como ícone na loja.
  D.roupas = {
    classica:  { nome: 'Clássica',      grupo: 'cor', preco: 0,   nivel: 1 },
    verde:     { nome: 'Maçã Verde',    grupo: 'cor', preco: 200, nivel: 3 },
    amor:      { nome: 'Maçã do Amor',  grupo: 'cor', preco: 350, nivel: 5 },
    dourada:   { nome: 'Dourada',       grupo: 'cor', preco: 600, nivel: 8 },
    pessego:   { nome: 'Pêssego',       grupo: 'cor', preco: 1,   nivel: 1, recusa: true },
    bone:      { nome: 'Boné Roxo',     grupo: 'cabeca', preco: 120, nivel: 1, medalha: 'medalha-03' },
    fone:      { nome: 'Fone Gamer',    grupo: 'cabeca', preco: 180, nivel: 2, medalha: 'medalha-02' },
    laco:      { nome: 'Laço',          grupo: 'cabeca', preco: 60,  nivel: 1 },
    chef:      { nome: 'Chapéu de Chef', grupo: 'cabeca', preco: 150, nivel: 3 },
    touca:     { nome: 'Touca de Banho', grupo: 'cabeca', preco: 80,  nivel: 2 },
    coroa:     { nome: 'Coroa',         grupo: 'cabeca', preco: 500, nivel: 7 },
    oculos:    { nome: 'Óculos Escuros', grupo: 'olhos', preco: 150, nivel: 1, medalha: 'medalha-08' },
    vr:        { nome: 'Óculos VR',     grupo: 'olhos', preco: 250, nivel: 4 },
    monoculo:  { nome: 'Monóculo',      grupo: 'olhos', preco: 200, nivel: 6 },
  };

  D.gruposRoupa = [
    { id: 'cabeca', nome: 'Cabeça' },
    { id: 'olhos', nome: 'Olhos' },
    { id: 'cor', nome: 'Cor da fruta' },
  ];

  D.comodos = [
    { id: 'cozinha',  nome: 'Cozinha' },
    { id: 'banheiro', nome: 'Banheiro' },
    { id: 'quarto',   nome: 'Quarto' },
    { id: 'sala',     nome: 'Sala de Jogos' },
    { id: 'quintal',  nome: 'Quintal' },
  ];

  D.estagios = [
    { ate: 4,   nome: 'Choruzinha' },
    { ate: 14,  nome: 'Chorú' },
    { ate: 999, nome: 'Chorumaçã' },
  ];

  // Frases oficiais da campanha e avisos curtos.
  D.falas = {
    toque: [
      'Baby baby do baby do biruleibe leibe?',
      'I love your people!',
      'Aí sim!',
      'Frutofóbicos não passarão!',
      'Aqui é explosão de chorume!',
      'Ih mané, pingou hein!',
    ],
    carinho: ['I love your people!', 'Aí sim!'],
    gostou: ['Aí sim!', 'I love your people!'],
    favorita: ['Aqui é explosão de chorume!', 'Aí sim!'],
    gororoba: ['BUUUUUUUUT'],
    recusa: {
      caule: 'Não são permitidos caules!',
      pessego: 'Isso é um pêssego. Eu sou uma maçã.',
      maca: 'Comer parente? BUUUUUUUUT',
      cru: 'Ovo cru? BUUUUUUUUT',
      farinha: 'Farinha pura? BUUUUUUUUT',
      cheia: 'Tô cheia!',
      dormindo: 'Zzz...',
    },
    pessegoRoupa: 'Isso é um pêssego. Eu sou uma maçã.',
    fome: 'Tô com fome',
    suja: 'Tô precisando de um banho',
    sono: 'Tô com sono',
    tedio: 'Bora jogar?',
    doente: 'Eu não tô 100%!',
    apertada: 'Tô apertada!',
    aliviada: 'Aí sim!',
    moedas: 'Ih mané, pingou hein!',
    nivel: 'I love your people!',
    erro: 'BUUUUUUUUT',
    passeioCansada: 'Tô sem energia pra passear',
    acordou: 'Acordei!',
  };

  CH.dados = D;
})(window.CH);
