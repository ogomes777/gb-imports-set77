# GB IMPORTS — PUFF INTRO V45

A abertura da landing é o **puff de pelúcia da GB**: almofada branca/marfim com pelos tridimensionais e o monograma
oficial amarelo/preto formado pelos próprios fios, sobre um palco **preto-vidro**. Cursor e dedo abrem os fios; a
câmera mergulha no puff e a landing, já pronta por baixo, assume. Substitui a fita de vidro (V25–V38).

## O renderizador é o original do usuário

`src/plush/PlushTile.tsx` é o componente PlushTile entregue pelo usuário (Originkit). O primeiro commit da V45 guarda
o arquivo intacto (só CRLF → LF); as adaptações vêm no commit seguinte como diff revisável, todas marcadas
`GB IMPORTS:` no código:

| Adaptação | Por quê |
|---|---|
| `image` padrão e preset → `./assets/brand/gb-monograma-amarelo-preto.svg` | o original apontava para um CDN da Brandfetch e um `blob:` temporário do Originkit; o GB tem de aparecer offline/sem CDN |
| GPU por software (SwiftShader, llvmpipe) → evento `gb:plush-unsupported`, sem desenhar (salvo `allowSoftware`) | segundos por quadro: travaria a loja; o visitante fica com o poster |
| `strandCap` (teto de fios por aparelho) + compensação de espessura limitada a 1,5× | o original pede até 260 000 fios; o teto preserva a silhueta sem virar arame |
| evento `gb:plush-ready` só depois de ler de volta um bloco de pelo iluminado | nunca apresentar um canvas montado e preto (bug do quadrado preto) |
| eventos `gb:plush-failed` (shader, contexto perdido) e estatísticas em `root.__gbPlush` | orquestração e QA |

Tudo o mais é o original: almofada por SDF com bevel e domo, preparação por transform feedback, fios instanciados
em 4 segmentos, fluxo pelas bordas da arte (tensor de estrutura), tufos, coroa, gravidade, brisa, Kajiya–Kay,
sombra de raiz, rim light, sub-pelo, pincel do cursor e inclinação do tile, qualidade adaptativa e teardown.
As props são o preset do usuário (`furColor #FFFFFF`, `scale 115`, `radius 49`, `puff 10`, `breeze 10`,
`response {reach 5, parallax 4, strength 6}`) com os padrões do próprio componente para arte, pelo e avançado.
A entrada do original (`entrance`) fica desligada: a entrada é feita em CSS no palco, para que o primeiro quadro
já tenha o pelo inteiro — nunca toco curto nem almofada lisa.

`src/plush/gb-plush-entry.jsx` monta com React 19 (`window.GBPlush.mount/unmount`). O `unmount` roda a limpeza do
próprio componente (rAF, ResizeObserver, IntersectionObserver, listeners, texturas, buffers, programas) e depois
`WEBGL_lose_context`.

## Primeiro quadro, poster e live

1. **Primeira pintura (HTML crítico):** o palco `#gbRibbonBoot` já cobre a página, preto, sem logo nem tile.
2. **Poster de pelo real** (`assets/brand/gb-puff-poster-v44.webp`, RGBA 553×549, do pacote de handoff): é
   pré-carregado só na landing, decodificado (`img.decode()`) e só então aparece, com entrada de câmera (escala 0,9 → 1,
   desfoque 14 → 0 px). É provisório: a captura em alta resolução a partir do próprio renderizador existe
   (`scripts/capture-gb-puff-poster-v45.mjs`), mas numa GPU por software 60 000 fios a 1100 px passam de vários
   minutos por quadro; rodar numa máquina com GPU física e trocar o arquivo depois de comparar.
3. **Live:** com WebGL2 numa GPU física e sem Save-Data, o chunk do PlushTile (pré-carregado só na landing) monta
   depois que o boot da loja já foi disparado; o canvas fica invisível (mas medido, nunca `display:none`) até o
   `gb:plush-ready`, e aí poster → live é um cross-fade no lugar. O poster foi calibrado contra o render ao vivo
   (1440×900 e 390×844): mesma largura de silhueta e centro a poucos px.

