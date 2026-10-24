---
name: gb-ref-motion
description: "Use ao criar ou revisar a vitrine GB EDIT (V12): carrossel de peças com fantasmas no editorial NÃO É SOBRE TER, revelação em mosaico, grade com cortina amarela e página da peça trocando vistas fotografadas. Traduz a gramática de movimento das referências de e-commerce para a GB."
---
# Skill GB Ref Motion — gramática das referências (V12)

As duas gravações de referência ficam FORA do repositório (regra do CLAUDE.md). O que importa delas está aqui.

## Referência A — "coleção com fantasmas"
1. **Entrada em mosaico**: a imagem chega coberta por blocos (grade ~4×3) da cor do fundo; os blocos recolhem em cascata (diagonal, 40–90 ms entre blocos, ~600 ms cada). Só `transform: scale`.
2. **Palco**: título grande à esquerda, peça em foco no centro, a anterior e a próxima como **fantasmas** nas laterais (menores, ~20–30% de opacidade).
3. **Troca**: a peça da direita desliza para o centro deixando um **rastro** (2 cópias atrás, opacidade decrescente, deslocadas no sentido do movimento) que some em ~450 ms; a do centro vai para a esquerda e esmaece. Curva `cubic-bezier(.76,0,.24,1)`, 800–900 ms. Avança sozinha (~3,2 s) e por arrasto/setas.
4. **Página da peça**: texto à esquerda, peça no centro, ficha à direita, montada pelo mesmo mosaico.

## Referência B — "grade + cortina"
1. **Marca gigante** com régua fina; grade de peças abaixo; no hover a foto aproxima devagar (~1,4 s, escala ~1.08).
2. **Clique**: cortina da cor da marca sobe de baixo (560 ms), o nome da marca **embaralha** e assenta no centro (~400 ms), a cortina sai por cima (620 ms) revelando a página.
3. **Página dividida**: foto grande à esquerda trocando sozinha com **empurrão vertical** (a nova sobe de baixo, a antiga sobe 20% e some; ~900 ms a cada ~3,6 s), ficha à direita entrando em sequência.

## Tradução GB (obrigatória)
- Cor da cortina e acentos: amarelo V1 `#FFD447` com tinta `#111214`; nome embaralhado = "GB IMPORTS". Monograma só em SVG.
- **Só fotos reais**: a troca automática percorre apenas vistas fotografadas (`GB_ASSETS[id].combo/top/bottom` distintas). Peça com uma vista não entra na grade do GB EDIT. Nunca compor roupa em modelo, nunca espelhar, nunca pintar cor.
- Preço/tamanho sempre "A VALIDAR"; selo "imagem do acervo a validar".
- Só `transform`/`opacity`; timers só com a seção visível ou durante a visualização; `prefers-reduced-motion` = sem cortina, sem mosaico, troca manual.
- Acessibilidade: página da peça é `role=dialog`, foco preso, Esc fecha e devolve o foco ao card.

## Onde está
- `gb-edit-v12.js` / `gb-edit-v12.css` (carrossel do editorial + GB EDIT + página da peça).
- Testes em `tests/e2e.mjs` (blocos "GB EDIT" e "editorial: carrossel").
