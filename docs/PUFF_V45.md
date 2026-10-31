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

## Primeiro quadro: live do começo ao fim (V45.1)

1. **Primeira pintura (HTML crítico):** o palco `#gbRibbonBoot` já cobre a página, preto, sem logo nem tile.
2. **Sondagem de GPU** (antes de qualquer marca): um contexto WebGL2 descartável com
   `failIfMajorPerformanceCaveat` + o nome do renderizador decidem o caminho.
3. **GPU física → live do primeiro ao último quadro.** O chunk do PlushTile é pedido na hora (só neste caminho) e o
   tile monta assim que chega; o palco fica preto até o `gb:plush-ready` (pelo iluminado lido de volta) e então o
   puff ao vivo sobe do escuro (escala 0,88 → 1 e opacidade, **sem filtro sobre o canvas**). Não existe troca de
   "tecido": o poster nunca aparece antes do live.
4. **Sem GPU física** (rasterizador por software, sem WebGL2, Save-Data) → o poster de pelo real é o puff, do começo
   ao fim, e o chunk do PlushTile nem é baixado.
5. **Se o live não sobe em 1,5 s** numa GPU física (aparelho lento, rede ruim), o poster assume e fica — o live é
   desmontado e um quadro pronto depois é ignorado (sem troca tardia).

O poster (`assets/brand/gb-puff-poster-v44.webp`, RGBA 553×549, provisório) é pré-carregado só na landing e
decodificado antes de aparecer. Está calibrado contra o render ao vivo (1440×900 e 390×844: mesma silhueta e centro
a poucos px). A captura em alta resolução pelo próprio renderizador (`scripts/capture-gb-puff-poster-v45.mjs`)
precisa de uma máquina com GPU física.

## Desempenho

| Aparelho | Fios | Pixels do canvas | DPR máx. |
|---|---:|---:|---:|
| Desktop | 70 000 | 1,9 M | 1,5 |
| ≤ 4 GB ou ≤ 4 núcleos | 34 000 | 1,4 M | 1,5 |
| Toque ou < 720 px | 22 000 | 1,0 M | 2 |

Dentro disso roda a qualidade adaptativa do original (resolução 0,6–1 e afinamento quando os quadros atrasam; 60 fps
com interação, 30 fps só com a brisa). Nenhum filtro (desfoque) toca o canvas WebGL: entrada e mergulho são só
escala e opacidade. No caminho live a loja começa a carregar logo depois do primeiro quadro do pelo (ou aos 1,2 s),
para os dois não disputarem a thread principal.

## Saída: mergulho + abertura dourada

O mergulho escala a câmera 3,6× e dissolve o palco. No meio dele, quando o puff ocupa o quadro, a abertura da
própria landing (V12, `window.GBEditOpening({gold:true})`) entra em **dourado** — muro amarelo, monograma preto,
GB IMPORTS — e explode em blocos sobre o hero, como os muros amarelos dos capítulos. Sem a loja carregada (watchdog
antes do core), o mergulho segue direto para a página.

## Máquina de estados e boot

`gb-puff-intro.js` (no chunk `_gb/gb-intro.*.js`, antes de qualquer script da loja):

```
idle → visible-poster → visible-live → transitioning → finished
          └──────── fallback (só poster) / failed (nada desenhável) ────────┘  (nunca bloqueiam)
```

| Tempo | O quê |
|---|---|
| 0 | palco preto; poster e chunk pedidos |
| ~0,1–0,3 s | GPU física: primeiro quadro verificado do live (`visible-live`); sem GPU: poster (`visible-poster`) |
| 0,65 s (poster) · após o 1º quadro do live, no máx. 1,2 s (live) | **boot da loja** (`GB_BOOT_CORE`, grupos espaçados por idle callback) — nunca à espera da GPU |
| 1,5 s | prazo do live: sem quadro verificado, o poster assume e fica |
| 2,6 s após o puff aparecer (1,3 s na revisita da sessão) | se a loja está pronta e ninguém está mexendo no puff: mergulho (950 ms) |
| 5,2 s | **watchdog**: mergulho rápido (480 ms) aconteça o que acontecer |
| 9 s | garantia **só de CSS**: a página reaparece e o palco some mesmo se o JS morreu ou a thread principal travou |

`finish(reason)` é idempotente; `teardown()` limpa timers, listeners, React, GPU e remove o palco. Também liberam
a loja: o botão PULAR, Escape/Enter/Espaço/Page Down/↓, a roda do mouse (depois de 0,7 s), a aba oculta e o
`pagehide`. **Tocar ou arrastar o puff nunca pula** — é aí que os fios respondem (o palco usa `touch-action: pan-y`,
como o original). Movimento reduzido, links diretos (`#colecao`, `?peca=`, `/gb…`) e rotas não mostram a intro nem
baixam o chunk ou o poster. O muro de blocos da V12 continua desligado (`GB_GLASS_RIBBON_INTRO`).

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
