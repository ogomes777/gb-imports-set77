# GB Imports | V32 Glass Signature Studio

## O que mudou
- O logotipo oficial é preservado sem redesenho: `assets/brand/gb-monograma-amarelo-preto.svg`.
- Ao iniciar a intro, o motor carrega o próprio caminho vetorial `d` do SVG original. Esse contorno é sobreposto ao mesmo logo e progressivamente desenhado com `strokeDashoffset`, como assinatura luminosa.
- O sweep do ribbon da direita para a esquerda e a máscara existente continuam atuando junto do traçado do contorno. No desktop há uma segunda passagem de glint; no mobile apenas um traçado leve.
- Se a leitura SVG falhar, a intro original permanece funcionando, sem bloquear o lead nem a hero.
- Glass em branco pérola com camadas de reflexos prismáticos, caustics sutis e transparências ópticas, sem `backdrop-filter` fullscreen que prejudicaria o mobile.

## Física/performance
- Física da spline com mola criticamente amortecida **analítica**: deslocamento consistente sob tempos de quadro diferentes, inclusive CPU lenta.
- Cache em Float32Array para pontos, tangentes, pinçamento e influência do touch; sem recalcular funções complexas para cada fio.
- Eliminadas alocações de arrays e funções anônimas por ponto da linha na rotina de desenho. DPR máximo e qualidade adaptativa herdados da V31.
- Mantidas pausa offscreen/aba oculta e versão estática para `prefers-reduced-motion`.
- Traçado vetorial montado apenas uma vez, reutilizando o SVG oficial. No mobile o brilho extra do contorno é desativado.

## Testes
- `node scripts/build.mjs` (build estático).
- `tests/intro-v28.mjs`: intro antes da landing, incluindo JS artificialmente atrasado e acesso à hero.
- `tests/intro-signature-v30.mjs`: sweep da direita para a esquerda e máscara.
- `tests/intro-fluid-v31.mjs`: toque/cursor, molas e qualidade adaptativa.
- `tests/intro-vector-v32.mjs`: logo SVG vetorial real (contorno ~5906 unidades), progressão do traçado, custos e ausência de regressões em 1440×900, 390×844 e 360×780 com CPU 3× mais lenta.

## Limites reais
- Este é um motor original Canvas2D. Não é o componente React Bits Pro instalado, que exige autorização/licença e adaptação React.
- O sandbox de Chromium não substitui Safari/iOS/Android ou medições reais de FPS, LCP, INP e memória. O ambiente não possui as dependências WebKit completas; não declarar Safari aprovado.
- Nenhum efeito pode garantir literalmente zero travamento em todos os aparelhos. A implementação prevê degradação de qualidade e fallback.
- Produção 2D e Look Studio originais permanecem inalterados; publicar V32 somente em Preview até o aceite.