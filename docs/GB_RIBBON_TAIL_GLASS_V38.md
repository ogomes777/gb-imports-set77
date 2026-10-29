# GB Imports V38 | Ribbon fluido até o último fio + Glass claro em qualquer PC

## Relato que motivou a V38
O ribbon V37 estava aprovado em flexibilidade e direção cinematográfica. No Edge de um computador, contudo, ocorria um engasgo quando o feixe diagonal chegava à metade/final da tela. Em outro Edge o movimento estava fluido, mas o Glass aparecia preto. Logo original, assinatura e hero já estavam aprovadas e não devem ser alteradas.

## Diagnóstico técnico no motor anterior
- O halo usava `ctx.shadowBlur` em uma linha larga, que chega a ocupar parte considerável do viewport quando a spline completa a diagonal. O custo de rasterização cresce com os pixels cobertos e varia com CPU/GPU.
- A qualidade se reajustava depois de ~2s por `measure()`, que altera `canvas.width` e `canvas.height` e **recria o backing store** em plena passagem do feixe. Esta é uma causa plausível para a pausa/discontinuidade no final, especialmente em Edge com GPU diferente.
- O CSS legado do elemento Glass incluía um fallback escuro que podia ser exibido sob mudança de classe/tema/asset. A V37 usava um WebP claro, mas agora o fallback também será claro mesmo sem textura.

## Alterações executadas
1. **Fim do rebuffering no trecho crítico:** adaptação de qualidade do Canvas apenas nos primeiros 950ms do filme; depois a resolução não pode mudar até o fim da assinatura.
2. **Menos pixels e custo de GPU:** DPR máximo 1.05 em desktop, 1 no mobile, 0.85 em hardware limitado. A flexibilidade, spline, fios e sua direção permanecem os mesmos.
3. **Glow sem filtro custoso:** removido `shadowBlur` sobre o grande traçado central. Aura continua através de três strokes translúcidos. O final do feixe deixa de forçar um desfoque de área cada vez maior.
4. **Glass branco persistente:** host e superfície Glass recebem cores sólidas claras sob a textura; gradiente perolado e WebP reaplicados com seletor que não depende do estado `is-opening`. Temas claro/escuro e cores forçadas não devem recuperar o fundo preto.
5. **Falha de imagem segura:** o fundo ainda será branco/perolado se WebP não carregar; durante a porta de transição `is-gateway` mantém a transparência necessária.
6. Mantidos a assinatura vetorial GB original, a tela 'ENTRE NA GB.', o core escalonado após o fim do filme, o Look Studio 2D, o catálogo e a remoção completa do ribbon após a hero.

## Testes reais realizados no sandbox (Chromium)
- `node scripts/build.mjs` e `tests/intro-no-stutter-v36.mjs`: 1440×900, 390×844, CPU 3x lenta, assinatura antes do core, 10 chunks carregados, hero sem rAF residual, link direto e falha de rede.
- `tests/intro-tail-glass-v38.mjs`: desktop light/dark, mobile dark, forced colors e imagem WebP bloqueada. Background permaneceu claro, a resolução do Canvas não mudou de 1.45s até `parkForStore`, a logo terminou a assinatura, a hero e o provador mantiveram funcionamento.
- Amostragem de screenshots dos cantos (RGB) com light/dark próximos de (247,246,243) e (229,228,223); sem WebP, (247,246,242) e (247,247,242). Não houve pixels pretos nos pontos amostrados.
- Também passaram `tests/intro-no-flicker-v37.mjs`, `tests/intro-staged-v33.mjs` e `tests/intro-retire-v34.mjs`, incluindo mobile, reduced motion, direct product e prevenção de overflow.

## Risco residual e validação
Não é possível prometer zero travamentos universalmente. Testes são Chromium emulado e não medição direta do Edge/GPU dos dois PCs; a validação principal é comparar a V38 nesses dois dispositivos. Se um Edge ainda mostrar preto, conferir aceleração de hardware, bloqueio de WebP e versão/cache, registrando screenshot/console para diagnóstico; nunca atribuir sem evidências a causa ao usuário ou ao navegador.

**Deploy:** branch V38 isolada, sem merge automático; produção 2D original intocada.