---
name: gb-rail-cinematic
description: "Usar em qualquer trabalho na seção #rail da GB Imports: direção cinematográfica, reveal pós-capítulo, aproximação de câmera, arara física 2.5D/3D, suspensão, vento, bugs de duplicação, variantes, física e QA sem falso 360°."
---
# Skill GB Rail Cinematic / V11

## Ativação
Ao receber pedido que mencione GB Rail, arara, cabides, roupas penduradas, giro, vento, 3D, 4D, imersão, navegação lateral ou bug de texto/cópias na borda do rail.

## Leitura obrigatória
1. `CLAUDE.md` do repositório, sem substituí-lo.
2. Skill existente `.claude/skills/gb-ref-motion/SKILL.md`: capítulos e prioridade de animações.
3. Pasta de briefing `GB_RAIL_IMERSIVO_CLAUDE_V11/{00_COMECE_AQUI.md,01_PROMPT_MESTRE_CLAUDE.md,CONTEXTO,ENGENHARIA,DIRECAO,QA,REFERENCIAS}`; o pacote pode estar **fora** do repo por confidencialidade.
4. `gb-rail-v10.js/css`, `motion-core.js`, `rail-catalog.js`, `assets-map.js`, `index.html`, `v04.css`, `gb-edit-v12.js`, `docs/GB_EXPERIENCE_SYSTEM_V40.md`.

## Fluxo profissional
**Inspecionar → provar o defeito → film language → teste pequeno → integrar → ensaiar → medir → preview.**

### Cinema
- Montar cenário tridimensional e fisicamente coerente por camadas/meshes geométricos: parede, junção piso/parede, piso, barra, suportes, sombra e luz.
- Câmera virtual `dollyZ`: distância inicial clara, zoom aproximando, easing moderado; sem salto de escala quando intro de capítulo ainda cobre a seção.
- O cabide não é imagem chapada. Pivô no gancho, gravidade, amortecimento e reação a scroll e ao arrasto.
- Roupa usa foto existente com recorte e sombreamento respeitoso, sem deformar logotipos. Vento = oscilação irregular, baixa amplitude, atraso entre gancho e barra do tecido, nunca balançar tudo em sincronia.
- Realizar key poses antes de microdetalhes. A experiência comunica loja, não catálogo flutuante.

### Engenharia
- `GBMotion.Ticker` já agrupa quadros. Não criar segundo RAF permanente.
- `GBRail.state` informa posição, item, fase, viewer e filtro. Não criar fonte paralela da verdade.
- Garantir que a revelação `gb-edit-v12` termine primeiro; use evento ou observe remoção de `.gb-chap`; não disparar timer cego de scroll.
- Limitar trabalho à viewport visível. Preferir `transform`/`opacity`; sombras complexas precalculadas; evitar filtros animados caros.
- Degradação: mobile baixo consumo e `saveData` = profundidade CSS leve/efeitos discretos; reduced motion = cena final estática funcional.
- Rotação real de peça exige várias vistas autênticas/mesh próprio. Não clonar lado oculto de PNG.
- Manter semelhança da peça com assets aprovados, sem falsas informações comerciais.

### Bug de duplicações
- Primeiro instrumentar: `.gb-tags`, `.r10-item`, `.hg`, `.rail-side-stamp`, `.rail-viewport`, texto renderizado e geometria.
- Distinguir decorativo legítimo de erro. `FROM THE RACK / TO THE STREET` e `GB IMPORTS / 001` existem por design; não confundir com clones.
- Testar interação rápida e 30 saltos, filtros e viewport resize. Investigar `retractTags` (remoção de 200ms), `swapFigure` (dois `.hg` na troca), `onSettled`, `buildRail`, clipping, `z-index` e nós de acessibilidade.
- Corrigir a causa e evitar memória/nós órfãos; teste automatizado prova ausência de duplicações persistentes.

## Gate de conclusão
- Sem ruído no lado direito; sem overflow horizontal.
- A partir de #rail, a câmera parece entrar numa loja e a peça central se aproxima de forma controlada.
- Ventilação/sway natural, irregular, independente, que pausa corretamente.
- Drag, teclado, filtros, tags de cor, contadores, viewer e volta preservados.
- 320/390/768/1024/1440, reduced motion e `saveData` conferidos.
- Build e testes existentes checados; preview no **mesmo** projeto Vercel.

Se algo não puder ser plenamente físico sem malha de roupa, comunicar explicitamente o limite, entregar qualidade máxima no cenário e pipeline de assets para multiview.
