# GB EDIT — V12

Camada `gb-edit-v12.css` / `gb-edit-v12.js`. A gramática de movimento vem de duas gravações de referência de e-commerce, que **não** entram no repositório. O resumo dela está em `.claude/skills/gb-ref-motion/SKILL.md`.

## O que acontece, a partir do editorial "NÃO É SOBRE TER. É SOBRE SER."

1. **Entrada em mosaico.** Ao chegar na seção, a área da peça aparece coberta por 12 blocos da cor do fundo, que recolhem em cascata.
2. **Carrossel com fantasmas.** A peça em foco fica no centro, com a anterior e a próxima esmaecidas nas laterais.
   - A troca acontece sozinha a cada 3,2 s, com a seção visível. Também dá para trocar por setas ou arrasto lateral.
   - A peça que entra deixa um rastro de duas cópias, que somem em ~0,75 s.
   - Clicar na peça do centro abre o detalhe.
3. **GB EDIT.** Logo abaixo do editorial ficam a marca gigante, a régua fina e uma grade de até 8 peças. No hover, a foto aproxima devagar.
4. **Cortina.** Ao clicar numa peça, uma cortina amarela V1 sobe de baixo, "GB IMPORTS" embaralha e assenta no centro, e a cortina sai por cima.
5. **Página da peça.** A foto grande fica à esquerda e chega em mosaico. As vistas trocam sozinhas com empurrão vertical a cada 3,6 s.
   - À direita fica a ficha: "PREÇO E TAMANHOS: A VALIDAR", a escolha de vista, "ABRIR DETALHES DA PEÇA" e os botões anterior/próxima.
   - Esc fecha e devolve o foco ao card. O foco fica preso dentro da página enquanto ela está aberta.

## Regras

- **Peças da grade e do carrossel.** Entram só as que têm 2 ou mais vistas fotografadas distintas em `GB_ASSETS` (conjunto, superior ou inferior).
- **Troca automática.** Percorre só essas vistas. Nada de montar roupa em modelo, espelhar ou pintar variante.
- **Animação.** Só `transform` e `opacity`. Os timers existem só com a seção visível ou durante a visualização da peça.
- **Movimento reduzido.** Sem cortina, sem mosaico e sem troca automática.
- **Mídia que falta para chegar ao nível total da referência.** Fotos de modelo vestindo cada peça (a referência troca a roupa no corpo) e conteúdo real de comunidade e campanha (faixa UGC e filme editorial). Quando a GB enviar e aprovar, esse material entra pelo `campaign-map.js` e pelo importador de fotos.
