# Design do jogo — Chorumaçã O Jogo!

**Gênero:** bichinho virtual no estilo Tamagotchi e Pou.
**Plataforma:** navegador. Feito primeiro pro celular em pé, mas também funciona no computador e no celular deitado.
**Identidade:** `docs/identidade-e-inventario.md`.
**Em uma frase:** você cuida da Chorú, uma maçã (que é um pêssego, mas não fala isso pra ela), alimentando, dando banho, pondo pra dormir, jogando e levando pra passear, e ela vive em tempo real mesmo com o jogo fechado.

---

## 1. O ciclo do jogo

1. Você abre o jogo e a Chorú reage ao tempo que passou: está com fome, suja, com sono ou feliz.
2. Os status mostram do que ela precisa. Cada cômodo resolve uma necessidade.
3. Os minijogos e o passeio dão moedas. As moedas compram comida, remédio e roupas.
4. Cuidar dá experiência. A cada nível ela cresce um pouco, e novos itens aparecem na loja.

## 2. Status

São cinco barras de 0 a 100, mostradas no topo como ícones com anel de progresso. O anel muda de cor quando o status fica baixo.

| Status | Cai por hora | Como sobe |
|---|---|---|
| Fome | 6, então vai de cheia a vazia em cerca de 16 h | Comer |
| Higiene | 4. O passeio tira 15, e uma caquinha no chão tira 10. | Banho |
| Energia | 5 com ela acordada | Dormir dá 20 por hora, então ela enche em 5 h |
| Diversão | 7 | Minijogos, passeio, carinho |
| Saúde | Só cai quando outro status está zerado (5 por hora pra cada um) ou quando há caquinha no chão por mais de 1 h | Remédio dá 40. Ela também se recupera devagar quando tudo está acima de 50. |

**Vontade de ir ao banheiro.** Esse medidor fica escondido. Ele sobe 12 a cada comida. Quando enche, ela avisa "Tô apertada!" e você tem 60 segundos pra levá-la ao banheiro e tocar no vaso. Se não der tempo, aparece uma caquinha no chão do cômodo onde ela está, como manda a campanha. Pra limpar, é só tocar na caquinha.

**Tempo real.** O jogo guarda a hora em que foi fechado e, ao abrir, aplica o tempo que passou, até um limite de 48 h. Se você apagou a luz do quarto antes de sair, ela dormiu esse tempo todo. Ela nunca morre: no pior caso fica doente e triste até você cuidar dela.

## 3. Humor e expressões

O rosto muda conforme os status e o que está acontecendo. Ela é desenhada em código, no traço da campanha, e por isso pode ter todas essas caras:

| Expressão | Quando aparece |
|---|---|
| Deboche, a cara padrão | Status ok |
| Gargalhada | Carinho, recorde, comida favorita |
| Boca aberta esperando | Comida chegando perto da boca |
| Mastigando | Três mordidas por comida, com farelos |
| Susto, a boca em "O" | Pêssego, caule, tombo no passeio |
| Com sono | Energia abaixo de 20: olhos caídos e bocejo |
| Dormindo | Luz apagada: olhos fechados e "Zzz" |
| Triste | Algum status abaixo de 25 |
| Doente | Saúde abaixo de 30: tom esverdeado e termômetro |
| Suja | Manchas no corpo conforme a higiene cai, e mosquinhas abaixo de 20 |
| Apertada | Tremendo, com gota de suor |
| Brava | Quando é chamada de pêssego |

Ela pisca, respira e balança o tempo todo. Ao tocar nela, ela fala uma frase oficial em balão, com uma "voz" de bipes sintetizados. Ao esfregar o dedo, recebe carinho e cora. Ao segurar o dedo, faz cócegas e dá gargalhada.

**Crescimento:** do nível 1 ao 4 ela é a Choruzinha, menor. Do 5 ao 14 é a Chorú. Do 15 em diante é a Chorumaçã, no tamanho cheio. O tamanho aumenta um pouco a cada nível.

## 4. Cômodos

Você troca de cômodo pelas setas laterais ou deslizando o dedo, como no Pou. O nome do cômodo aparece numa faixa listrada no estilo da campanha. Os cenários são desenhados em código, no mesmo traço: contorno grosso e sombra chapada.

