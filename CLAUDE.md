# GB IMPORTS | SET77 LABS

## Escopo
Flagship de demonstração, navegável, sem dados comerciais confirmados. Não é loja operacional.

## Arquitetura
- Fonte modular em camadas: `styles.css`/`main.js` (núcleo comercial) → `v03` → `v04` → `v05` → `v06` (direção de movimento). Evoluir as camadas existentes; não reconstruir.
- `node scripts/build.mjs` gera `dist/` (o que a Vercel publica) e `dist/gb-standalone.html`.
- `node tests/e2e.mjs <url>` deve passar 100% antes de qualquer push.
- Fotos reais só via `scripts/importar_produtos.py` → `assets-map.js`. A UI troca a ilustração pela foto sozinha.
- Não incorporar neste repositório público: gravações de referência, capturas internas, manual em PDF, briefing confidencial, dados de clientes ou credenciais.

## Direção
Preservar o monograma GB (SVG, nunca redigitado) e a paleta V1: amarelo `#FFD447`, preto `#111214`, papel `#F4F1E8`, cinza `#666864`. Uma animação por intenção; só `transform`/`opacity`; rAF apenas durante interação; `prefers-reduced-motion` desliga tudo. Mobile primeiro: 320–1440px sem overflow, alvos de 44px.

## Comercial
Preço, estoque, marcas, tamanhos, prazos, procedência e compras só após validação dos responsáveis. Nunca simular venda, escassez, desconto ou avaliação. Ilustrações são estudos e devem continuar sinalizadas como tal. Identidade V1 aguarda aprovação final.
