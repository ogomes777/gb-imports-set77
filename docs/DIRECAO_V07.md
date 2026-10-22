# GB Flagship / Direção V07 — "GB / IN MOTION" (nome interno, não renomeia a marca)

Jornada em sete batidas: **intriga → revelação → toque → descoberta → escolha → composição → confiança**.
Preto cria a cena, papel torna a peça comprável, amarelo é assinatura e ação.

## Núcleo de movimento — `motion-core.js` (`window.GBMotion`)
| Peça | Função |
| --- | --- |
| `Tokens` | durações (fast 180 · normal 480 · hero 820 · settle 220 · prep 90 ms), curvas e molas por massa percebida (`object`, `hanger`, `ui`, `heavy`) |
| `Prefs` | `reduced`, `coarse`, `fine`, `hoverNone`, `saveData` e `lite` (aparelho modesto) → classes `gb-reduced` / `gb-lite` |
| `Ticker` | um único `requestAnimationFrame` compartilhado; desliga sozinho quando nada anima (zero loop ocioso) |
| `Spring` | mola interrompível: toda transição parte do estado e da velocidade atuais |
| `onVisible` | `IntersectionObserver` compartilhado por configuração (autoplay, vídeo, revelações) |
| `drag` | eixo dominante, 1:1, velocidade, `pointercancel`, libera a rolagem vertical e bloqueia o clique pós-arrasto |
| `flipClone` | continuidade de objeto (FLIP) quando o navegador não tem View Transitions |
| `Media` | `ProductMedia {productId, view, src, status: official-photo/concept-study/pending, alt}` e slots de campanha |

## Cenas
- **Hero — palco de câmera:** três peças em poses persistentes num anel de profundidade (protagonista, fundo direito, fundo esquerdo). Uma única fase contínua dirige as três; preparação (recuo curto), passagem e acomodação saem da mola. Interrompível no meio, selecionável (periférica vira protagonista; protagonista abre a ficha), arrasto 1:1, setas do teclado, autoplay pausável. O título entra por uma **lâmina amarela** que varre cada linha.
- **GB Rail:** barra em catenária (parábola) e ganchos que seguem a curva; posição e balanço do cabide em duas molas; inércia curta com fricção; extremos com resistência; composição própria no mobile (uma peça protagonista, vizinhas nas bordas).
- **Catálogo → ficha:** View Transitions na ida e na volta (a peça volta ao card ao fechar por X, Escape ou voltar do navegador); FLIP como fallback; as informações da ficha entram em outro ritmo.
- **Night Showroom:** palco duplo com troca em perspectiva, luz que segue o cursor com amortecimento (estática no toque), prévia por intenção ao parar sobre a grade.
- **Chromatic Lab:** quatro camadas de cor sobre o **mesmo molde**; a anterior sai como fantasma. Rótulo fixo: *ESTUDO DE COR · NÃO É VARIANTE DISPONÍVEL*.
- **Look Studio:** áreas de encaixe, mola de assentamento, arraste da lista para o palco (mouse), comparação A/B com um look salvo.
- **GB Wipe:** lâmina preta + lâmina amarela, monograma e destino letra a letra. Só em mudança narrativa (entrar na loja/coleção).
- **Campanha:** `figure[data-media-slot]` + `campaign-map.js`. Sem mídia autorizada, composição de estudo com a curva do monograma; com mídia, foto ou vídeo mudo com poster, pausado fora da tela. Revelação em mosaico.

## Substituição de mídia
Produtos: `scripts/importar_produtos.py` → `assets-map.js` (sem mexer em layout/movimento).
Campanha: preencher `window.GB_CAMPAIGN_MEDIA['campaign-hero']` em `campaign-map.js` com `{type, src, poster, alt, credit, width, height}`.
