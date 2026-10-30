---
name: gb-puff-exact
version: 1.0
description: "Usar em qualquer trabalho na intro da GB Imports (puff de pelúcia, PlushTile original, WebGL2, poster de pelo real, saída de câmera, boot seguro da loja)."
summary: Implementar a intro original PlushTile da GB Imports em preto glass, sem fallback plano, com toque e boot seguro, preservando o storefront e o trabalho Claude anterior.
---

# Skill: GB Imports — Exact Reactive Plush / Intro V45

## No repositório (V45 implementada)
- Componente original: `src/plush/PlushTile.tsx` (o commit `chore(plush)` guarda o arquivo do usuário intacto; as adaptações GB vêm como diff, marcadas `GB IMPORTS:`).
- Montagem React: `src/plush/gb-plush-entry.jsx` (`window.GBPlush.mount/unmount`).
- Orquestração: `gb-puff-intro.js` + `gb-puff-intro.css` (estados, poster, live, mergulho, watchdog, teardown). Detalhes em `docs/PUFF_V45.md`.
- Poster: `assets/brand/gb-puff-poster-v44.webp`; captura offline: `scripts/capture-gb-puff-poster-v45.mjs`.
- Testes: `tests/puff-intro-v45.mjs` e as suítes `tests/intro-*.mjs` (contratos V25–V38 no contrato V45).
- QA: `?gbPuffLive=1` força o live numa GPU por software; `?gbPuffHold=1` segura a intro (gravação).

## Quando usar
Ativar quando a tarefa envolver a intro loader da GB Imports, o puff branco com GB amarelo e pelos 3D, cursor/touch, shader WebGL2, a substituição do fallback plano, a saída para a landing ou regressão do boot.

## Entradas obrigatórias
1. Ler `00_INICIO/LEIA_PRIMEIRO.md` e `01_BRIEFING/PROMPT_MESTRE_PARA_CLAUDE.md` deste pacote.
2. Ler **o código integral** `05_CODIGO_ORIGINAL/PlushTile_ORIGINAL_USUARIO.tsx`.
3. Ver `04_REFERENCIAS/REFERENCIA_INTERACAO_PLUSH.mp4` quadro a quadro, `PRINT_PUFF_WEBGL_REAL.png`, `PRINT_ERRO_TILE_LISO.png`, e o poster `06_ATIVOS/gb-puff-poster-v44.webp`.
4. Auditar a `main` atual da GB e PRs #46, #48, #49, #50.

## Restrições inegociáveis
- Sem arte reimaginada: usar shader original de fios e modelo real de almofada.
- Primeiro objeto visível = puff peludo; não mostrar GB chapado em capa de almofada lisa.
- Preto glass; sem componente de fita dourada, sem luz/partículas exageradas.
- Mouse e touch mexem nos **fios**, não só no container inteiro.
- Não reter navegação: core independente da pelúcia e saída watchdog <=6.4 s.
- Mobile, teclado, reduced motion e WebGL offline precisam liberar a loja.
- Não alterar GB Rail V11.4, Catalog Wave V41, Look Studio, catálogo, navbar nem produção.
- Nunca promover sem testes CI, screenshots/vídeo e aprovação do proprietário.

## Procedimento
1. Preflight: status Git/PR/branches, novas mudanças Claude, baseline funcional.
2. Criar branch fresca baseada em `origin/main`, NÃO mesclar #50.
3. Portar somente componente original e adaptador de render; corrigir assets locais.
4. Colocar poster de pelo real provisório como primeira imagem, com preload/decode e fallback não plano.
5. Orquestrar poster→WebGL, GPU tiering, pointer/touch, cleanup e saída câmera→landing.
6. Fazer build e validar bundle Vercel, URL dos assets e render real.
7. Testar cada caso da `03_QA/MATRIZ_ACEITE.md`.
8. Registrar vídeo/screenshots e relatório de QA; publicar preview isolado e entregar PR.

## Sinais de falha
- Build READY sem bundle do PlushTile => FALHA.
- Site carrega mas poster SVG chapado mostra por um instante => FALHA.
- Render original inicia mas nunca libera a home => FALHA.
- Testes antigos falham por expectativa V38 e foram apagados sem substituição => FALHA.
- GPU por software trava; queda de frames severa; render continua em background => FALHA.

## Entrega obrigatória
Commit, PR, preview Vercel original, vídeo real desktop e mobile, 4 screenshots da timeline, dados de performance, teste de falha do shader e confirmação de regressão do site comercial.