Sem poster e sem GPU, o palco fica preto por um instante e a loja abre — nunca um ícone plano.

## Máquina de estados e boot

`gb-puff-intro.js` (no chunk `_gb/gb-intro.*.js`, antes de qualquer script da loja):

```
idle → visible-poster → visible-live → transitioning → finished
          └──────── fallback (só poster) / failed (nada desenhável) ────────┘  (nunca bloqueiam)
```

| Tempo | O quê |
|---|---|
| 0 | palco preto; poster e chunk pedidos |
| ~0,3 s | poster decodificado aparece (`visible-poster`) |
| 0,65 s | **boot da loja** (`GB_BOOT_CORE`, grupos espaçados por idle callback) — em paralelo, nunca à espera da GPU |
| depois | live monta (só GPU física); primeiro quadro verificado → `visible-live` |
| 2,6 s após o puff aparecer (1,3 s na revisita da sessão) | se a loja está pronta e ninguém está mexendo no puff: mergulho (950 ms) |
| 5,2 s | **watchdog**: mergulho rápido (480 ms) aconteça o que acontecer |
| 9 s | garantia **só de CSS**: a página reaparece e o palco some mesmo se o JS morreu ou a thread principal travou |

`finish(reason)` é idempotente; `teardown()` limpa timers, listeners, React, GPU e remove o palco. Também liberam
a loja: o botão PULAR, Escape/Enter/Espaço/Page Down/↓, a roda do mouse (depois de 0,7 s), a aba oculta e o
`pagehide`. **Tocar ou arrastar o puff nunca pula** — é aí que os fios respondem (o palco usa `touch-action: pan-y`,
como o original). Movimento reduzido, links diretos (`#colecao`, `?peca=`, `/gb…`) e rotas não mostram a intro nem
baixam o chunk ou o poster. O muro de blocos da V12 continua desligado (`GB_GLASS_RIBBON_INTRO`).

Orçamento de fios: 90 000 (desktop), 36 000 (≤ 4 GB ou ≤ 4 núcleos), 26 000 (toque ou < 720 px), além da qualidade
adaptativa do original (resolução 0,6–1 e afinamento quando quadros atrasam).

`window.GBPuffIntro` é a API (estado, modo, linha do tempo, `live`, `brush`, `finish()`); `window.GBGlassRibbons` é
um alias, porque a navbar, a CSS de rotas, o boot da loja e as suítes leem o ciclo da intro por esse nome.

## Build

`scripts/build.mjs` empacota `src/plush/gb-plush-entry.jsx` com esbuild (React 19, `process.env.NODE_ENV=production`)
em `_gb/gb-plush.<hash>.js` (~225 KB, só na landing). **É obrigatório:** sem esbuild/React ou com erro de compilação
o build falha (fim do "READY sem o renderizador"). `package.json` + `package-lock.json` fixam as versões;
`vercel.json` e os workflows rodam `npm ci` antes do build.

## QA

- `node tests/puff-intro-v45.mjs` — matriz de aceite automatizável: poster como primeiro objeto de marca, palco
  preto quadro a quadro, boot em paralelo, live verificado, canvas medido, cross-fade, pincel abrindo sob cursor e
  dedo sem pular, teardown, PULAR, falhas (bundle, poster, core, sem WebGL2, CPU 4×), movimento reduzido, links
  diretos, rotas e revisita.
- `tests/intro-*.mjs` — os contratos V25–V38 (primeira pintura coberta, saída, nada pintando depois, CPU lenta,
  falha de rede, link de produto) reescritos para o puff; o que era só da fita (varredura, tinta, vidro pérola)
  virou a verificação equivalente do puff.
- No Chromium headless o WebGL é por software: os testes cobrem o caminho do poster por padrão e forçam o live com
  `?gbPuffLive=1` (12 000 fios); `?gbPuffHold=1` segura a intro para gravação. FPS em GPU física e aparelho real
  ainda precisam ser medidos fora deste ambiente.
