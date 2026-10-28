# GB Fit Studio / V18 — o provador vira jogo

Evolução da V17 (GB UNIT). A skin é a mesma: armadura preta, placas amarelo GB e o monograma oficial. O que muda: o robô é mais forte, gira, veste capuz, recebe a peça arremessada, e o palco segue o tema da landing.

## Corpo mais forte (sem cara de esqueleto)
- Braços:
  - bíceps e antebraço mais grossos, e o braço enche a boca da manga (até 28 no viewBox);
  - cotovelo maior; mãos 14% maiores.
- Pernas:
  - coxa, panturrilha e tornozelo mais largos (`LEG`), e a coxa enche ~96% da boca da bermuda;
  - joelheira maior; pescoço mais largo.
- Barra da camisa: duas sombras de contato sobre a peça de baixo, para a camisa cair por cima, e não flutuar.

## Girar (esquerda · frente · direita)
Pseudo-3D só com `transform` (variáveis `--yaw`/`--yawa` no `.fit-figure`, mola do `GBMotion` só durante o gesto).
- O corpo estreita (`.fit-yaw`), o rosto e o boné viram, as orelhas recolhem e o braço do lado de trás recua para trás do tronco.
- **Tênis**: cada pé gira no tornozelo (`.fit-foot-flip`, transição em `scaleX`, que passa por 0 como um pé virando):
  - para a esquerda/direita, os dois pés apontam para o lado do giro, e o pé mais perto de quem olha vai por cima;
  - **de frente, ficam em V**, cada pé para fora e encurtado, como num 3/4.
  - O pé que aponta para o lado oposto ao da foto é o mesmo recorte espelhado: o par é simétrico, é como o outro pé se vê. Letreiros pequenos nesse pé podem aparecer invertidos.
  - O acervo não tem foto da ponta do tênis vista de frente, então não existe vista "de bico" fabricada.
- **Controles**:
  - barra GIRAR no palco: ◀ ● ▶, com 44 px;
  - arrastar o robô com o mouse;
  - arrastar a plataforma no toque, sem conflito com o swipe que troca a peça;
  - setas do teclado no controle (`role=slider`);
  - `GBFitting.turn(-1|0|1)` e `GBFitting.yaw`.

## Capuz na cabeça
- Só para moletom com o capuz fotografado de frente e aberto: `hood` na curadoria (abertura marcada olhando a foto). O s-098 fica fora (capuz de costas).
- O próprio capuz da foto sobe por inteiro (escala única) até a abertura emoldurar o capacete:
  - atrás da cabeça vai o capuz inteiro, com o forro aparecendo em volta;
  - na frente, o mesmo capuz com a abertura vazada (borda suave), e a cabeça fica dentro;
  - a parte de cima do capuz deitado na foto some por máscara (`.fit-hood-hide`).
- No configurador, a opção **CAPUZ** fica no passo 04 BONÉ, desabilitada quando a peça não tem capuz.
- Capuz e boné se excluem. `set({hood:true})` e `state.hood`; salvar, restaurar e o A/B guardam o capuz.

## Jogar a peça no boneco
- Ao escolher (clique, setas, misturar, kit, restaurar), o ícone da peça sai do seletor: miniatura pequena, translúcida e com brilho. Ele voa tremendo em arco até a área do corpo (340 ms), num pool de elementos reaproveitados.
- Ao chegar, a peça antiga dissolve e uma **hélice de DNA** amarela varre a área enquanto as fitas giram. A peça nova assenta.
- Movimento reduzido: sem voo e sem hélice; a troca é instantânea.

## Palco
- Plataforma giratória sob os pés, com uma marca amarela que acompanha o giro.
- O palco segue o tema da landing:
  - **ORIGEM** (claro): estúdio de papel com luz branca;
  - **SINAL** (escuro): estúdio de tinta.
  - Textos, botões e controles trocam junto, e no escuro os títulos do configurador ficam legíveis.
- **Mobile**:
  - robô a 79% do palco;
  - barra de giro logo abaixo dos pés e aviso legal no rodapé;
  - os cards de categoria deixam a peça acima do título (texto preto não passa por cima de peça preta) e o título cabe na largura.
