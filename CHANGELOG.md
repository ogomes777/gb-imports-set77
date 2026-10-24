# GB Flagship / Changelog

## Correção do catálogo — 23/10/2026
- Vitrine: ocultar somente as 12 bermudas avulsas cujo objeto aparece minúsculo no arquivo (s-120 a s-131); preservar as 10 bermudas com enquadramento normal (s-079 a s-088), os kits, os arquivos de origem e a contagem sincronizada de 102 produtos.

## V10 — 23/10/2026 · "GB RAIL"
- Arara reconstruída como estrutura física: barra fina entre dois suportes, gancho apoiado na barra, gola no pescoço do cabide, bermudas e fotos de kit presas por presilhas, conjunto com superior e inferior em dois cabides, sombra na parede pré-calculada.
- Catálogo verdadeiro: os 114 registros auditados olhando cada imagem; 63 cabides (71 registros), 5 grupos de cores fotografadas, 7 duplicatas ocultas, 31 itens fora por categoria, 9 conjuntos reclassificados. Os 14 estudos SVG saem da arara.
- Movimento: arrasto 1:1, inércia e mola interrompível; vizinhos em 3/4 que viram de frente no foco e abrem espaço; balanço do cabide com atraso do tecido; tudo no GBMotion.
- Fichas de cor suspensas no alto à direita, com cordão, queda com mola e balanço, amostra fotografada da própria peça; só para variantes reais.
- Object View unificado: mesma cor da arara, conjunto/superior/inferior só com foto, FRENTE ativa e LATERAL/COSTAS desligadas com motivo (nenhum verso simulado); estudo de cor V08 só para ilustrações.
- QA: 613 verificações (fonte e build) em 6 cenários; desempenho medido com CPU 4×; standalone sem duplicar imagens.

## V09 — 23/10/2026 · "GB FIT STUDIO"
- Look Studio vira provador editorial: um manequim GB de corpo inteiro e persistente veste superior e inferior; nada flutua.
- Roupas geradas pelas âncoras anatômicas do rig: jaqueta, camisa, calça e short, com oclusão e sombra de contato.
- Troca do superior anima só tronco e mangas; a do inferior, só quadril e pernas. MISTURAR troca as duas com defasagem; trocas rápidas convergem para a última.
- A/B com segundo manequim na mesma escala e divisor arrastável/teclado; evento público `gb:look-change`; looks salvos com `presentationVersion`.
- Palco sticky no desktop (corpo inteiro cabe na tela ao lado dos seletores); mobile com setas fora do corpo.
- Aviso fixo de simulação editorial; movimento reduzido troca sem animar. Detalhes em `docs/FIT_STUDIO_V09.md`.

## V07 — 22/10/2026 · "GB / IN MOTION"
- `motion-core.js` (GBMotion): tokens, preferências, relógio rAF único, molas interrompíveis, gesto, FLIP, MediaSlot.
- Hero vira palco de câmera: trio em profundidade dirigido por uma fase contínua; seleção, arrasto, teclado; título por lâmina amarela.
- GB Rail com barra em catenária, ganchos ancorados na curva, inércia com fricção e composição mobile própria.
- Catálogo ↔ ficha com continuidade nos dois sentidos (View Transitions + FLIP de reserva).
- Night Showroom em perspectiva com luz amortecida e prévia por intenção; Chromatic Lab por camadas sobre o mesmo molde.
- Look Studio com áreas de encaixe, arraste da lista ao palco e comparação A/B.
- GB Wipe de capítulo (lâminas preta + amarela, destino letra a letra); slots de campanha para mídia autorizada.
- Fontes sem bloquear renderização, acessibilidade Lighthouse 100, bug de clique no hero corrigido.

## V06 — 22/10/2026
- Fonte separada em camadas modulares (a V05 publicada era um único HTML de 444 KB).
- Arte de estudo das peças redesenhada (zíper, golas, punhos, cós, sombreamento), sem marcas de terceiros.
- Catálogo com busca inline, filtros (inclui salvos), ordenação, URL compartilhável, vistos recentemente.
- Detalhe com `?peca=`, navegação entre peças, galeria com swipe, salvar, copiar link, consultar na GB, mesma linha e transição de elemento compartilhado.
- Sacola copia mensagem de interesse para o Direct da GB (sem pedido, sem preço inventado).
- GB Rail com física de cabide, arrasto contínuo, trackpad, filtros e viewer navegável.
- Night Showroom com palco duplo, luz e vista; Look Studio com swipe, Misturar e looks salvos.
- Hero com intro, títulos por linha, capítulos automáticos pausáveis, parallax e "em cena".
- GB Wipe, header claro/escuro, pausa de loops fora da tela, skip link, foco visível.
- Build com hash + standalone offline; importador de fotos com manifesto; QA E2E 189/189.

## V05 — 22/10/2026
Identidade V1 (monograma vetorial, ORIGEM/TRAMA/SINAL), hero "Seu estilo. Seu corre.", inventário de 18 registros.

## V04 / V03 / V02
GB Rail, Night Showroom, Chromatic Lab, Look Studio, filme em 3 cenas, catálogo de 14 posições, favoritos e seleção de interesse.
