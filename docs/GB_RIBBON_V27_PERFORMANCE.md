# GB Imports | Glass Ribbon V27: desempenho

## Diagnóstico
A gravação desktop da V26 mostrou interrupções de quadros. Reproduzimos a landing em Chromium headless sem gravador e comparamos ribbons ativos e desativados. Nesse sandbox o FPS foi baixo mesmo sem ribbon; números de sandbox NÃO equivalem à experiência em hardware real.

## Correções
- Canvas2D reduz de 84 para 72 fios desktop em qualidade máxima; mobile 38 para 36.
- Qualidade adaptativa 0-2 ajusta número de fios, amostras e DPR quando o intervalo de frames cresce; histerese de aproximadamente 2 s para evitar oscilação brusca.
- Clock da animação avança pelo tempo decorrido com limite de 200 ms por quadro, em vez de 70 ms, reduzindo câmera lenta em frame drops.
- Máscara de revelação da logo original atualiza em cadência moderada, poupando trabalho de composição.
- Pausa fora da viewport/aba oculta e reinicia quando a hero retorna.
- Acessibilidade para preferência de movimento reduzido é mantida.

## Medição do desenho Canvas2D (não FPS total)
| Ambiente | V26, média | V27, média |
|---|---:|---:|
| Desktop 1280×720 | 4,35 ms | 1,54 ms |
| Mobile 390×844 | 1,25 ms | 0,49 ms |

Esses resultados variam por execução. A landing completa ainda fica lenta no ambiente headless, inclusive quando a animação é desativada. Não alegar 60 FPS garantidos em dispositivos físicos.

## Verificação
- Build estático concluído.
- tests/intro-v26.mjs passou em 1440×900 e 390×844.
- tests/intro-perf-v27.mjs passou em 1280×720 e 390×844, incluindo posição de cursor/toque, loop, pausa offscreen, retorno e preferência reduced motion.

## Preservação
A skin e o Look Studio 2D não mudam; a produção continua no commit estável, sem merge automático. Para aceite final, medir FPS, LCP, INP e memória em desktop e smartphones reais.