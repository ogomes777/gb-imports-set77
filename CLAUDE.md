# GB IMPORTS | SET77 LABS

## Escopo
Flagship de demonstração, navegável, sem dados comerciais confirmados. Não é loja operacional.

## Arquitetura
- Fonte modular em camadas: `motion-core.js` (GBMotion: tokens, molas, rAF único, gesto, FLIP, mídia) → `styles.css`/`main.js` (núcleo comercial) → `v03` → `v04` → `v05` → `v06` → `v07` (palco de câmera, campanha) → `v08` (viewer de peça, cores na peça) → `look-fitting` (V09: manequim que veste o look; ver `docs/FIT_STUDIO_V09.md`) → `gb-rail-v10` (V10: arara física + Object View; catálogo em `rail-catalog.js`) → `showroom-cinema` (ABAIXO DE ZERO: congelamento, floco 3D, Tech Fleece) → `gb-v11` (ilha de navegação que troca de tom pela seção, tema claro/escuro por sol/lua no topo — claro = ORIGEM, escuro = SINAL —, hero-palco com o trio em giro contínuo só com o hero em tela, faixas de categorias que filtram o catálogo; marcas só entram nas faixas depois de confirmadas pela GB) → `gb-edit-v12` (V12: abertura e capítulos em muro de cor com palavra grande na landing inteira — o carrossel do editorial e a página da peça saíram na V15; gramática em `.claude/skills/gb-ref-motion`, detalhes em `docs/GB_EDIT_V12.md`) → `gb-cinema-v13` (V13: tema em círculo a partir do sol/lua, lupa da própria foto no viewer da arara, só com mouse (cursor sempre o do sistema), botões magnéticos, cards com inclinação e reflexo, grão de película; ver `docs/CINEMA_V13.md`) → `gb-film-v14` (V14: letreiros com luz que varre cada linha e esperam o muro do capítulo, profundidade por rolagem nativa (scroll-driven animations), hero em camadas com canhão de luz no mouse, cartela final com o monograma; ver `docs/FILME_V14.md`) → `gb-encounter-v15` (V15: THE ENCOUNTER — o palco do editorial é só de Gui e Vitin, ilustrações aprovadas e nunca redesenhadas; entram, se cumprimentam com rig recortado do próprio desenho — mão do Gui no pulso, aceno de cabeça do Vitin — e congelam no quadro final; camadas por `scripts/gerar_rig_encounter.py` em `assets/characters/`; skill `.claude/skills/gb-encounter`, detalhes em `docs/ENCOUNTER_V15.md`). Evoluir as camadas existentes; não reconstruir.
- Todo movimento novo usa `GBMotion` (nada de rAF próprio em loop, nada de recriar DOM a cada troca). Ver `docs/DIRECAO_V07.md`.
- `node scripts/build.mjs` gera `dist/` (o que a Vercel publica) e `dist/gb-standalone.html`.
- `node tests/e2e.mjs <url>` deve passar 100% antes de qualquer push.
- Fotos reais só via `scripts/importar_produtos.py` → `assets-map.js`; campanha via `campaign-map.js`. A UI troca a ilustração pela foto sozinha.
- GB RAIL V10: a arara só recebe peça com mídia real conferida. Decisões por registro em `data/gb-rail-curation.json` (olhando a imagem, nunca pelo nome); `python3 scripts/medir_midia_rail.py` mede recortes e gera sombras; `node scripts/gerar-rail-v10.mjs` gera `rail-catalog.js` + auditoria (`--check` no CI). Costas/lateral/360° e cores só com foto real daquela vista/cor: nunca espelhar a frente nem pintar variante.
- Não incorporar neste repositório público: gravações de referência, capturas internas, manual em PDF, briefing confidencial, dados de clientes ou credenciais.

## Direção
Preservar o monograma GB (SVG, nunca redigitado) e a paleta V1: amarelo `#FFD447`, preto `#111214`, papel `#F4F1E8`, cinza `#666864`. Uma animação por intenção; só `transform`/`opacity`; rAF apenas durante interação; `prefers-reduced-motion` desliga tudo. Mobile primeiro: 320–1440px sem overflow, alvos de 44px.

## Comercial
Preço, estoque, marcas, tamanhos, prazos, procedência e compras só após validação dos responsáveis. Nunca simular venda, escassez, desconto ou avaliação. Ilustrações são estudos e devem continuar sinalizadas como tal. Identidade V1 aguarda aprovação final.
