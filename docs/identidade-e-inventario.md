# Identidade e inventário — Chorumaçã O Jogo!

Levantamento feito em 08/10/2026 antes de programar. Tudo veio da campanha da Brabo Studio no Catarse (catarse.com.br/chorumaca). As fotos de perfil dos apoiadores ficaram de fora.

## Quem é a Chorú

- **Personagem:** Chorumaçã, um pêssego que se reconhece como maçã. Apelidos: Choru, Chorú, Choruzinha. A campanha trata a personagem no feminino.
- **Criador:** Diogo Defante, o "Papai". O jogo é da Brabo Studio.
- **Origem do visual:** no YouTube ela é um pêssego real com rosto (`choru-rebolado.gif`). No jogo ela vira desenho, com o traço das ilustrações da campanha.
- **Regra de ouro:** ela é uma maçã e exige respeito. Chamar de pêssego é ofensa. "Frutofóbicos não passarão!"

## Falas oficiais (tiradas da campanha)

| Fala | Uso no jogo |
|---|---|
| "Ih mané, pingou hein!" | Ganhou moedas ou algo caiu |
| "Aí sim!" | Comida boa, banho terminado, recorde |
| "BUUUUUUUUT" | Quando algo dá errado ou na hora de recusar |
| "Eu não tô 100%!" | Doente ou com a energia baixa |
| "I love your people!" | Carinho, presente, subiu de nível |
| "Baby baby do baby do biruleibe leibe?" | Fala aleatória quando você toca nela |
| "Frutofóbicos não passarão!" | Passeio e minijogos, ao desviar de inimigos |
| "Aqui é explosão de chorume!" | Recorde, combo, festa |
| "Não são permitidos caules!" | Recusa comida com caule |

## Paleta medida nos pixels

| Papel | Hex | De onde saiu |
|---|---|---|
| Corpo, luz | `#F24B64` | `choru-01.png`, 21% dos pixels |
| Corpo, brilho | `#F85068` | `choru-01.png` |
| Corpo, sombra | `#BC314A` | `choru-01.png`, lado esquerdo do corpo |
| Topo amarelo-limão | `#D1ED92` (na capa, `#E9FB9E`) | mancha no topo da fruta |
| Folha | `#A3D16D` | folha do cabinho |
| Contorno | `#272322` | traço preto quente, grosso |
| Branco dos olhos e brilhos | `#FBF5EE` | olhos e reflexos |
| Língua | `#E597A5` | boca |
| Fundo da boca | `#572F34` | boca |
| Espiral clara | `#FFE7EB` | `capa.png` |
| Espiral forte | `#ED5369` | `capa.png` |
| Espiral sombra | `#BE374C` | `capa.png` |
| Ouro das medalhas | `#FFCB6E`, sombra `#ECA555`, brilho `#FFE9AD` | `recompensa-*.png` |
| Faixas de título | `#E7F2FF` e `#BBCCE2`, listras amarelas | `faixa*.png` |
| Cartão das metas | `#5B8E9C`, texto `#E6F3F8` | `metas-lista.png` |
| Roxo Brabo Studio | `#5F43A6` | `brabo-capa.png` |

**Como a paleta vira jogo:** o rosa da Chorú é a cor da personagem e da marca. O ouro das medalhas vira a cor das moedas e da loja. O azul-petróleo das metas `#5B8E9C` vira a cor dos botões e painéis da interface, porque contrasta com o rosa sem brigar. O roxo da Brabo aparece só na tela de créditos.

## Traço

- Contorno preto quente `#272322`, grosso e com espessura variável, como pincel.
- Sombra chapada em duas cores, sem degradê: o lado esquerdo do corpo é carmim, o direito é rosa.
- Brilhos em branco: um filete na borda direita do corpo e pequenos traços nas bochechas.
- Topo da fruta em amarelo-limão, com borda irregular, e uma folha verde curvada pra esquerda.
- **Rosto padrão:** olhar de deboche pra cima e pro lado, sobrancelha implícita na pálpebra, boca bem aberta com língua rosa e bochechas coradas.
- **Variações que já existem na arte:** boca em "O" de susto (meta de 40K), gargalhada (90K), óculos escuros, fone gamer e boné roxo (recompensas).

## Tipografia

Comparei as letras da campanha com 28 fontes do Google Fonts.

| Papel | Fonte | Por quê |
|---|---|---|
| Títulos, botões e números | **Lilita One** | Grossa e arredondada como "CHORUMAÇÃ O JOGO!". Para imitar o balanço das letras, cada letra ganha uma leve rotação. |
| Falas e textos da interface | **Gochi Hand** | Letra à mão em caixa alta com o "i" minúsculo, igual aos cartões das metas. |

As duas fontes vão junto com o jogo, então ele funciona sem internet.

## Arquivos baixados

Pasta `assets/catarse/`, 24 arquivos, 9,2 MB. Todos os PNGs têm fundo transparente, exceto a capa.

| Arquivo | Tamanho | Uso no jogo |
|---|---|---|
| `capa.png` | 8000×4500 | Fundo e logo da tela inicial (reduzido pra 1600 px) |
| `choru-01.png` | 483×480 | Ícone do jogo e referência do desenho da Chorú |
| `choru-na-mesa.png` | 1334×894 | Referência da cozinha: geladeira, fogão, azulejo xadrez verde-água, mesa redonda e pinguim na geladeira |
| `choru-rebolado.gif` | 345×373, 33 quadros | Referência da dancinha, que vira animação de comemoração |
| `recompensa-01.png` | 523×505 | Medalha "Chorú clássica" |
| `recompensa-02.png` | 513×560 | Ícone da skin Fone Gamer |
| `recompensa-03.png` | 511×511 | Ícone da skin Boné Roxo |
| `recompensa-04.png` | 511×511 | Chorú com o Defante, para a tela de créditos |
| `recompensa-05-livro.png` | 509×514 | Ícone do Livro de Receitas |
| `recompensa-06.png` | 501×510 | Ícone da camiseta, um item da loja |
| `recompensa-07-abacaxi.png` | 514×560 | Caneca de abacaxi, um item da cozinha |
| `recompensa-08.png` | 512×507 | Ícone da skin Óculos Escuros |
| `faixa02` a `faixa07` | 1334×~280 | Estilo das faixas de título. Desenho as faixas em código no mesmo estilo, com o texto de cada tela. |
| `metas-lista.png` | 1334×3675 | Referência das expressões da Chorú e do estilo dos cartões |
| `defante-02.png`, `equipe-15.png` | caricaturas | Tela de créditos |
| `brabo-logo.png`, `brabo-avatar.jpg`, `brabo-capa.png` | logo | Abertura e créditos |