### 4.1 Cozinha
- **Cenário:** fiel ao `choru-na-mesa.png`, com azulejo xadrez verde-água, geladeira com pinguim, fogão e mesa redonda com toalha listrada.
- **Geladeira:** abre uma gaveta embaixo com as comidas que você tem. Você arrasta a comida até a boca: ela abre a boca quando a comida chega perto e come em três mordidas.
- **Loja de comida:** comidas brasileiras. Coxinha, pão de queijo, brigadeiro, pastel, açaí, pipoca, pão francês, banana, melancia, morango, picolé, guaraná, pizza e suco de abacaxi na caneca de abacaxi das recompensas. Também tem ovo, leite, farinha e queijo, que servem como ingredientes.
- **Livro de receitas:** o livro roxo das recompensas. No fogão você junta dois ingredientes. Se a combinação for uma receita, sai um prato que enche mais e dá mais diversão, e a receita é registrada no livro. São 8 receitas, como misto-quente, vitamina, bolo e omelete. As que você não descobriu aparecem como "???".
- **Piadas:** se você der um pêssego, ela fica brava: "Isso é um pêssego. Eu sou uma maçã." Se der uma comida com caule, ela recusa: "Não são permitidos caules!"

### 4.2 Banheiro
- **Sabonete:** você arrasta o sabonete sobre ela e aparece espuma onde você esfrega.
- **Chuveiro:** você segura e cai água. A água tira a espuma e as manchas, e a higiene sobe enquanto você enxágua.
- **Vaso:** tocar no vaso quando ela está apertada faz ela usar o banheiro e dar a descarga.
- **Armário de remédios:** o remédio custa moedas e cura a saúde.

### 4.3 Quarto
- **Interruptor:** apagar a luz põe ela pra dormir, e a energia sobe. Ela continua dormindo com o jogo fechado.
- **Janela:** mostra dia ou noite conforme o relógio real.
- **Guarda-roupa:** loja e provador de visuais, organizados em três grupos.
  - **Cabeça:** Boné Roxo e Fone Gamer, que são os ícones das recompensas, além de Coroa, Chapéu de Chef, Laço e Touca de Banho.
  - **Olhos:** Óculos Escuros, também das recompensas, Óculos VR e Monóculo.
  - **Cor da fruta:** Clássica, Maçã Verde, Maçã do Amor (caramelada, com palito) e Dourada.
  - **Easter egg:** a cor "Pêssego" aparece na loja, mas ela se recusa a vestir.

### 4.4 Sala de Jogos
O fliperama e os óculos VR abrem os minijogos. Cada um dá moedas conforme os pontos e guarda o seu recorde.

| Minijogo | Como joga | Duração |
|---|---|---|
| **Chuva de Comida** | Você arrasta a Chorú de um lado pro outro pra pegar comida, desviando de caules e pêssegos. | 60 s |
| **Pulo da Maçã** | Ela pula sozinha de plataforma em plataforma, subindo, e você guia pros lados. | Até cair |
| **Biruleibe VR** | Jogo de memória musical com quatro botões coloridos que tocam notas. Você repete a sequência, que cresce a cada rodada. | Até errar |

### 4.5 Passeio
- **Como joga:** ela corre sozinha pela rua num cenário que rola. Você toca pra pular e segura pra pular mais alto.
- **Cenário:** um bairro brasileiro, com calçada de ondas de pedra portuguesa, padaria, banca de jornal, orelhão e palmeiras. O fundo se move em camadas, em velocidades diferentes.
- **Obstáculos:** caules no chão, poças (que sujam e tiram higiene) e o Liquidificador, o vilão das frutas, que rola em direção a ela. "Frutofóbicos não passarão!"
- **Prêmios:** moedas pingando pelo caminho e flores que dão diversão.
- **Fim:** depois de três batidas o passeio acaba. Ela volta com diversão alta, energia mais baixa e, se pisou nas poças, suja.

## 5. Moedas e nível

- **Moedas:** você começa com 100. Os minijogos dão 1 moeda a cada 10 pontos, e o passeio dá as moedas que você pegou. Uma vez por dia tem um bônus "Ih mané, pingou hein!" de 20 a 50 moedas.
- **Preços:** comida custa de 3 a 30, remédio 25 e roupas de 60 a 500.
- **Nível:** cada cuidado dá experiência. Comer dá 2, banho completo 8, dormir 1 por hora, minijogo 5 a 20 e passeio 10 a 20. O nível N pede 50 × N de experiência. Subir de nível dá moedas e libera itens na loja, e ela comemora com a dancinha do `choru-rebolado.gif`.

## 6. Som

Tudo é sintetizado em código, sem arquivos de áudio.
- **Música:** uma trilha curta pra cada cômodo, no clima chiptune, e outra pra cada minijogo.
- **Efeitos:** mordida, bolhas, chuveiro, descarga, moeda, pulo, tombo e level up.
- **Voz:** bipes em tom de fala, com ritmo diferente pra cada frase.
- **Controles:** som e música ligam e desligam separados, e a escolha fica salva. O áudio só começa depois do primeiro toque, por regra dos navegadores.

