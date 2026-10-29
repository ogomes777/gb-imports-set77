# GB Imports | V36 — Correção do lag após assinatura da logo

## Causa reproduzida (V35)
O usuário observou travamentos após a revelação da marca em dois PCs usando Microsoft Edge. O perfil no Chromium com CPU reduzida confirmou o conflito: a avaliação dos dez chunks de JS da loja iniciava por volta de **3,2 segundos**, enquanto o ribbon ainda redesenhava o Canvas e animava clip-path e contorno SVG. A carga produziu tarefas longas de 76–122 ms no desktop emulado e até 121 ms no mobile emulado após o terceiro segundo. Isso explica a disputa por main thread sem atribuir falsamente a causa ao código da hero.

## Arquitetura corrigida
- A intro animada continua com o mesmo Glass branco, fios dourados e assinatura vetorial original, sem qualquer mudança visual de marca.
- Quando a assinatura completa 100% por volta de 2,82 s, `parkForStore()` interrompe o `requestAnimationFrame` de forma determinística; o Canvas preserva o último quadro e o texto 'ENTRE NA GB.' entra por transição CSS.
- Somente **1100 ms depois** do quadro final e da entrada estabilizada, o sistema chama `GB_BOOT_CORE` e executa os dez chunks da loja. O movimento da intro deixa de disputar CPU/GPU com a inicialização.
- A abertura das portas acontece exclusivamente após `gb:core-ready` ou `gb:core-failed`. Há fallback de 11,8 s para que o cliente não fique preso caso a rede falhe.
- Durante a fase estática `is-render-idle`, pausam as animações decorativas do Glass e desativa-se o contorno SVG auxiliar. O monograma oficial permanece íntegro.
- Depois da abertura, o ribbon é removido do DOM, o buffer Canvas zerado, o rAF cancelado e os listeners desconectados (conservação da V34).
- Links diretos de produto e preferência por movimento reduzido permanecem sem intro.

## Comparação medida
- V35 desktop CPU 2×: core começa ~3,2 s, com tarefas longas no trecho móvel de 3,5–4,5 s. V36 no mesmo tipo de teste: até 4,0 s, nenhum long task atribuível à carga de core após o terceiro segundo. Os chunks só começaram aproximadamente aos 4,5 s (desktop) e 4,0 s (mobile).
- Os long tasks não desaparecem do hardware: a execução das camadas da loja ainda exige CPU, mas ocorre enquanto a tela de entrada está estática, sem animação a perder quadros.
- Essas métricas são do Chromium em ambiente automatizado, NÃO representam uma medição do Edge nos computadores do usuário. Não alegar zero lag universal.

## QA executada
- Build `node scripts/build.mjs`, testes `intro-staged-v33.mjs` e `intro-retire-v34.mjs` aprovados, incluindo mobile e 3× CPU lenta; teste V35 parcialmente executado antes de encerramento inesperado do navegador de testes na rodada longa.
- Novo `tests/intro-no-stutter-v36.mjs`: desktop 1440×900, mobile 390×844, 360×780 sob CPU 3×. Exige logo assinada 100%, zero scripts de loja enquanto o ribbon está em movimento, nenhuma nova frame renderizada durante a inicialização, core pronto com 10 chunks, hero limpa, provador preservado, nenhum overflow e nenhum JS exception.
- Teste de rede com chunk #5 abortado: evento de falha libera o overlay, sem prender o visitante.

## Preservação
Branch isolada, produção 2D e Look Studio sem alteração. Não realizar merge automático. Validar no Edge físico após aprovação do preview.