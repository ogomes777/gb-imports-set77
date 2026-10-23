# GB IMPORTS — GB FIT STUDIO / V09
**SET77 LABS — Ordem de execução.** Versão estendida: arquivo local `GB_IMPORTS_V09_PROMPT_FIT_STUDIO.md` entregue ao usuário.
## Objetivo
No `#lookstudio`, eliminar as duas roupas suspensas sem corpo e implementar UM manequim/personagem original editorial GB, de corpo inteiro, que realmente **veste** o superior e inferior selecionados. Personagem ocupa o palco esquerdo; seletores permanecem à direita no desktop e abaixo no mobile.
## Auditoria inicial
- `index.html`: `.look-stage`, `#lookPreviewTop`, `#lookPreviewBottom`, `#lookTops`, `#lookBottoms`, `#lookShuffle`, `#lookCompare`.
- `v03.js`: `paintPiece`, `choose`, `cycle`, `renderOptions`, `renderSaved`, `renderCompare`, pointer/swipe/drag. Atualmente injeta `productMedia` em duas caixas absolutas.
- `v03.css`: layout e responsive da seção.
- `main.js`: `PRODUCTS`, `productMedia`, `garmentSVG`, `GB_ASSETS`, vistas disponíveis.
- `motion-core.js`: `GBMotion`, springs, frame sob demanda; preservá-lo.
- `v07.js` e `v08.js`: não quebrar visualizador, cores, hero e resto da loja.
## Personagem e roupas
Construir um personagem editorial **autoral**, manequim de moda sem parecer pessoa real, corpo persistente, postura consistente, iluminação cinematográfica controlada, sombra de contato, cabeça/mãos/pés legíveis, proporções naturais. Não confundir esse boneco de estudo com os personagens Guilherminho/Vitinho ainda não aprovados.
`CharacterRig`: plano fundo, sombra, pernas atrás, torso/braços atrás, roupa inferior presa a quadril e pernas, roupa superior presa ao ombro/torso/mangas, mãos/cabeça à frente quando necessário, detalhes e sombras de roupa. Criar âncoras anatômicas e mapeamento por categoria/SKU. Jaqueta cobre torso e mangas; camisa respeita corte; short cobre quadril/coxas; calça ocupa as pernas. Sem estampas deformadas, roupas sobrepostas soltas, troca de boneco a cada seleção ou imagens simplesmente coladas por cima.
Começar com SVG/2.5D artístico de alto acabamento; só habilitar WebGL/3D quando existirem meshes e roupas realmente modeladas. PNGs flat-lay não viram caimento real automaticamente: criar pipeline de mapeamento/validação manual.
## Animação
- Entrada suave do personagem com luz e foco.
- Troca de SUPERIOR: sai peça anterior, nova vem do seletor e assenta no torso e mangas; calça/short e corpo permanecem.
- Troca de INFERIOR: mesma física no quadril/pernas; superior fica intacto.
- MISTURAR: coreografia de duas trocas sem piscar nem perder a pose.
- SALVAR/RESTAURAR/A-B: looks mantêm IDs, escala e corpo; comparar é utilizável.
- Tap, drag, swipe, setas, teclado e reduzido têm o mesmo estado final.
- Interrupção: seleção rápida invalida animação anterior e aplica a última seleção, sem fila de timers.
- Movimento via transform/opacity, GBMotion/WAAPI, sem loop contínuo inútil.
## UX
Palco editorial clean; manequim protagonista, não decorar até poluir. Paleta estudo V1: amarelo #FFD447, ink #111214, papel #F4F1E8. Desktop palco esquerdo/personagem, comandos à direita. Mobile modelo inteiro visível, comandos legíveis, sem overflow ou menus cobrindo corpo. Botões 44px, focus, estados aria, prefers-reduced-motion e dispositivo low-end. Não transformar o look em SKU vendável.
## Referências
Rever os nove vídeos PRIVADOS do pacote V04/V05 no ambiente do Claude: vídeos 03, 05, 06, 07 e 08 especialmente movimento de roupa, arara, protagonistas/modelos e variações; 01/02/04/09 para editorial e navegação. Não publicar vídeos privados no GitHub público. Não copiar exatamente marcas ou telas.
## Execução / aceite
Implemente diretamente no código, preferencialmente `look-fitting.js` + `look-fitting.css` e rig/anchors reutilizáveis. Não entregar apenas explicação. Testar click top/bottom, 3 trocas rápidas, mistura, salvar/restaurar, comparar A/B, drag e swipe. Testar desktop 1440/1024 e mobile 768/390/320, reduzido, sem erros JS/overflow; regressão de shop, rail, viewer e cores. Rodar build; gerar preview Vercel da branch, screenshots de corpo vestido antes/depois e relato honesto. Fazer PR e não mergear em main sem validação. Nenhuma foto, tecido, estoque ou caimento real deve ser inventado.
