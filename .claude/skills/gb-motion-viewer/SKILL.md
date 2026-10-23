---
name: gb-motion-viewer
description: "Use para projetar rotação de produtos, viewer 2.5D/3D, seleção de vistas conjunto/superior/inferior e fichas penduradas de cores reais da GB Imports."
---
# Skill GB Motion + Viewer — Media-driven Orientation

## Contrato

A capacidade de girar é um atributo da **mídia disponível**, não uma promessa universal da UI. Use o Tier A/B/C/D descrito em `docs/04_MIDIA_3D_VARIANTES_COMBOS.md`.

## Integração

- `v04.js`: `drawViewer`, `openRailViewer`, `viewerMode`, `gb:object-product`.
- `v08.js`: painel de **estudo fictício** atual deve ser separado do controle de variantes reais.
- `main.js`: `availableViews`/`productMedia`, observando fallback atual.
- `motion-core.js`: `GBMotion` obrigatório.

## Modos

`combo | top | bottom`: habilitar conforme imagem real separada para mesma peça/variante; não gerar imagens de costas ou de partes por CSS. Para kits completos isolados, suportar cabide+presilha ou foto composta quando os ativos exigirem.

## Orientação

- Tier A: modelo 3D com backside real validado; gesto de rotação contínua.
- Tier B: sequências reais; snap/interpolação discreta conforme frames.
- Tier C: `front/side/back` verificadas; transição por estado, rotulação correta.
- Tier D: somente leve perspectiva editorial para a frente real, máximo aproximado 10–20°, sem controle de costas/360.

## Fichas

Stack ao alto à direita com altura e área touch seguras, `aria-pressed`, variante real por `variantId`. A ficha selecionada desce um pouco e a roupa muda com crossfade curto após pré-decodificação. Se apenas uma variante real, ocultar tags. Fichas não podem disparar drag ou cobrir CTA.

## QA obrigatório

- Girar um único PNG 180° nunca renderiza um verso.
- A troca de variante atualiza produto principal, não apenas amostra.
- A troca de vista preserva seleção de cor quando suportada.
- Em caso de falha de asset a UI permanece íntegra.
- Touch no viewer não navega a arara por trás do modal.
