# GB IMPORTS · LOOK STUDIO V1

Status: experiência editorial interativa, sem prometer provador virtual 3D, simulação de caimento ou checkout.

## Funcionalidades congeladas nesta versão

- Escolha de parte superior, inferior, tênis, boné e capuz conforme catálogo real.
- Giro ORBIT acompanhando mouse, toque ou teclado, com encaixe nas três poses.
- Gestos PASSINHO, TCHAU, SALVE, 360° e PULAR; novos gestos interrompem os anteriores.
- SALVE: dedos verticais ao lado do rosto com manga curta. Mangas longas recebem movimento menor para não distorcer fotos.
- Salvar referência local, comparação A/B, restauração e vestir kit completo quando disponível.
- Temas claro/escuro, controles desenhados para GB, estado ativo acessível e layout mobile compacto.

## Linguagem visual

Grafite e preto, ouro acetinado e champagne; acabamento metálico, focos visíveis, sem neon infinito. Produto e personagem continuam prioritários sobre os controles.

## Limitações declaradas

- Montagem 2D com fotografias: não há rig volumétrico, vistas posteriores verificadas nem física de tecido.
- Mangas longas fotografadas não suportam dobrar e animar o braço com fidelidade real.
- Coreografia editorial original sem áudio comercial incorporado e sem afirmar captura de movimento.
- Testes automatizados de largura não substituem iPhone/Android físicos e Core Web Vitals de campo.

## Critérios de regressão V1

1. Trocar repetidamente peças, calças, bermudas e tênis sem perder o encaixe.
2. Girar por mouse/toque e soltar, conferindo snap e seleção preservada.
3. Reproduzir cada emote, cancelá-lo ao trocar roupas e restaurar estado neutro.
4. Conferir V vertical afastado da cabeça; manga longa sem braço artificial.
5. Alternar temas sem bloquear interface ou criar scroll horizontal.
6. Salvar, comparar e restaurar look; ver fluxo de kit completo.
7. Validar desktop 1440px, mobile 390/320px, teclado e movimento reduzido.

## Revisão V1.3 · integridade de roupa e PASSINHO contínuo (28/10/2026)

- Fotografias das **calças compridas são sempre integrais**. Não fabricar bainhas/joelhos por um recorte trapezoidal, pois isso cria o falso efeito de bermuda sobre canelas.
- Em moletom e manga longa, a silhueta original deve aparecer **inteira** durante o repouso, o giro e a dança. Recortes de animação só devem aparecer temporariamente em TCHAU/SALVE.
- PASSINHO: o primeiro clique inicia repetição contínua; o botão muda para **PARAR** e `aria-pressed=true`. O segundo clique cancela o loop, limpa as articulações e restaura o botão. A troca de roupa ou outro gesto também cancela o loop.
- O loop pausa, sem perder o compasso, quando a aba fica oculta ou o palco sai da viewport, retomando ao reaparecer.
- Dança editorial com contagem lateral `1-2-1-2-3`, troca de peso e braços sincronizados; **não alegar reprodução idêntica de mocap** de Jamal.
- Testes: verificar todas as 34 partes superiores, 25 inferiores, 16 tênis e 5 bonés; desktop 1440 e mobile 390/320. Conferir ausência de overflow, recortes nas calças, ausência de manga segmentada em idle e parada/recomeço do PASSINHO.
- Fotografias 2D ainda têm limites em dobras durante SALVE/TCHAU; futura versão com rig volumétrico é a solução realista para eliminar completamente artefatos nas articulações.

## Ajustes de fechamento V1.4 · 28/10/2026

- A calça segue uma única fotografia original, sem dividir coxa/joelho/canela.
- No gesto em moletom, a manga usa apenas **uma fotografia contínua por braço** (máscara unificada). Não separar bíceps e antebraço em duas imagens, porque a emenda artificial reaparece no cotovelo.
- No estado normal, no giro e na dança, a peça original inteira deve continuar intacta.
- O SALVE é lateral, à direita de quem observa: abre ombro moderadamente e mantém cotovelo relaxado. Não atravessar rosto/cabeça. Os dedos em V ficam verticais.
- O PASSINHO se repete até clicar PARAR, com três batidas rápidas e avanço lateral alternado, balanço de corpo e braços soltos; cancela na troca de roupa ou escolha de outro gesto.
- Testar a prévia em 1440, 390 e 320 px com camiseta, moletom e calça, sem scroll horizontal, recortes internos artificiais ou erros de JS. Os movimentos são editoriais 2D, não mocap nem simulação física. Não declarar equivalência quadro a quadro com vídeos reais do Jamal.
- Os arquivos de origem ainda podem conter vincos/dobras reais da fotografia. Não é possível reconstruir toda a anatomia volumétrica apenas com CSS, por isso evitar movimentos exagerados em mangas de foto.

## Backlog para futura V2

Somente com novos ativos apropriados: modelagem e rig 3D próprios, movimentos capturados/autorizados, vistas reais, motor de tecido validado e medição de desempenho de campo.

Arquivos base: look-fitting.js, look-fitting.css, gb-v11.css, v03.js e tests/e2e.mjs.