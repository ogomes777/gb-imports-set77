# GB Flagship / Changelog

## V45 — 30/10/2026 · "PUFF"
- Abertura nova: palco preto-vidro e o puff de pelúcia da GB — almofada branca/marfim com o monograma oficial amarelo/preto formado pelos próprios fios. Sai a fita de vidro (V25–V38).
- O renderizador é o PlushTile ORIGINAL do usuário (`src/plush/PlushTile.tsx`, guardado intacto num commit próprio; as adaptações GB vêm como diff): GB local no lugar do CDN/blob, GPU por software fica no poster, teto de fios por aparelho, evento de primeiro quadro só com pelo iluminado lido de volta.
- Primeiro objeto visível é sempre pelo real: poster RGBA decodificado antes de aparecer e, numa GPU física, cross-fade para o live no mesmo enquadramento (calibrado contra o render). Nunca ícone chapado, almofada lisa, quadrado preto, spinner ou flash branco.
- Cursor e dedo abrem os fios (pincel do original) e o tile inclina; tocar no puff nunca pula. PULAR, teclas e roda saem.
- Saída: a câmera mergulha no puff (escala, desfoque, dissolve) e a landing já pronta assume.
- Loja sempre abre: boot em paralelo aos 0,65 s, watchdog 5,2 s, garantia só de CSS aos 9 s, `finish` idempotente e teardown de React/GPU. Movimento reduzido, links diretos e rotas pulam a intro e não baixam o chunk.
- Build: o chunk do PlushTile (React 19 + esbuild, versões fixas no lockfile) é obrigatório — sem ele o build falha; Vercel e workflows rodam `npm ci`.
- QA: `tests/puff-intro-v45.mjs` (matriz de aceite) e as suítes V25–V38 reescritas para o contrato V45. Detalhes em `docs/PUFF_V45.md`.

## V11 — 30/10/2026 · "GB RAIL IMMERSIVE"
- V11.4 — loja dentro de um shopping: do outro lado da vitrine, o corredor do mall com pilares redondos, vitrines acesas de outras lojas (térreo e mezanino com guarda-corpo de vidro) e claraboia; à noite, as vitrines ficam quentes. Tudo fora de foco e sem marca.
- V11.4 — piso de porcelanato polido: placas grandes com rejunte fino e leve variação de tom, reflexo do vidro antes do trilho, risco especular de cada spot e a peça em foco espelhada com mais brilho.
- V11.4 — roçar a peça: passar o cursor (ou o dedo antes de arrastar) por cima da roupa empurra o tecido — mais nas pontas e embaixo, a peça gira um pouco no gancho e as vizinhas sentem o ar; os limites suaves mantêm a roupa inteira.
- V11.4 — mais rápido e mais vento: a câmera sai da porta antes (0,52 s) e o travelling dura 1,6 s (1,4 s no toque); rajadas um pouco mais fortes e mais frequentes, e a próxima só sopra com os cabides parados.
- V11.3 — roupas vivas: vizinhas em 3/4 e a peça em foco de frente; ao arrastar, cada peça gira no gancho contra o movimento e volta ao parar; a barra do tecido flexiona sem abrir costura; brisa mais presente com a arara em tela.
- V11.3 — a loja acorda: spots do teto, cones de luz e poças no piso acendem fileira por fileira enquanto a câmera entra; sombras longas dos montantes no piso; faixa jateada no vidro; árvores num plano mais próximo da rua (parallax pelo vidro).
- V11.3 — câmera em primeira pessoa: segurar o dedo ou o mouse inclina a câmera para a arara e o olhar segue o toque; soltar devolve.
- V11.2 — vitrine de vidro: fundo e laterais em caixilhos de alumínio com vidro; lá fora, a rua em luz de dia (à noite no tema escuro); o piso atravessa o vidro e continua do lado de fora. A peça em foco aparece espelhada no piso polido.
- V11.2 — troca de cor em onda: ao escolher outra cor na ficha, a foto nova sobe da barra até a gola numa frente ondulada com uma faixa de luz na própria peça.
- V11.2 — arrasto mais calmo: inclinação limitada a ~4,5° com limite suave, kits em dois cabides giram quase rígidos e a barra do tecido trava enquanto a arara está sendo arrastada (as peças não parecem mais cortadas ao meio).
- A arara V10 entra numa loja: parede, piso de cimento com juntas em perspectiva, teto com trilhos de luz, paredes laterais e o batente da porta, todos em CSS 3D projetados pela mesma câmera. Em repouso, o plano da arara é idêntico ao da V10.
- Filme depois do capítulo EM MOVIMENTO: porta no plano aberto → dolly com crane e arco (1,9 s; 1,65 s no toque) → a luz revela as peças → primeira rajada. Interrompível por qualquer gesto. Não repete.
- A arara surge: com a câmera ainda na porta, os cabides são pousados na barra um a um, da peça em foco para fora, e balançam no contato. Cada peça tem sombra de contato no piso. Loja branca com piso polido; a câmera anda em primeira pessoa (três passos curtos) e assenta. No arrasto (mouse e toque), a sala gira levemente contra o gesto.
- Física por peça: mola do cabide, corpo do tecido com atraso e barra com mais atraso (rig de dois ossos da mesma foto, sem deformar estampa). Massa por família. Vento em rajadas espaçadas, fora de sincronia, só com a arara em tela; entre rajadas o relógio para.
- Câmera reage à navegação, ao ponteiro (mouse) e ao Object View (avança ao abrir, recua ao fechar). Luz de foco por fase.
- Bug da borda direita: cabide e sombra pintavam antes da foto da roupa nas peças que entravam pela direita. Hidratação adiantada e peça revelada só com a foto decodificada: de 152/240 quadros com fantasma para 0. A borda da arara esmaece por máscara estática, e os letreiros laterais ficam na faixa limpa.
- `GBRailViews`: costas, lateral e 360° só com foto aprovada, com procedência e com arquivo real. Hoje, só a frente.
- `tests/rail-immersive-v11.mjs` (5 larguras, borda com foto lenta, interrupção, movimento reduzido, vistas). Detalhes em `docs/GB_RAIL_V11.md`.

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