## 7. Telas

1. **Abertura:** logo da Brabo Studio, depois a capa com a espiral rosa e o título. Um toque leva pra casa.
2. **Casa:** é o jogo em si. Status no topo, cômodo no meio, ações do cômodo embaixo, setas nas laterais.
3. **Painéis por cima:** loja, geladeira, guarda-roupa, livro de receitas e configurações.
4. **Minijogos e passeio:** tela cheia, com placar e botão de sair.
5. **Créditos:** Diogo Defante, a equipe da Brabo Studio (caricaturas da campanha) e a medalha da Chorú com o Defante.

## 8. Técnica

- **Código:** HTML, CSS e JavaScript puros, sem framework e sem etapa de build. Abre com dois cliques no `index.html` ou em qualquer servidor.
- **Desenho:** o cenário e a Chorú vão num canvas que se ajusta à densidade da tela, então ficam nítidos em celular. A interface (barras, botões e painéis) é HTML por cima.
- **Toque e mouse:** um só sistema de eventos pros dois. Arrastar comida, esfregar sabonete e deslizar entre cômodos funcionam igual no dedo e no mouse. A página não rola nem dá zoom sem querer durante o jogo.
- **Salvamento:** fica no navegador, de forma automática, a cada ação e ao sair. Se o jogo for aberto pelo claude.ai com sua conta, o progresso também fica na conta, e dá pra continuar em outro aparelho.
- **Imagens:** cópias leves das artes da campanha, em WebP, ficam em `assets/jogo/`. Os originais continuam em `assets/catarse/`.
- **Responsivo:**
  - **Celular em pé:** é o layout principal.
  - **Celular deitado e computador:** o cômodo se alarga pros lados e a interface fica centralizada.
  - **Alvos de toque:** têm pelo menos 44 px.
  - **Textos de status:** têm no mínimo 14 px.

### Estrutura de pastas

```
F:\Chorumaca\
  index.html
  css\estilo.css
  js\
    nucleo.js       laço do jogo, telas, entrada de toque e mouse
    estado.js       status, tempo real, salvamento
    choru.js        desenho e animação da Chorú
    cenarios.js     desenho dos cômodos
    comodos\        cozinha.js, banheiro.js, quarto.js, sala.js
    jogos\          chuva.js, pulo.js, biruleibe.js, passeio.js
    loja.js         itens, preços, receitas
    som.js          música e efeitos sintetizados
    interface.js    barras, painéis, balões de fala
  assets\catarse\   originais
  assets\jogo\      versões leves usadas pelo jogo
  fontes\           Lilita One e Gochi Hand
  docs\
```

## 9. Etapas

Ao fim de cada etapa eu testo no tamanho de celular (375×812) e no computador. Dou nota de 1 a 10 pra leitura no celular, qualidade do movimento, fidelidade à marca e diversão, e corrijo os três piores pontos antes de seguir.

| # | Etapa | Entrega |
|---|---|---|
| 1 | Base | Layout responsivo, Chorú desenhada com expressões e piscadas, troca de cômodos, status, tempo real e salvamento |
| 2 | Cozinha | Geladeira, comer arrastando, loja de comida, fogão e livro de receitas |
| 3 | Banheiro | Espuma, chuveiro, vaso, caquinhas e remédio |
| 4 | Quarto | Dormir, janela com relógio real, guarda-roupa e skins |
| 5 | Sala de Jogos | Chuva de Comida, Pulo da Maçã e Biruleibe VR |
| 6 | Passeio | Corredor com cenário de bairro e obstáculos |
| 7 | Acabamento | Trilha e efeitos, abertura, créditos, ajustes finais e publicação de um link privado pra testar no celular |

## 10. Decisões pra você aprovar

1. **Chorú desenhada em código, no traço da campanha (recomendado).** É o que permite todas as expressões, as roupas por cima, a espuma e as manchas. As artes originais entram na abertura, na loja (as medalhas viram ícones) e nos créditos. A outra opção seria animar só os PNGs, o que limita ela às caras que já existem.
2. **Falas:** uso só as frases oficiais da campanha, mais avisos curtos e neutros como "Tô com fome" e "Tô apertada!". Não invento piadas no nome do Defante.
3. **Link privado:** ao final, publico um link privado no claude.ai pra você abrir no celular. Ele fica visível só pra você até você decidir compartilhar.
