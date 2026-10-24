# GB IMPORTS | DARK SPECTRUM SHOWROOM

**Direção:** SET77 LABS · 24/10/2026  
**Status:** implementado na branch `stage/gb-remove-entre-encontre` (PR #4 em rascunho), **sem deploy**.

## Experiência

A abertura do NIGHT SHOWROOM (`#showroom .showroom-heading`) tornou-se uma cena cinematográfica programática e responsiva, sem imagem ou vídeo de fundo:

- **GSAP real (3.15.0):** troca automática e contínua de identidade luminosa entre ÂMBAR, AZUL ELÉTRICO, CORAL e LIMA. A passagem tem blackout parcial curto, aceleração suave, redução da intensidade e intervalos propositadamente diferentes.
- **Three.js real (r186.1):** canvas WebGL transparente e independente atrás do lettering. Quatro anéis 3D em perspectivas diferentes, três linhas/planos luminosos e campo de partículas com posicionamento determinístico; cores e intensidade reagem à paleta atual, com movimento de câmera discretamente guiado pelo cursor em desktop.
- **Camada física/editorial:** aurora, feixe diagonal, grade de profundidade e contador cromático discreto, preservando o texto “O LADO ESCURO.” e toda a navegação do showroom abaixo.
- **Mídia 100% programática:** sem imagens estáticas novas, vídeos, bibliotecas completas carregadas no topo ou modelos 3D externos.

## Integração

Arquivos adicionados:

- `showroom-cinema.js`: controlador de estado, GSAP, carregamento sob demanda do Three, cena 3D, gestão de visibilidade e ciclo de vida.
- `showroom-cinema.css`: layout da cena, camadas, luzes, fallback e responsividade.

Arquivos alterados:

- `index.html`: canvas mount + medidor da paleta + referências às novas camadas.
- `tests/e2e.mjs`: presença da cena, legibilidade e segurança para movimento reduzido; erros apenas das bibliotecas opcionais são registrados separadamente. Testes também exigem quatro itens Tech Fleece, fotos do conjunto e desativação da vista superior inexistente no creme.

## Curadoria exclusiva Tech Fleece

O mesmo Night Showroom foi restringido ao grupo `gb-v10-tech-fleece` de `rail-catalog.js`, que reúne somente quatro variantes do mesmo conjunto de frio:

| Ordem | Variante | Produto de origem | Mídia validada para interface |
| --- | --- | --- | --- |
| 01 | Grafite | `gb-crt-004` | Conjunto / superior / inferior |
| 02 | Azul | `gb-crt-003` | Conjunto / superior / inferior |
| 03 | Cinza | `gb-crt-001` | Conjunto / superior / inferior |
| 04 | Creme | `gb-crt-002` | Somente conjunto completo |

- Não há mistura com `gb-crt-005` (kit de camisa e short), `gb-crt-006` (outro moletom) ou peças aleatórias como fallback.
- Palco, grade e seletor agora apresentam as quatro cores, sempre com **conjunto completo** por padrão.
- A vista `SUPERIOR` fica desabilitada na cor creme, pois só há imagem do kit inteiro. Para outras cores com foto superior isolada, permanece funcional.
- Essa seleção editorial **não altera o catálogo geral, estoque, valores ou disponibilidade comercial**; o acervo e a atribuição de procedência ainda exigem confirmação.
- A grade é 2×2 no desktop e mobile, com adaptação intermediária para 4 colunas em telas médias.

## Engenharia de desempenho e acessibilidade

- O script local é minúsculo e participa do build estático existente; GSAP e Three são carregados **apenas ao aproximar-se do showroom**, por URLs fixadas em CDN.
- WebGL não é inicializado quando `prefers-reduced-motion` está ativo, com `saveData` habilitado ou em dispositivo classificado como low-end por GBMotion.
- `pixelRatio` é limitado a 1,35 no desktop e 1 no touch. Renderização limitada aproximadamente a 36 FPS desktop e 25 FPS touch.
- Seção fora da tela e aba oculta pausam a timeline GSAP e o loop de render; o sistema reutiliza `GBMotion.Ticker` e impede loops duplicados após reentrada.
- Fundo decorativo é `aria-hidden`, não captura gestos do showroom, não altera interações comerciais, e possui fallback CSS caso GSAP/Three/WebGL ou CDN não estejam disponíveis.
- A preferência por redução de movimento congela o espetáculo em uma composição estática legível.

## Restrições e validação pendente

**Não declarar E2E ou revisão visual como concluídos para esta mudança.** Ainda são necessários:

1. Rodar `npm run build` e `npm run test:e2e` com as dependências habituais e verificar Chromium em 1440/1024/768/390/320 px e movimento reduzido.
2. Conferir Safari/iPhone real: viewport, WebGL, aba em segundo plano, continuidade da rolagem, ausência de overflow e comportamento térmico.
3. Validar as quatro cores, o tempo das transições e a posição dos anéis atrás do título, preferencialmente por captura de vídeo.
4. Depois dos testes, integrar PR #4 e publicar com o pacote de 22 bermudas ocultadas + faixa “ENTRE E ENCONTRE.” removida.

A Vercel estava recusando novos deploys por limite diário (`402 api-deployments-free-per-day`) durante a preparação. **Nenhum novo deploy foi solicitado por esta tarefa.**

## Dependências externas

GSAP `https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js` e Three.js `https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js` são recursos progressivos, opcionais e carregados sob demanda; o arquivo standalone conserva a experiência visual estática sem conexão. Caso seja obrigatório funcionar sem CDN, uma próxima etapa deve baixar, versionar e empacotar ambas as bibliotecas localmente, evitando carregar Three no primeiro paint.

## V7 · ABAIXO DE ZERO (estado atual, substitui as descrições acima onde divergirem)

- **Nome:** “ABAIXO DE ZERO.” (sobretítulo “03 / GB COLD ROOM”): a câmara fria traduzida para moda. ES “BAJO CERO.”, EN “SUB ZERO.”, IT “SOTTO ZERO.”; o seletor de idioma reescreve o h2 e o módulo refaz as letras sozinho.
- **Abertura:** paisagem congelada em noite azul profunda (shader em meia resolução), onda de frio a cada 9 s, título azul gelo fixo em 3D que flutua/pulsa, floco de cristal que gira 360° e responde a arrasto de mouse/dedo com inércia (rolagem vertical continua livre).
- **Palco Tech Fleece:** anel neon de gelo atrás da peça, luz que respira, arco de luz girando e duas camadas de neve caindo; tudo `transform`/`opacity`, só anima com o palco na tela; desligado em movimento reduzido.
- **Desempenho:** tempo real entre quadros (mesma velocidade em 60/90/120 Hz), teto de 60 fps com queda adaptativa (30 fps, depois resolução), céu a 30 fps no toque, variáveis CSS escritas só quando mudam, camadas CSS de reserva paradas com o WebGL no ar, neve sem repintura.
- **Validação:** `node tests/e2e.mjs` 710/710 em 1440/1024/768/390/320 px e movimento reduzido. Não testado em aparelho físico nem Safari/iOS real.
