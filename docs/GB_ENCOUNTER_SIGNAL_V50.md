# GB IMPORTS / ENCOUNTER SIGNAL V50

## Objetivo
Na seção **NÃO É SOBRE TER. É SOBRE SER.**, elevar a aparição de Gui e Vitin sem trocar ilustrações nem interromper o salve do Gui. A metáfora visual é: **a chegada acende a cena; a conexão entre os dois libera o sinal GB**.

## O que foi implementado
- **0–1,3 s:** portal fino de luz dourada e dois fachos cruzados enquanto o rig V15 traz Gui da direita e Vitin da esquerda, com passos, rastro e pouso originais.
- **~0,8–2 s:** luz de chão e aro de expectativa acompanham os pousos, abaixo dos personagens.
- **~2,14 s (normal) / ~1,80 s (modo leve):** o salve original da mão do Gui e a resposta do Vitin disparam um feixe horizontal, dois anéis e fragmentos finitos em amarelo/branco. A reação do título **SER.** continua exclusiva do V15.
- **Depois da cena:** atmosfera estática, cursor gera apenas brilho leve no palco (desktop); toque gera anel rápido (desktop e mobile). Não há movimento eterno, nem reinicialização do personagem ao tocar.
- **↻ REVER:** utiliza a mesma entrada da V15; a camada V50 detecta `is-playing` e sincroniza a iluminação. Ao sair integralmente da seção, cancela as animações.
- **Acessibilidade:** `prefers-reduced-motion` desliga todo o V50; V15 mantém o quadro parado. Camadas decorativas são `aria-hidden`. Links e botão de replay continuam ativos.

## Invariantes de segurança
1. **Não modificar** `gb-encounter-v15.js`, `gb-encounter-v15.css` ou os arquivos `assets/characters/gb-*-{base,hand,head}.webp`.
2. A camada V50 é opcional, só se monta quando o palco V15 termina de decodificar os assets e entrar no DOM. Se V15 falhar, mantém o fallback editorial sem V50.
3. Não alterar transformações de `.gbe-hand`, `.gbe-head`, `.gbe-char`, `.gbe-cam`, nem o cálculo de layout da V15.
4. Só usar WAAPI finita (opacity/transform). Sem filtro de desfoque, Canvas, WebGL novo, scroll global ou intervalos.
5. V50 usa gradientes leves e fragmentos reduzidos em hardware de até quatro núcleos ou economia de dados.
6. A produção permanece intocada. Branch `feat/gb-encounter-impact-v50`, criada do commit `870f68ab` da prévia `feat/gb-showroom-neon-v49`.

## QA antes de integrar à produção
- Desktop 1440 × 900: entrada dupla, enquadramento e roupa preservados; o gesto do Gui continua girando em torno do pulso.
- Mobile 390 × 844 e 320 × 720: ambos integralmente na cena, sem luz cobrindo texto ou criando scroll horizontal.
- Refazer **REVER**, sair/reentrar na seção, tocar no palco, verificar ausência de exceções e animações em execução após fim.
- Com `prefers-reduced-motion: reduce`, o palco deve ficar estático e os efeitos V50 ocultos.
- Rodar `npm ci && npm run build`, o E2E existente (`tests/e2e.mjs`) e teste dedicado de V50, quando o navegador estiver disponível.

## Arquivos
- `gb-encounter-impact-v50.css`
- `gb-encounter-impact-v50.js`
- `index.html` (registra somente esses dois recursos, após a V15)
