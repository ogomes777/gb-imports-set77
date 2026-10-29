# GB IMPORTS — V28 White Glass Opening

## Direção
- A experiência começa ANTES da landing: markup do overlay estático inserido como primeiro elemento do body, e CSS crítico no head. Não depende da chegada do bundle deferido para esconder o conteúdo.
- Superfície Glass fullscreen branca/off-white, reflexos suaves, filamentos metálicos dourados e grafite. Sem card, moldura ou borda.
- Monograma GB original: assets/brand/gb-monograma-amarelo-preto.svg. Não redesenhar.
- Filme de aproximadamente 5,45 segundos, com reveal da logo mais lento, seguido da mensagem ENTRE NA GB. / NÃO É SOBRE TER. É SOBRE SER.
- Portas de vidro centrais deslizam lateralmente em ~1,08 s, revelando a hero já existente. Depois o mesmo canvas reentra na hero, continua em loop, reage a mouse e touch.

## Segurança de primeiro frame
- Sem JS, o overlay usa uma animação failsafe para se liberar depois de 11 segundos; não deve prender o visitante indefinidamente.
- O código remove o estado de boot somente após obter contexto Canvas 2D.
- Links de âncora profundos não interrompem navegação com filme; prefers-reduced-motion permite acesso sem a animação.

## Performance
- Mesmo motor Canvas2D da V27, com qualidade 0-2 adaptável, DPR limitado, pausa offscreen e tempo de animação compensado quando há queda de quadros.
- Não há blur de tela inteira no mobile; o Glass é desenhado com gradientes e poucas camadas CSS.
- Não prometer 60 fps absoluto sem aparelho físico. Desktop headless pode sofrer com software compositing.

## Testes
- tests/intro-v25.mjs e tests/intro-v26.mjs adaptados para aguardar handoff concluído.
- tests/intro-perf-v27.mjs adaptado para aguardar o filme de duração ampliada.
- tests/intro-v28.mjs carrega JS com atraso de 1,4 s e verifica que o overlay preexistente cobre a landing desde a primeira pintura, em 1440x900 e 390x844. Também verifica duração, tela de entrada, retorno da hero, loop, acessórios intactos e reduced motion.
- Build node scripts/build.mjs e quatro testes acima passaram em sandbox.

## Deploy
- Mudança em branch própria, sem merge/produção até revisão. Provador Look Studio 2D, catálogo e demais sessões permanecem intactos.
- Esta é uma implementação Canvas2D original, não código do React Bits Pro licenciado.