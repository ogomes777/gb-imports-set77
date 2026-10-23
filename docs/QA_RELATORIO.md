# GB Flagship / QA V09 — GB Fit Studio (23/10/2026)

## Automatizado — `node tests/e2e.mjs`
Playwright / Chromium. Fonte (`/`), build (`dist/`) e preview da Vercel da branch: **442/442 verificações aprovadas** em cada.
Larguras 1440, 1024, 768, 390 (touch), 320 (touch) e 390 com `prefers-reduced-motion`.

Fluxos V09 cobertos:
- **Base**
  - Um único manequim vestindo superior e inferior, com IDs iguais à seleção.
  - Aviso de simulação editorial visível.
  - Corpo inteiro ocupando ≥ 78 % do palco e dentro dele.
  - Controles com 44 px e fora da nav fixa.
- **Trocas**
  - 3 trocas rápidas de superior convergem para a última, sem empilhar fantasmas; o inferior não muda.
  - Nenhuma animação ativa depois que a peça assenta.
  - Evento `gb:look-change` com `{topId,bottomId,changedPart,source}`; rótulo acessível atualizado.
  - 3 trocas de inferior preservam o superior.
  - MISTURAR entra em `switching-both`, troca as duas peças e volta a `idle`.
- **Mesmo estado final por qualquer origem**
  - Clique, setas, swipe (mobile) e arraste até o corpo (desktop) chegam ao mesmo resultado.
- **Salvar, restaurar e A/B**
  - Look salvo guarda IDs reais + `presentationVersion`.
  - A/B com o look salvo no mesmo corpo e escala; divisor ajustável; sem rótulo duplicado.
  - Fechar o A/B remove a figura B; restaurar veste o look salvo.
- **Acesso**
  - Troca pelo teclado.
  - Movimento reduzido troca sem animar.
- **Regressão V06–V08**
  - Catálogo, busca, filtros, viewer de peça, cores na peça, arara, hero, ficha e campanha.
  - Sem overflow e sem erros de JS ou de rede.

## Revisão visual
Capturas 1440/1024/390/320 e vídeos de troca (desktop e mobile) revisados quadro a quadro. Corrigidos durante a revisão:
- quadril aparecendo pela lateral da barra;
- listras laterais da camisa pesadas demais;
- aviso legal sobre as setas;
- palco do desktop mais alto que a tela (agora sticky, com o corpo inteiro visível);
- rótulo "A / ATUAL" herdado da V07 duplicado no A/B;
- MISTURAR sobre o rótulo B;
- MISTURAR que às vezes mantinha uma das peças.

## Não testado / limites
- Não testado: aparelhos físicos, Safari real, leitores de tela reais (só semântica e rótulos verificados) e fps medido em aparelho mediano.
- O provador é uma composição editorial: não mede caimento nem tamanho e não simula tecido.

---

## Histórico — QA V07 (22/10/2026)

## Automatizado — `node tests/e2e.mjs`
Playwright 1.56 / Chromium. Fonte (`/`), build (`dist/`) e preview da Vercel: **278/278 verificações aprovadas** em cada.
Larguras 1440, 1024, 768, 390 (touch), 320 (touch) e 390 com `prefers-reduced-motion` — 46 verificações por largura.

Novos fluxos V07: trio do hero (3 peças persistentes; periférica assume o capítulo; protagonista = capítulo ativo; protagonista abre a ficha; arrasto troca capítulo), ficha aberta e fechada 10 vezes seguidas sem erro, foco devolvido ao card, URL limpa, botão voltar fecha a ficha, arara com arrasto 1:1 (erro < 14 px em 80 px), barra em curva, Chromatic sem deslocar o molde (mesma caixa entre estados) e com rótulo de estudo, encaixe e comparação A/B no Look Studio, slot de campanha presente.

## Lighthouse mobile (simulado; V06 e V07 rodados intercalados, mesma máquina e rede)
| Rodada | V06 perf / a11y | V06 FCP · LCP · TBT | V07 perf / a11y | V07 FCP · LCP · TBT |
| --- | --- | --- | --- | --- |
| 1 | 89 / 96 | 3,0 · 3,0 s · 0 ms | 88 / 100 | 3,0 · 3,0 s · 0 ms |
| 2 | 88 / 96 | 3,0 · 3,0 s · 0 ms | 97 / 100 | 1,8 · 2,1 s · 100 ms |
| 3 | 87 / 96 | 2,9 · 2,9 s · 0 ms | 88 / 100 | 3,0 · 3,0 s · 0 ms |

CLS 0 em todas. A performance oscila de forma bimodal nas duas versões (dependente da chegada das fontes e do CSS); a V07 entrega muito mais cena sem piorar a medição, com acessibilidade 100. Antes da otimização final a V07 chegou a 340 ms de TBT; montar Look Studio, Chromatic e grade do Showroom só perto da tela trouxe para 0–100 ms.
Lighthouse não mede INP de campo. Em CPU 4× mais lenta, cliques responderam entre 35 e 180 ms.

## Movimento
- Um único `requestAnimationFrame` compartilhado (GBMotion.Ticker), ativo só durante gesto ou acomodação; zero loop ocioso.
- Transições usam `transform`/`opacity`; brilho das peças do hero só em aparelhos não-`lite`.
- `prefers-reduced-motion`: sem intro, autoplay, wipe, mosaico, lâmina do título ou molas — tudo navegável (cenário dedicado no E2E).

## Não testado / limites
iPhone e Android físicos, Safari real (View Transitions no Safari 18 não verificado em aparelho), leitores de tela, 60 fps medidos em aparelho mediano, Core Web Vitals de campo.

---

## Histórico — QA V06 (22/10/2026)

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
