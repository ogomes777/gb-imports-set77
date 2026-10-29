# GB IMPORTS / Glass Ribbon Intro V25 — SET77 LABS

## O que foi implementado
A intro antiga de blocos foi substituída exclusivamente na **abertura da landing** por uma camada Glass preta/grafite e fios brancos/dourados fluidos. Um único canvas é mostrado fullscreen na abertura, revela o monograma GB original com glow controlado e, após 2,4 s, passa para o fundo da hero existente. Não cria segunda animação nem uma landing paralela.

O canvas continua em loop enquanto a hero está na área visível, reage ao cursor e ao touch, e deixa de interceptar cliques quando sai do modo fullscreen. Respeita `prefers-reduced-motion`.

## Tecnologia e licença
O site é **estático, sem React ou shadcn/ui**, com build que concatena camadas JS/CSS. O pedido citou **Interference Ribbons do React Bits Pro**, componente comercial licenciado. Não há `REACTBITS_LICENSE_KEY` acessível nem instalação React no projeto. Portanto a implementação usa **um motor Canvas2D original**, inspirado no conceito visual, sem copiar o componente ou afirmar que ele foi instalado. A instalação oficial do componente proprietário dependeria de licença válida e projeto React com registry configurada; nunca embutir a chave no JavaScript servido ao público.

## Contrato de preservação
- A hero original `#heroStage`, textos, botões, produtos, capítulos, temas, carrosséis e o provador Look Studio 2D continuam com seus IDs e lógica.
- O efeito substitui apenas `gb-edit-v12.js` na abertura, usando `window.GB_GLASS_RIBBON_INTRO` para evitar a sobreposição com a antiga intro de quadrados.
- O intro overlay captura cliques/touch durante o reveal para não abrir elementos por baixo; depois torna-se `pointer-events:none`, permitindo usar a landing.
- Não publicar em produção sem revisão do preview.

## Desempenho
- Pixel ratio limitado a 1,5 desktop e 1,25 mobile.
- De 30 fios desktop e 18 mobile; cerca de 50/34 pontos por fio; duas passagens de glow simplificado.
- Pausa quando aba oculta ou hero fora da viewport.
- Sem dependências npm de runtime, sem shaders WebGL, sem filtro blur pesado no mobile.
- O custo do desenho sozinho não garante FPS final: validar FPS, LCP e memória em dispositivos físicos antes de considerar performance de produção aprovada.

## QA
`node scripts/build.mjs` e `node tests/intro-v25.mjs` servindo `dist` na porta 8080. O teste verifica desktop 1440×900 e mobile 390×844, logo/Glass/ribbons, intro de blocos desativada, transição de DOM fullscreen para hero, loop após a intro, zero overflow/erros JS, intactos `#heroArt` e `#lookstudio`, e cliques da intro não vazando para o modal de produtos.
