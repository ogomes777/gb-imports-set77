# V12 — referência "coleção" no editorial

Camada `gb-edit-v12.css` / `gb-edit-v12.js`. A gramática de movimento vem de uma gravação de referência de e-commerce ("the jacket collection"), que **não** entra no repositório. O resumo está em `.claude/skills/gb-ref-motion/SKILL.md`.

## O que acontece no editorial "NÃO É SOBRE TER. É SOBRE SER."

1. **Entrada em mosaico.** A área da peça chega coberta por 12 blocos da cor do fundo, que recolhem em cascata.
2. **Carrossel com fantasmas.** A peça em foco fica no centro, com a anterior e a próxima esmaecidas nas laterais.
   - A troca acontece sozinha a cada 3,2 s, com a seção visível. Também dá para trocar por setas ou arrasto lateral.
   - A peça que entra deixa um rastro de duas cópias.
3. **Página da peça.** Tocar a peça do centro faz 24 blocos cobrirem a tela em cascata; a página da peça entra por trás e os blocos recolhem. A página tem três colunas:
   - **Texto:** "UMA PEÇA. VÁRIOS CAPÍTULOS." e o aviso de imagem a validar.
   - **Peça:** as vistas fotografadas trocam sozinhas a cada 3,6 s, com barra de tempo.
   - **Ficha:** nome, "PREÇO E TAMANHOS: A VALIDAR", escolha de vista, "ABRIR DETALHES DA PEÇA" e anterior/próxima (também em mosaico).
   - **Fechar:** Esc ou ✕ fecha pelo mesmo mosaico e devolve o foco. O foco fica preso na página enquanto ela está aberta.

## Regras

- **Peças do carrossel.** Entram só as que têm 2 ou mais vistas fotografadas distintas em `GB_ASSETS`.
- **Troca automática.** Percorre só essas vistas. Nada de montar roupa em modelo, espelhar ou pintar variante.
- **Animação.** Só `transform` e `opacity`. Os timers existem só com a seção visível ou durante a visualização da peça.
- **Movimento reduzido.** Sem mosaico e sem troca automática.
- **Mídia que falta para o nível total da referência.** A referência troca a roupa no corpo de um modelo e tem uma faixa de fotos de comunidade e um filme editorial. Isso depende de fotos e vídeo reais aprovados pela GB, que entram pelo `campaign-map.js` e pelo importador de fotos.
