# GB Flagship / QA V06 (22/10/2026)

## Automatizado — `node tests/e2e.mjs`
Chromium headless (Playwright 1.56). Rodado na fonte (`/`) e no build (`dist/`): **189/189 verificações aprovadas** em cada.

Larguras: 1440×900, 1024×768, 768×1024, 390×844 (touch), 320×720 (touch) e 390×844 com `prefers-reduced-motion`.

Fluxos cobertos em cada largura: overflow horizontal (topo e página inteira), grade inicial, filtros (agasalhos, camisa+short, salvos vazio), busca sem acento + URL, ordenação A–Z, favorito, detalhe (abre, `?peca=`, troca de vista, próxima peça, tamanhos, adicionar à seleção, URL limpa ao fechar), Escape, busca da gaveta, arara (botão, arrasto com mouse, filtro, viewer abre/navega/fecha), showroom, Look Studio (trocar peça, salvar look), identidade, hero, atalho de loja com GB Wipe, deep link e ausência de erros de JS/rede.

Também verificado: `dist/gb-standalone.html` abre por `file://` sem erros; filme em 3 cenas abre e fecha com Escape; importador testado com PNGs sintéticos numa cópia descartável (foto substitui a ilustração, `gb-ex-*` aparece só com foto, galeria esconde vistas sem foto).

## Medições de laboratório (não são RUM)
390×844, CPU 4× mais lenta, rede simulada: LCP ≈ 1,3 s · CLS 0,02 · resposta a cliques 50–175 ms.

## Correções feitas nesta rodada
- Arara recriava o DOM a cada troca e "teletransportava" as peças → DOM persistente com física.
- Overflow horizontal em 320–768 px (filtros em coluna com wrap, painel do Look Studio, títulos grandes em 320 px).
- Cabeçalho da coleção quebrado no mobile (coluna estreita) → coluna única.
- Menu mobile incompleto e com numeração duplicada.
- `@import` de fontes bloqueante → `<link>` com preconnect.
- Showroom piscava ao trocar (classe aplicada no mesmo quadro) → palco duplo com crossfade.
- Looks salvos ficavam invisíveis → lista com restaurar/remover.

## Não testado / não garantido
Safari iOS e Android físicos, leitores de tela (VoiceOver/TalkBack), rede móvel real, Core Web Vitals de campo, contraste automatizado completo. Nada comercial (preço, estoque, checkout) existe para testar.
