# GB Imports V34: Intro exclusiva, hero sem ribbons

## Problema confirmado
Na V33, `settle()` movia o elemento `#gbRibbonBoot` para dentro de `#heroStage`, ligava `is-settled` e continuava executando o `requestAnimationFrame` enquanto a hero estivesse visível. Isso causava os filamentos dourados atrás dos produtos e consumo de CPU/GPU após a entrada.

## Correção
- O ribbon existe **apenas durante a abertura cinematográfica**. Após as duas portas de vidro saírem da tela (~1,08 s), o host completo é removido do DOM, sem reparentear para a hero.
- `cancelAnimationFrame` e `raf=0`, `disconnect` de listeners de pointermove/down/touchmove/resize/visibilitychange, descarte do backing store do canvas (`width/height=0`).
- `alive()` só agenda quadros enquanto `intro=true`; nem scroll nem pointer reiniciam o loop depois de terminado.
- Intro levemente mais rápida: timeline de 5,45 s para 4,95 s. Mobile com orçamento de 25 ms em vez de 30 ms por quadro, conservando qualidade adaptativa.
- CSS final impede o elemento de ser exibido na hero, como proteção adicional; não deixa nenhuma camada dourada residual do filme.
- Entradas diretas de produto e preferências de reduzir movimento desmontam o canvas sem renderizar.
- `replay()` ainda é capaz de remontar a intro sob demanda, sem custo em background após concluída.
- O Glass, a assinatura vetorial da logo original, o texto 'ENTRE NA GB.' e os arquivos do catálogo/Look Studio permanecem preservados.

## QA
- `tests/intro-staged-v33.mjs`: início com intro, dez chunks da loja carregados, hero sem canvas, produto profundo funcionando; desktop 1440×900, mobile 390×844, CPU 3× em 360×780.
- `tests/intro-retire-v34.mjs`: espera host removido, `active=false`, backing buffer 0×0, ausência em `heroStage`, nenhum quadro novo após 1,2 s ou `mousemove`; reduced motion e direct product sem canvas.
- O projeto principal ainda precisa de medição no Edge e iPhone físicos, pois testes Chromium headless não garantem FPS em hardware real.

## Deploy
Isolado em branch `fix/gb-intro-only-v34`. Não mesclar na produção 2D sem aprovação.