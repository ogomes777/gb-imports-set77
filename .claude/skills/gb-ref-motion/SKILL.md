---
name: gb-ref-motion
description: "Use ao criar ou revisar a vitrine V12 do editorial NÃO É SOBRE TER: carrossel de peças com fantasmas, rastro de movimento, revelação em mosaico e página da peça em três colunas montada em mosaico, trocando só vistas fotografadas. Traduz a referência \"coleção\" de e-commerce para a GB."
---
# Skill GB Ref Motion — gramática das referências (V12)

A gravação de referência fica FORA do repositório (regra do CLAUDE.md). O que importa dela está aqui.

## Referência A — "coleção com fantasmas"
1. **Entrada em mosaico**: a imagem chega coberta por blocos (grade ~4×3) da cor do fundo; os blocos recolhem em cascata (diagonal, 40–90 ms entre blocos, ~600 ms cada). Só `transform: scale`.
2. **Palco**: título grande à esquerda, peça em foco no centro, a anterior e a próxima como **fantasmas** nas laterais (menores, ~20–30% de opacidade).
3. **Troca**: a peça da direita desliza para o centro deixando um **rastro** (2 cópias atrás, opacidade decrescente, deslocadas no sentido do movimento) que some em ~450 ms; a do centro vai para a esquerda e esmaece. Curva `cubic-bezier(.76,0,.24,1)`, 800–900 ms. Avança sozinha (~3,2 s) e por arrasto/setas.
4. **Página da peça**: tocar a peça em foco faz o mosaico cobrir a tela (blocos crescem em cascata), a página entra por trás e os blocos recolhem. Três colunas: texto grande à esquerda, peça no centro (vistas trocando sozinhas por crossfade), ficha à direita.

## Tradução GB (obrigatória)
- Acentos amarelo V1 `#FFD447`, mosaico em tinta `#111214`. Monograma só em SVG.
- **Só fotos reais**: a troca automática percorre apenas vistas fotografadas (`GB_ASSETS[id].combo/top/bottom` distintas). Peça com uma vista só não entra no carrossel. Nunca compor roupa em modelo, nunca espelhar, nunca pintar cor.
- Preço/tamanho sempre "A VALIDAR"; selo "imagem do acervo a validar".
- Só `transform`/`opacity`; timers só com a seção visível ou durante a visualização; `prefers-reduced-motion` = sem mosaico, troca manual.
- Acessibilidade: página da peça é `role=dialog`, foco preso, Esc fecha e devolve o foco ao card.

## Onde está
- `gb-edit-v12.js` / `gb-edit-v12.css` (carrossel do editorial + página da peça).
- Testes em `tests/e2e.mjs` (blocos "editorial:" e "peça:").
