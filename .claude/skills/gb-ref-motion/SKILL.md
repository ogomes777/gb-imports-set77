---
name: gb-ref-motion
description: "Use ao criar ou revisar a abertura e os capítulos (muros de cor com palavra grande) da landing GB — gramática da referência \"coleção\" de e-commerce. Guarda também a gramática do carrossel com fantasmas e da página da peça em mosaico, que saíram do editorial na V15."
---
# Skill GB Ref Motion — gramática das referências (V12)

A gravação de referência fica FORA do repositório (regra do CLAUDE.md). O que importa dela está aqui.

## Em uso: a landing inteira
- **Abertura.** Muro de tinta em blocos com o monograma GB (SVG) e "GB IMPORTS" subindo letra a letra; os blocos abrem o hero (~1,5 s; toque, roda ou tecla pulam).
- **Capítulos.** Cada seção chega coberta por um muro de cor com uma palavra grande: arara, curadoria, editorial, categorias, Look Studio e SEU PRÓXIMO CAPÍTULO.
  - O muro alterna amarelo V1 e tinta.
  - A palavra sobe, segura ~0,7 s, e os blocos recolhem em cascata.
  - Acontece uma vez por carregamento, sem bloquear clique. Seção já na tela ao carregar não é coberta.
- **ABAIXO DE ZERO.** Fica fora, porque tem o congelamento próprio.
- **Encadeamento.** Letreiros (V14) e a cena de Gui e Vitin (V15) esperam o muro abrir.

## Arquivado (saiu do editorial na V15, a pedido)
- **Carrossel com fantasmas.**
  - Peça em foco no centro; a anterior e a próxima esmaecidas nas laterais (~25%).
  - Troca com rastro de 2 cópias, curva `cubic-bezier(.76,0,.24,1)`, 800–900 ms.
  - Avança sozinho (~3,2 s), por arrasto ou por setas. Entrada em mosaico 4×3.
- **Página da peça.** O mosaico cobre a tela e a página entra em três colunas: texto, peça trocando só vistas FOTOGRAFADAS, e ficha com "A VALIDAR".
  - Fica em `role=dialog`, com foco preso; Esc fecha.
- **Onde recuperar.** No histórico do git (antes da V15). Se voltar, entra em outra seção, sem disputar o palco de Gui e Vitin.

## Tradução GB (obrigatória)
- **Cores.** Acentos amarelo V1 `#FFD447`, mosaico em tinta `#111214`. Monograma só em SVG.
- **Fotos.** Só fotos reais: nunca compor roupa em modelo, nunca espelhar, nunca pintar cor.
- **Movimento.** Só `transform`/`opacity`. Movimento reduzido: sem muros.

## Onde está
- `gb-edit-v12.js` / `gb-edit-v12.css`: abertura e capítulos.
