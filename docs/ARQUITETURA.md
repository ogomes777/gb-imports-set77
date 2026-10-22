# GB Flagship / Arquitetura e movimento (V06)

## Ordem da página
1. Header (monograma SVG, busca, favoritos, sacola) — claro sobre papel, escuro sobre seções noturnas.
2. **Hero**: 3 capítulos, títulos revelados por linha, peça principal + 2 em profundidade, tag "em cena" que abre o detalhe, avanço automático (7,2 s) com barra de progresso e pausa.
3. **GB Rail**: arara com mola e balanço do cabide, filtro por linha, viewer em tela cheia.
4. Entrada de loja (atalhos com **GB Wipe**).
5. **Catálogo**: busca, filtros, ordenação, salvos, vistos recentemente, detalhe completo.
6. **Night Showroom**: palco duplo, luz que acende e segue o cursor, vista superior/conjunto.
7. Editorial, categorias, Chromatic Lab (simulação de cor, nunca variante comprável).
8. **Look Studio**: combina superior + inferior de conjuntos diferentes (referência visual).
9. Identidade V1 (ORIGEM / TRAMA / SINAL), manifesto, experiência comercial, campanha, conectar, rodapé.

## Estado e URL
| Estado | Onde vive |
| --- | --- |
| Filtro, busca, ordenação | `?cat=` `?q=` `?ordem=` (replaceState) |
| Peça aberta | `?peca=gb-tr-01` (pushState: o voltar do celular fecha o detalhe) |
| Favoritos, seleção de interesse, looks, vistos | `localStorage` (`gb-v03-*`, `gb-v06-*`), opcional |

## Tradução das referências (padrões, não cópia)
| Padrão observado nas gravações | Execução GB |
| --- | --- |
| Grade limpa → peça grande | card com 2ª vista no hover + detalhe com transição de elemento compartilhado |
| Trio de peças com centro de gravidade | hero com peça principal e duas em profundidade, troca coreografada |
| Arara com peças penduradas | GB Rail com física de cabide (mola + balanço), arrasto 1:1 |
| Loja escura com prévia contextual | Night Showroom com luz localizada e palco duplo |
| Mesma peça, outra cor | Chromatic Lab (simulação declarada) |
| Swipe / tap no mobile | swipe em arara, viewer, galeria e Look Studio; botões equivalentes sempre |
| Transição de cor chapada entre telas | GB Wipe amarelo com o monograma (nunca o vermelho da referência) |

## Orçamento de movimento
- Somente `transform`, `opacity` e as propriedades individuais `translate`/`scale`.
- rAF só durante gesto/acomodação (arara) ou movimento do ponteiro (hero, showroom); nenhum loop ocioso.
- Loops CSS pausados fora da tela (`.is-offscreen`); capítulos do hero pausam em hover, foco, aba oculta, fora da tela e com diálogo aberto.
- `prefers-reduced-motion`: sem intro, sem autoplay, sem wipe, sem parallax; tudo navegável.

## Build
`scripts/build.mjs` valida sintaxe, concatena 5 CSS + 6 JS em `dist/_gb/gb.<hash>.{css,js}` (cache imutável) e gera `dist/gb-standalone.html`. A Vercel roda o build e publica `dist/`.

## Próxima fase (transacional)
Trocar `PRODUCTS` por API/PIM com `product`, `variant {sku, cor, tamanho_superior, tamanho_inferior, estoque, preço}`, `collection`, `look_reference`. Checkout, estoque, preço e políticas validados no servidor. Migrar para framework só quando houver ganho operacional.
