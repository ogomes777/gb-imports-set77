---
name: gb-encounter
description: "Use ao criar, revisar ou ajustar o encontro de Gui e Vitin no editorial NÃO É SOBRE TER (#editorial, V15): personagens ilustrados aprovados, cena de entrada, pulso, modos A GALERA / AS PEÇAS e preservação do carrossel V12."
---
# Skill GB Encounter — V15

## Leia antes de mexer
- `CLAUDE.md`
- `docs/ENCOUNTER_V15.md`
- `gb-encounter-v15.js` / `.css`
- `gb-edit-v12.js`: carrossel, `GBEditCarousel.refresh()` e guarda de arrasto `is-galera`
- `gb-film-v14.*`
- `motion-core.js`

## Contrato de fidelidade
1. **Rostos.** Nunca redesenhar o rosto de Gui ou Vitin sem aprovação explícita. Nada de rosto regenerado por IA.
2. **Figurino.**
   - Gui: conjunto branco, boné bege monogramado e o gesto com a mão. É o mais alto.
   - Vitin: conjunto preto, boné bege virado para trás, óculos lilás e tatuagem. É o mais baixo (93%).
   - Os dois usam slide preto de faixa larga.
3. **Arquivos.** Usar só os arquivos de `assets/characters/`. Mover, inclinar e escalar sem distorcer: nada de esticar, espelhar ou girar o corpo em 3D.
4. **Aperto de mão.** Não chamar de aperto de mão enquanto os PNGs forem achatados. Cumprimento articulado é a fase 2 (rig de braço, antebraço e mão, com pivôs e poses validadas), descrita em `docs/ENCOUNTER_V15.md`.
5. **Sinalização.** O palco segue sinalizado como "ILUSTRAÇÃO". A UI não cita marca de roupa.

## Contrato de engenharia
- **Superfície.** O alvo é `.editorial-model`. Nada de tela cheia nem página separada.
- **O que preservar.** Título e CTA da esquerda, `#editorialProduct`, `.gbc-ui` e os gestos e a página da peça da V12.
- **Ligar o palco.** Só com as duas ilustrações decodificadas. Sem elas, o carrossel V12 fica intacto.
- **Modos.** A GALERA / AS PEÇAS com `aria-pressed`, setas ←/→ e `inert` na parte escondida. REVER só no modo galera.
- **Movimento.** Web Animations ou CSS, só transform/opacity, sem rAF em loop, nada animando no idle. Movimento reduzido mostra o quadro final.
- **Layout.** Calculado pelo JS (`layout()`): não cobre o texto nem corta pés ou boné em 320–1440 px.

## Aceite
- `node scripts/build.mjs` e `node tests/e2e.mjs <url>` a 100%. Os blocos "encontro:" vêm antes dos do carrossel.
- Provas visuais em 390 e 1440 px. Testar AS PEÇAS com seta, arrasto e página da peça.
- Produção só com aprovação explícita.
