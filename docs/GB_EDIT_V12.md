# V12 — referência "coleção" na landing

Camada `gb-edit-v12.css` / `gb-edit-v12.js`. A gramática de movimento vem de uma gravação de referência de e-commerce ("the jacket collection"), que **não** entra no repositório. O resumo está em `.claude/skills/gb-ref-motion/SKILL.md`.

> **Histórico.** A V12 também tinha um carrossel de peças com fantasmas no editorial "NÃO É SOBRE TER" e uma página da peça em três colunas montada em mosaico. Os dois saíram na V15, a pedido: o palco do editorial agora é do encontro de Gui e Vitin (`docs/ENCOUNTER_V15.md`). A gramática deles segue registrada na skill, caso volte em outra seção.

## O que continua: a landing inteira
- **Abertura.** Muro de tinta em blocos com o monograma GB (SVG) e "GB IMPORTS"; os blocos abrem o hero em ~1,5 s. Toque, roda ou tecla pulam.
- **Capítulos.** A arara, a curadoria, o editorial, as categorias, o Look Studio e o SEU PRÓXIMO CAPÍTULO chegam cobertos por um muro de cor, amarelo V1 e tinta alternando, com uma palavra grande: EM MOVIMENTO, CURADORIA, SER., SEU JEITO, SEU LOOK e PRÓXIMO. A palavra sobe e os blocos recolhem em cascata, revelando a seção.
- **Limites.** Acontece uma vez por carregamento e não bloqueia clique. Seção que já está na tela ao carregar não é coberta. O ABAIXO DE ZERO fica fora, porque tem o congelamento próprio.
- **Encadeamento.** Os letreiros da V14 e a cena da V15 esperam o muro abrir.

## Regras
- **Animação.** Só `transform` e `opacity`. Movimento reduzido desliga a abertura e os capítulos.
