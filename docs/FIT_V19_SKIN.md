# GB Fit Studio / V19 — a skin do GB UNIT, emotes e palco de loja

Versão final do provador. O manequim agora **é o personagem aprovado**. A arte de referência fica em `assets/characters/gb-unit-ref.webp`: armadura preta, placas amarelas e grafismo tribal no lado direito. Os braços, pernas e cabeça não são mais desenhados em vetor: são **peças recortadas da própria arte**, articuladas nas juntas (mesma técnica da V15 com Gui e Vitin). Nada da arte é redesenhado. O "GB" digitado da arte gerada sai (inpaint) e, no lugar dele, entra o monograma oficial em SVG.

## Skin
- `python3 scripts/gerar_skin_v19.py [--qa pasta]` faz o seguinte:
  - remove o fundo claro e limpa a franja da borda;
  - recorta 13 peças: cabeça com o pescoço da arte, braço/antebraço/luva e coxa/canela/bota de cada lado;
  - grava `assets/fit/skin/` e `skin-catalog.js` (`window.GB_SKIN`), com as âncoras de junta medidas com régua na imagem e a largura de cada peça ao longo do eixo.
- **Ossos** (`bone()`): cada peça vai num grupo com a junta na origem e os filhos na ponta.
  - Os emotes giram as juntas (`[data-j]`): ombro, cotovelo, punho, cabeça, quadril e joelho.
  - Escala de largura e de comprimento independentes, até 28%, para o braço caber na manga e a coxa na boca da bermuda. Isso vale só para a skin, que é o personagem; a foto de produto nunca é esticada.
- **Braço de manga curta**: a raiz gira no mesmo pivô da manga. Num emote, manga e braço se movem juntos.
  - Os braços ficam abertos em "A" como na referência (`armTilt` 19°) e o antebraço segue o braço.
  - A abertura medida torta num lado vale a do outro.
- **Manga longa**: a luva sai de dentro do punho, na escala da boca da manga.
- **Pernas**: IK de dois ossos do quadril até o alvo do tornozelo: boca do tênis, barra da calça ou chão da bota.
  - A coxa no nível da barra da bermuda ocupa 92% da boca.
  - A bermuda ficou mais justa: cós de 178 para 166.
- **Calça + tênis**: os tênis acompanham a separação medida das pernas da calça (`--shoeDx`), e a barra cai por cima da boca do tênis.
- **Camisas**: comprimento normalizado numa faixa do quadril. A curta cresce e a longa encolhe, até ±10%.
  - Fora do provador: s-001, porque a foto corta a manga direita e vestir exigiria espelhar a outra.
- **Boné**: a copa assenta no capacete e a aba nunca desce além do topo dos olhos.
- **Capuz**: sombra do capuz em volta do rosto, para o fundo nunca aparecer onde o capuz deitado some.

## Jogo
- **Girar**: arrastar o próprio boneco, com o dedo ou com o mouse, segurando e movendo. O giro acompanha o gesto e, ao soltar, encaixa na pose mais perto: esquerda, frente ou direita.
  - Um gesto só no palco: no A/B o arrasto move o divisor; fora dele, gira o boneco.
  - O swipe que trocava peça sai de cima do boneco; as setas ← → continuam.
  - Correção no `GBMotion.drag`: a captura implícita do toque num filho não encerra mais o arrasto. Esse bug também afetava outros arrastos por toque.
- **Emotes** (`GBFitting.emote(nome,{bpm,beats})`, evento `gb:emote`, prontos para a música):
  - **DANÇAR**: groove no tempo, com corpo, cabeça, braços e mãos;
  - **ACENAR**: o braço sobe com a manga e a mão acena;
  - **360°**: o giro vira para um lado e volta de frente;
  - **PULAR**: agacha, salta com os braços para cima e aterrissa; a sombra no chão encolhe no ar.
  - Com manga longa, dançam o corpo, a cabeça e as mãos (a foto da manga não dobra).
  - Só `transform` via WAAPI. Movimento reduzido desliga os emotes.
- **Setas ‹ ›** nas fileiras de peças, tênis e bonés: andam uma "página" e somem nas pontas.

## Palco de loja
Parede de apresentação com:
- faixas de LED amarelas nas laterais;
- arco iluminado e o monograma GB bem sutil ao fundo;
- halo amarelo atrás do corpo e canhões de luz;
- piso com brilho e plataforma giratória.

Tudo é estático (só gradientes) e acende quando o palco entra em cena. Há versões **SINAL** (vitrine escura) e **ORIGEM** (estúdio de papel com LEDs âmbar). No celular, os emotes viram uma coluna de ícones na lateral, o giro fica sob os pés e o aviso legal no rodapé.
