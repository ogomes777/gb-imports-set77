# GB Fit Studio / V16 — FIT REAL

O Look Studio deixou de vestir roupas desenhadas de estudo. Agora o manequim veste **as peças reais do acervo GB**: a foto frontal de cada produto, recortada, posicionada no corpo pelas âncoras medidas na própria foto. O manequim virou um **robô prata de proporção humana** (8 cabeças): cabeça com crânio, mandíbula, olhos de vidro com íris amarela GB, nariz e boca; pescoço com tendões; braços com cotovelo, antebraço e mão; pernas com coxa, joelho, panturrilha e tornozelo; pés.

Continua sendo **simulação editorial de composição**. Não mede caimento, não ajusta tamanho e não simula tecido. O aviso fica fixo no palco: *"simulação editorial de composição · fotos reais do acervo GB · não é provador de caimento"*. Preço, estoque, tamanhos e procedência seguem **A VALIDAR**.

## Fluxo de dados
| Arquivo | Papel |
| --- | --- |
| `data/gb-fit-curation.json` | Decisão por registro, olhando a imagem: que foto do acervo veste cada produto, a parte (`top`/`bottom`) e o tipo (`hoodie`, `jacket`, `sweatshirt`, `longsleeve`, `tee`, `polo`, `jersey`, `pants`, `shorts`). As regras de exclusão estão no próprio arquivo. |
| `scripts/gerar_fit_v16.py` | Recorta, mede e grava `assets/fit/` + `fit-catalog.js`. `--qa <pasta>` grava `fit-qa.png` com as âncoras desenhadas. |
| `fit-catalog.js` | `window.GB_FIT_CATALOG` gerado. **Não editar à mão.** |
| `look-fitting.js` | Corpo do robô, encaixe das peças, motor de troca, A/B. Mantém o contrato da V09 (`GBFitting.set/compare/state`, evento `gb:look-change`). |
| `v03.js` | Seletores usam só as peças do catálogo de fit (miniaturas reais); botão **VESTIR O KIT COMPLETO** quando metade de um kit está escolhida. |

Para incluir uma peça: adicionar o registro em `data/gb-fit-curation.json` e rodar `python3 scripts/gerar_fit_v16.py --qa /tmp/qa`. Confira a folha de QA antes do commit.

## O que o gerador mede
- **Superior**:
  - linha e largura dos ombros, onde termina o capuz ou a gola;
  - centro e barra;
  - mangas longas: o punho, ponto mais baixo da faixa externa, e a direção da manga;
  - mangas curtas (`tee`, `polo`, `jersey`): **rig de manga**. A foto é separada em tronco + duas mangas pelo prolongamento das laterais do tronco. Cada manga guarda o pivô no ombro, o punho (aresta do contorno convexo) e a direção do braço, e ganha uma sombra suave embutida. Se um lado medir fora da curva, vale o ângulo do outro (só a medida; a foto nunca é espelhada).
- **Inferior**: cós (largura e centro) e boca de cada perna.

Nada é redesenhado, esticado ou pintado. A foto entra inteira, só redimensionada por igual. A manga curta é a mesma foto, girada no ombro.

## Como veste
- **Superior**: escala pela largura dos ombros (232 no viewBox 420×1000), linha dos ombros em y = 212 (`FIT.top.kindDy` corrige por tipo).
- **Mangas curtas** descem até 11° do corpo (`FIT.armTilt`). O braço sai do punho da manga: cotovelo na altura do umbigo, antebraço caindo junto ao quadril, mão relaxada.
- **Mangas longas**: a mão sai do punho, na direção da manga.
- **Inferior**:
  - bermuda: cós com 184 de largura, em y = 430;
  - calça: a barra cai no tornozelo (y ≈ 896), com o cós limitado entre 168 e 206.
  - As pernas da calça seguem a boca medida; as da bermuda ficam naturais.
- **Camadas**: corpo → pernas → inferior → braços → tronco do superior → mangas → pescoço frontal (só moletom com capuz) → cabeça. O braço passa por baixo do tronco, então nunca aparece prata no sovaco.

## Movimento
- A peça nova só entra depois de decodificada (`preload`), então não pisca. A última escolha vence (token `gen`).
- A fase (`switching-top|bottom|both`) é marcada na hora do pedido.
- A troca mantém a coreografia da V09: a peça sai cedendo, e a nova chega do seletor como fantasma e assenta.
- Braços e pernas da pose anterior somem linearmente antes que a pose nova acenda, sem sobreposição e sem "membro fantasma".
- As vizinhas no seletor são pré-carregadas só depois que o palco aparece, em tempo ocioso. `GBFitting.ready()` resolve quando tudo que foi pedido já decodificou.
- Com `prefers-reduced-motion`, a troca é instantânea.

## QA
- `node tests/e2e.mjs <url>` cobre:
  - só fotos reais (`assets/fit/`, decodificam);
  - robô completo (cabeça, 2 mãos, 2 pernas);
  - camiseta com 2 mangas giradas + braços;
  - botão do kit;
  - todos os fluxos da V09 (trocas rápidas, swipe, arraste, misturar, salvar, A/B, movimento reduzido).
- Folhas de conferência visual: vestir as 35 peças superiores e as 25 inferiores em 1440 e 390 antes de publicar.
