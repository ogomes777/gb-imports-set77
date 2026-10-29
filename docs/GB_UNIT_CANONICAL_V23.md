# GB IMPORTS / SET77 LABS — GB UNIT CANÔNICO V23

## Princípio
Um único GB UNIT é o personagem da experiência. O renderizador WebGL volumétrico é a representação principal, não um segundo robô. O antigo compositor fotográfico 2D subsiste exclusivamente como fallback para ausência de WebGL e como modo de comparação A/B. Não há botão para alternar entre dois personagens.

## Fonte única de estado
`GBFitting.state` continua a selecionar top, bottom, tênis, boné e capuz a partir do catálogo real. A fachada `window.GBActor` expõe seleção, giro e gestos. Mudanças no look atualizam as fotos projetadas no volume; backfaces e laterais não são evidência fotográfica de peças.

## Renderizador
`gb-true3d.js` desenha superfícies em WebGL com coordenadas XYZ reais. Cada vértice guarda posição, normal, cor, grupo de articulação, slot de material e UV. Um buffer é recriado somente quando o look altera geometria, nunca por frame; juntas e movimento são implementados no vertex shader.

Os slots de textura projetam a referência aprovada da cabeça (`GB_SKIN.pieces.head.src`), monograma GB e fotos frontais do look (`GB_FIT_CATALOG`) sobre as superfícies do mesmo ator. São projeções editoriais: não há imagens verificadas de costas, tecido PBR medido nem digitalização de caimento. Não vender como uma visão autêntica de produto em 360°.

## Rig e biomecânica
Grupos separados para cabeça, olhos, ombros, antebraços, mãos, coxas, joelhos, canelas e tênis. A timeline do passinho interpola balanço e transferência de peso e adiciona adução do ombro, flexão acentuada do cotovelo, giro medial do punho e atraso da mão. Ainda é animação procedural inspirada na referência, **não** mocap nem cópia 1:1 quadro a quadro. O objetivo seguinte de fidelidade requer rig/retarget com observação visual do vídeo de referência.

Em idle, peito/ombros realizam respiração leve, olhos piscam com intervalos variáveis, cabeça e olhar seguem cursor e toque com suavização, tudo com `prefers-reduced-motion` respeitado.

## Controles
- Um único conjunto de gestos GB (PASSINHO, TCHAU, SALVE, 360°, PULAR).
- ORBIT 360° contínuo com drag mouse/touch, setas e presets 0°,90°,180°,270°.
- O canvas WebGL só aparece quando a seção é visível; sai do loop quando offscreen/aba oculta. Tem cap de DPR mobile e target de até 60 fps sem bloqueio artificial em 30 fps.
- A/B retorna temporariamente ao compositor 2D por ser uma ferramenta editorial comparativa, sem apresentar um segundo personagem ao cliente.

## QA
- `npm run build`
- `node tests/actor-v23.mjs http://127.0.0.1:8080/` com servidor da pasta dist.
- Job GitHub Actions `gb-actor-3d.yml` independente dos E2E legados.
- Verificar telas 1440 e 390, giro 180°, 3D ativo, 19.812 vértices no look ensaiado, olhos ao cursor, dança iniciar/parar, zero overflow e erros JS.
- Regressão legada força fallback técnico com `__GB_E2E_FORCE_LEGACY` apenas no contexto Playwright.

## Pendências honestas
1. Fidelidade exata das peças em costas/laterais exige fotos de múltiplos ângulos ou assets GLB/GLTF/UV validados por peça.
2. A animação Jamal não é reprodução mecânica perfeita; refinar em um rig humanoide completo com restrição articular, ground-contact, IK e retarget se solicitado o nível de mocap.
3. Teste final de FPS e temperatura em aparelhos físicos para atestar fluidez em diferentes GPUs.
4. Preview Vercel e produção só devem avançar após build/QA e liberação da quota de deployments; preservar o ambiente principal até então.
