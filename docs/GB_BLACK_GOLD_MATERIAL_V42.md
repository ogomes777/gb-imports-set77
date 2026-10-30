# GB IMPORTS | BLACK GOLD / MATERIAL SIGNATURE V42

SET77 Labs · Revisão de execução · 30/10/2026

## Escopo e material estudado
Referências do solicitante: `Texto colado.txt` (código de `PlushTile`, WebGL2 e fios instanciados), vídeo MP4 de 22,93 s mostrando o objeto de pelúcia branco e o monograma GB amarelo, screenshots da antiga intro clara com fios dourados, e o SVG oficial do repo.

O código do arquivo de referência é React/TSX de 68 KB com render de até 260 mil fios. **Não foi copiado na íntegra**: a storefront GB é JS estático, tem boot cinematográfico independente e exige performance mobile. A V42 usa renderização própria leve em WebGL2, mantida isolada no chunk antecipado da intro.

## Ato visual
1. Fundo preto real desde o CSS crítico anterior ao carregamento dos scripts.
2. Fitilhos existentes do filme V38 movendo-se mais lentamente pela tela, sem novos efeitos de partículas.
3. Objeto GB com forma arredondada almofadada, pelo branco-marfim e monograma oficial amarelo com contorno preto, estudado a partir do código/MP4.
4. Entrada com inclinação 3D sutil, luz cálida e assento de fibras, seguida da ponte para o texto de entrada e da abertura da storefront.
5. O objeto é removido e o GPU é liberado após o filme, sem continuação escondida sobre hero/coleção.

## Arquitetura
- `gb-material-v42.js`: objeto GB via WebGL2, shader de substrato + shader de fibras instanciadas e iluminação, logo extraído do SVG local, reação ao cursor, limite de partículas por capacidade, rAF encerrado, fallback sem WebGL2.
- `gb-material-v42.css`: preto #050506; contraste claro/objeto; sobreposição de assinatura da imagem, sem blend do velho vidro branco; tela de ponte e portas escuras.
- `gb-ribbon-intro.js`: permanece controlador da intro. O sweep é mais lento (aprox. 2,9 s) e o filme congela ~3,38 s antes de iniciar os scripts da storefront.
- `scripts/build.mjs`: concatena o novo arquivo ao **chunk antecipado da intro**, não aos `gb-core-*` da loja; mantém os demais scripts em ordem.
- `index.html`: primeiro paint escuro antes de qualquer JS; novos CSS/JS linkados na source modular e no standalone.
- Sem React, CDN, blob de Originkit, importação de marca externa, rede para imagens remotas ou novas dependências runtime.

## Orçamento de execução
- Desktop potente: até 28.000 strands / instancing WebGL2.
- Desktop modesto: até 15.000.
- Mobile: até 9.500.
- SaveData: 4.000.
- Canvas máximo de 850px desktop, 480px nos modos leves.
- A alternativa sem WebGL usa o mesmo monograma local num objeto com relevos CSS.
- GPU e canvas desligados quando a intro estaciona, a aba fica oculta ou a camada é removida.
- `prefers-reduced-motion` ignora intro e material.
- Em caso de falha de shader, voltar para o objeto CSS estático.

## API para QA
`window.GBMaterialSignatureV42` expõe `mode`, `strands`, `frames`, `stopped`, `asset`, `artworkReady` e `finish()`.

## QA e integração
1. `node scripts/build.mjs`
2. `node tests/material-intro-v42.mjs` (Chromium com server local `python3 -m http.server 8080 --directory dist`)
3. `node tests/intro-staged-v33.mjs`
4. `node tests/intro-retire-v34.mjs`
5. `node tests/intro-fast-v35.mjs`
6. `node tests/intro-no-stutter-v36.mjs`
7. `node tests/intro-no-flicker-v37.mjs`
8. `node tests/intro-tail-glass-v38.mjs` (V37/V38 passam a testar o NOVO contrato preto, sem a foto de vidro claro).
9. `node tests/e2e.mjs http://127.0.0.1:8080/`

**Coordenação:** PR V42 separada da `feat/gb-catalog-wave-v41` (#46). Claude desenvolvia GB Rail V11 na `claude/gracious-cerf-dluyj5`, já mesclada à main até commit `9b8a8f1d3e`. Não alterar a branch dele. Não promover a produção sem testes e aprovação.

## Fidelidade
O objeto atual não é escaneamento 3D nem cópia exata da malha do Originkit. É uma nova adaptação técnica e material à GB, com base fiel no monograma oficial. A densidade e a aparência devem ser avaliadas em dispositivos reais antes da produção.
