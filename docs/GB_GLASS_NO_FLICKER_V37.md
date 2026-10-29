# GB Imports V37 | Glass estável, assinatura sem piscar

## Sintoma relatado
Usuário testou a V36 em Edge e ainda percebeu piscadas na marca e nos filamentos na intro. O fundo também parecia branco chapado, sem material de vidro fosco convincente.

## Intervenções reais
- Reduzida a máscara SVG da logo oficial de um polígono com 11 vértices atualizado frequentemente para `clip-path: inset(0 0 0 X%)`, com uma única liberação para `none` quando a logo chega a 100%. Essa troca evita retesselar o polígono a cada atualização em Edge.
- Primeiro frame usa a mesma máscara `inset(0 0 0 100%)`, sem mudança brusca de geometria na hora em que a assinatura começa.
- Retirados `drop-shadow`, `filter:blur` e filtros em movimento da logo, do contorno, do scanner e do container. Brilho preservado com camadas gradientes, strokes e sombra CSS estática de pequena área.
- Removida a variação de opacidade de bloom por quadro. O próprio movimento dos fios e o scanner geram a assinatura.
- O contorno SVG original da logo não some de uma vez na passagem para a tela `ENTRE NA GB.`. Em vez de display:none durante `is-render-idle`, permanece até que a camada da assinatura tenha feito o fade-out.
- Se a rede atrasar a leitura do SVG vetorial, um novo contorno não pode ser inserido no meio de uma assinatura já em andamento; o mascaramento da logo oficial funciona como fallback.
- Novo fundo Pearl Optical Glass com arcos refrativos, reflexos, desfoque e bordas ópticas, gerado em SVG fonte e pré-renderizado em WebP **8.712 bytes** em 1600x900. O navegador só desenha uma imagem estática; nenhuma gaussiana ou backdrop-filter fullscreen em tempo real.
- Referência correta para asset empacotado em `/_gb/*.css`: `../assets/brand/gb-glass-pearl-v37.webp`, com HTTP 200 verificado.
- Preservadas as características V36 de não executar scripts de loja enquanto a assinatura está animando, e V34 de retirar todo o ribbon/Canvas da hero depois da intro.

## QA
- Build `node scripts/build.mjs`; assets WebP/SVG copiados para `dist/assets/brand`.
- `tests/intro-no-flicker-v37.mjs`: desktop 1440×900, mobile 390×844 e 360×780 em CPU 3× limitada. Verifica busca real da imagem Glass por rede, logo original, máscara, ausência de filtros caros, contorno SVG visível até a transição, liberação de recursos e ausência de JS errors.
- `tests/intro-no-stutter-v36.mjs`: assinatura termina com 100% antes da inicialização do core; teste de falha de rede preserva acesso.
- `tests/intro-staged-v33.mjs`: carrega 10 chunks da loja e preserva catálogo/Look Studio e deep link de produto.
- `tests/intro-retire-v34.mjs`: a hero fica limpa, Canvas com buffer 0×0 e nenhum frame adicional depois do filme.

## Limites
Testes são automatizados em Chromium, incluindo limitação artificial de CPU. Eles não demonstram FPS de campo no Edge dos dois PCs; não alegar zero travamentos em qualquer dispositivo. O usuário deve comparar a V37 contra V36 no Edge real.
Produção 2D permanece sem alteração. Branch de preview para revisão, sem merge automático.