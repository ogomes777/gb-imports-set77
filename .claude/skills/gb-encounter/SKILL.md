---
name: gb-encounter
description: "Use ao criar, revisar ou ajustar o encontro de Gui e Vitin no editorial NÃO É SOBRE TER (#editorial, V15): personagens ilustrados aprovados, rig 2D recortado do próprio desenho (mão do Gui, cabeça do Vitin), cena de entrada, cumprimento, pulso e quadro final."
---
# Skill GB Encounter — V15

## Leia antes de mexer
- `CLAUDE.md`
- `docs/ENCOUNTER_V15.md`
- `gb-encounter-v15.js` / `.css`
- `scripts/gerar_rig_encounter.py`
- `gb-film-v14.*` (letreiros) e `gb-edit-v12.*` (muro do capítulo que segura a cena)

## Contrato de fidelidade
1. **Rostos.** Nunca redesenhar o rosto de Gui ou Vitin. Nada de rosto regenerado por IA.
   - A cabeça do Vitin só gira ou desloca inteira; nada de escala só em um eixo.
2. **Figurino.**
   - Gui: conjunto branco, boné bege monogramado e o gesto com a mão. É o mais alto.
   - Vitin: conjunto preto, boné bege virado para trás, óculos lilás e tatuagem. É o mais baixo (93%).
   - Os dois usam slide preto de faixa larga.
3. **Rig.** Articulações só com partes que EXISTEM no desenho, recortadas pelo script. A base só reconstrói o que a parte escondia; nada de esticar ou espelhar.
4. **Toque de mãos ou soquinho.** Exige arte nova da mão e do braço do Vitin (no desenho estão no bolso). Pedir à ilustração; não inventar.
5. **Sinalização.** O palco segue sinalizado como "ILUSTRAÇÃO". A UI não cita marca de roupa.

## Contrato de engenharia
- **Superfície.** O alvo é `.editorial-model`. Nada de tela cheia. O carrossel de peças e a página da peça foram removidos na V15, a pedido.
- **Ligar o palco.** Só com as quatro camadas decodificadas. Se faltar, o editorial fica com a foto do acervo.
- **Movimento.** Web Animations, só transform/opacity, sem rAF em loop, nada animando no idle. Movimento reduzido mostra o quadro final. REVER repete.
- **Layout.** Calculado pelo JS (`layout()`): não cobre o texto nem corta pés ou boné em 320–1440 px.
- **Camadas novas.** Rodar o script e atualizar `CH` (proporção e pivô em %) no JS com a saída dele.

## Aceite
- `node scripts/build.mjs` e `node tests/e2e.mjs <url>` a 100% (blocos "encontro:").
- Provas visuais em 390 e 1440 px, quadro a quadro, com `getAnimations()` pausado.
- Produção só com aprovação explícita.
