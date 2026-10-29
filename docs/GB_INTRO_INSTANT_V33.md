# GB Imports | V33: Intro sem disputa com a landing

## Diagnóstico
A V32 estava executando 24 camadas de JS no mesmo bundle deferido (~500 KB) durante o início da intro, além das animações da loja por baixo. Medidas A/B com Chromium CPU 2x indicaram interrupções perceptíveis na renderização quando a loja e o efeito rodavam juntos. Números headless não representam FPS real do Edge.

## Implementação
1. O build estático produz um `gb-intro.[hash].js` pequeno e independente (~17 KB). Ele carrega como script normal no final do body, iniciando o filme antes dos módulos grandes.
2. O restante do JS da loja é dividido em 10 arquivos `gb-core-N.[hash].js` mantendo a ordem original das 23 camadas. Os scripts são carregados sequencialmente, com breves pausas entre os grupos, evitando a avaliação de meio megabyte de uma vez.
3. O primeiro script do catálogo é pré-buscado discretamente após os primeiros quadros. A inicialização principal começa na tela 'ENTRE NA GB.' (~4,5 s), e a abertura das portas aguarda `GB_CORE_READY`.
4. Um fallback limitado a ~11 s impede prender o visitante se um arquivo falhar. Não bloquear deep links, acessibilidade ou modo de movimento reduzido.
5. Os elementos da landing fora do Glass permanecem com `visibility:hidden` enquanto o filme ocupa a tela, poupando pintura de conteúdo invisível, com layout preservado para o boot.
6. A qualidade do ribbon começa em nível conservador. Aumenta detalhes somente após intervalos de quadro estáveis; hardwareConcurrency baixo, pouca memória ou Save-Data começam no modo leve.
7. Links diretos `?peca=...` dispensam a intro e carregam o produto diretamente, mantendo a conversão.
8. `gb-standalone.html` continua com conteúdo e scripts inline, sem depender de um servidor; mantém a sequência original completa.

## QA
- `node scripts/build.mjs` (verifica todas as 24 camadas e cria 10 grupos sequenciais).
- `node tests/intro-staged-v33.mjs`: desktop 1440×900, mobile 390×844, CPU 3× em 360×780; confirma que nenhum bloco principal executou durante a assinatura, depois que todos os 10 carregaram e que GBFitting e o produto profundo funcionam.
- Testes anteriores V28/V30/V31/V32 continuam verificando primeira pintura, logo vetorial original, assinatura, resposta ao toque, continuidade do loop, layout sem overflow.
- `tests/e2e.mjs` aguarda o evento de disponibilidade do core após navegação para testar as funções da loja.

## Limites
**Não é possível garantir zero lag em todos os computadores.** A melhoria isola o efeito no primeiro acesso e escalona a carga principal, mas Edge, Safari/iOS e hardware físico exigem validação com Performance/INP/LCP e memória. Os testes automatizados usam Chromium; não declarar Edge físico validado.
Produção 2D permanece no commit estável. Publicação apenas em Preview até aprovação.