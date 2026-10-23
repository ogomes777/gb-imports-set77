---
name: gb-rail-v10
description: "Use ao implementar, corrigir ou revisar a arara digital GB Imports: geometria da barra, cabides, profundidade, seleção horizontal, viewer e fidelidade aos vídeos de referência."
---
# Skill GB Rail V10 — Physical Rack Experience

## Objetivo

Criar experiência de arara interativa fisicamente plausível no repositório `ogomes777/gb-imports-set77`. Não construir um carrossel genérico. O palco deve transmitir roupas suspensas com a mesma continuidade espacial antes, durante e depois da seleção.

## Leia antes

- `00_LEIA_PRIMEIRO.md`
- `docs/01_REFERENCIAS_E_MICROINTERACOES.md`
- `docs/03_ARQUITETURA_INTERACOES_MOTION.md`
- `docs/07_DEFINICAO_DE_PRONTO.md`
- `REFERENCIAS/REF_A_ARARA_E_FICHAS.mp4`, `REF_B_ROTACAO_E_CORES.mp4` e `PRINT_GB_ATUAL.png` (somente pasta local; nunca subir ao repositório público)
- código: `index.html`, `v04.js`, `v04.css`, `motion-core.js`.

## Procedimento obrigatório

1. Mapear DOM e comportamento atual antes de editar.
2. Compor elemento visual `hangerAnchor + hanger + garment + shadow` com pivô compartilhado.
3. Calcular caminho da barra e posição de cabides a partir do mesmo espaço de coordenadas.
4. Integrar seleção e inércia ao `GBMotion.Ticker`/`Spring` (sem novos rAF contínuos).
5. Implementar foco 3/4 → frente usando apenas mídia/ângulo suportados.
6. Separar `rail drag` de `viewer orientation drag`.
7. Testar desktop, touch, teclado, reduced motion e viewport estreita.

## Proibições

- Não inventar costas de roupa, textura ou cor.
- Não expor `garmentSVG` no rack de catálogo real.
- Não usar `rotateY(180deg)` em uma foto plana e afirmar que virou de costas.
- Não remover filtros, favoritos, sacola, viewer ou showroom para simplificar a tarefa.
- Não publicar a referência privada nem copiá-la como asset do website.

## Resultado da skill

Diff funcional na branch, comparação visual documentada, screenshots, teste de continuidade e lista de limitação de mídia por item.
