# GB Imports V35 | Intro mais rápida, fluida e sem carga residual

## Direção e implementação
- Duração do filme reduzida de 4,95s para 3,95s, sem remover a passagem em assinatura do SVG oficial.
- Feixe da direita para a esquerda adiantado para 220–2680ms (era 380–3410ms); texto de entrada inicia aos 2990ms (era 3650ms).
- O restante da loja começa a carregar discretamente aos 3120ms (antes 4500ms). Dez grupos JS continuam na ordem exata e são entregues entre intervalos de `requestIdleCallback` quando suportado, usando fallback `setTimeout`.
- Elimina dezenas de alocações `new Path2D` por quadro para fios individuais: cada fio agora reutiliza o contexto Canvas com `beginPath` e `stroke` direto. Mantém o halo e o brilho central.
- Remove limitação artificial de cadência em dispositivos capazes de desenhar a 60Hz; somente qualidade baixa (tier 2) limita a ~30fps para poupar processador.
- Ajuste adaptativo da qualidade para reduzir detalhe quando houver queda sustentada, preservando contorno/assinatura no mobile.
- `settle` continua removendo o `#gbRibbonBoot`, cancelando `requestAnimationFrame`, limpando canvas e desconectando eventos antes de revelar a hero.
- Intro permanece somente na abertura, sem fios dourados na primeira seção, com Look Studio 2D e catálogo originais preservados.

## Testes
- Build `node scripts/build.mjs` aprovado.
- `tests/intro-staged-v33.mjs`: 10 blocos do core, pronto antes da hero, desktop/mobile e CPU 3x.
- `tests/intro-retire-v34.mjs`: canvas 0x0 e zero quadros adicionais depois da intro; deep links e movimento reduzido.
- `tests/intro-fast-v35.mjs`: progressão da assinatura, tempo de entrada, hero, ausência de erros e overflow em 1440x900, 390x844, 360x780 com CPU 3x.

## Comparação de tempo de entrada
- Em execução local automatizada, V34 mobile ~6,2s versus V35 mobile ~5,2s na suite staged. Medições de amostras específicas do sandbox, não tempos garantidos.
- FPS e taxas de travamento no Edge real dependem de GPU, drivers, carregamento de rede e outras animações. Não declarar 60 FPS garantidos ou ausência absoluta de bugs.

## Publicação
Preview isolada em `perf/gb-intro-smooth-v35`; nenhuma mudança na produção 2D até aceite.