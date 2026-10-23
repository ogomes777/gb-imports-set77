---
name: gb-qa
description: "Use na validação da GB Rail V10: testes Playwright, consistência do catálogo, interação real, acessibilidade, regressão e performance mobile antes do deploy."
---
# Skill GB QA — Proof Before Deploy

## Fluxo

1. `node scripts/build.mjs`, registrar logs e erro.
2. Servir build: `npx http-server dist -p 8081 -c-1`.
3. `node tests/e2e.mjs http://localhost:8081/` (ajustar testes legados que dependam de contagens antigas com novo manifesto real).
4. Criar testes V10 com as regras do `docs/06_QA_ACESSIBILIDADE_PERFORMANCE.md`.
5. Comparar prints/filmagem de desktop e mobile com mapas de quadros fornecidos.
6. Confirmar teclado, Escape/foco, touch scroll, reduced motion e asset 404.
7. Medir custo de interações (frames, long tasks), LCP/CLS/INP em ambiente mobile controlado e reportar medição, não promessa.
8. Publicar preview somente com build válido e sem regressão crítica. Reportar flag por item não implementado por falta de mídia.

## Cenários-bloqueio

- SVG de roupa antiga apareceu na arara.
- Vista de costas surgiu sem arquivo de costas.
- Ficha oferece cor sem variante válida.
- A peça troca de identidade entre combo/top/bottom.
- No mobile, swipe salta em vez de deslizar ou aprisiona scroll vertical.
- O cabide desconecta do tecido durante gesto.
- A atualização quebra catálogo, busca, favoritos ou viewer.

## Formato de saída

Tabela `teste | ambiente | resultado | evidência | risco`; screenshots em pasta local/artefato de CI apropriado, sem subir vídeos privados de referência para o repositório público.
