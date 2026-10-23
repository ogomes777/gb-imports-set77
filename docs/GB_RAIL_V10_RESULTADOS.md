# GB RAIL V10 — Relatório de implementação

**Branch:** `feat/gb-rail-v10` · **Preview:** https://gb-imports-set77-git-feat-gb-rail-v10-ogomes77-s-projects.vercel.app · **Produção:** não publicada, aguardando validação visual.

## O que mudou na arara
| Antes | V10 |
| --- | --- |
| 19 itens: 14 estudos SVG + 5 importados | **63 cabides** com mídia real do acervo (71 registros de origem), 0 SVG |
| Roupa flutuando abaixo do cabide | gancho apoiado na barra; gola/capuz no pescoço do cabide; bermuda e foto de kit presas por presilhas no cós; conjunto em dois cabides lado a lado |
| `translate + rotate + scale` 2D | vizinhos em 3/4 (`perspective + rotateY`) que viram de frente no foco; balanço do cabide com atraso do tecido |
| Arrasto com passo fixo | arrasto 1:1 sob o ponteiro, inércia, mola interrompível; os vizinhos abrem espaço para a peça e as fichas |
| Cores: 4 estudos SVG fictícios | fichas suspensas só para **cores fotografadas** (5 produtos, 13 cores), amostra recortada da própria foto |
| Sombra genérica (`drop-shadow`) | sombra na parede pré-calculada por peça (silhueta desfocada), sem filtro por quadro |

## Navegação, rotação, kits e cores
- **Arara.** Arraste (mouse ou toque) move 1:1; ao soltar, inércia e acomodação em mola numa peça inteira; um novo gesto interrompe do ponto atual. Setas ← →, teclado ← → Home End, roda horizontal do trackpad. Gesto vertical libera a rolagem da página (`touch-action: pan-y`) e não abre peça. Hover (mouse) vira a peça vizinha de frente e a aproxima; clique numa vizinha foca, clique na peça em foco abre o Object View.
- **Rotação.** Todas as 126 imagens são **frontais**. Por isso nenhuma peça gira para costas ou lateral (tier D): a arara faz só a transição 3/4 → frente, e o viewer tem FRENTE ativa, LATERAL e COSTAS desligadas com o motivo. Nenhum verso é espelhado ou simulado. O mouse dá um ângulo editorial leve (até ~9°) que volta à frente.
- **Kits.** CONJUNTO / SUPERIOR / INFERIOR aparecem só quando a cor escolhida tem a foto daquela parte. Os conjuntos com as duas partes isoladas são 5 (Tech Fleece cinza/azul/grafite, 005, 006, 007, 009). Os conjuntos que só têm a foto do kit mostram essa foto inteira, presa por presilhas, sem recortes inventados. Trocar de vista mantém produto e cor.
- **Cores.** Fichas suspensas no alto à direita: entram caindo presas pelo cordão, balançam e acomodam; a escolhida desce, ganha contorno e microacento amarelo GB. A troca pré-decodifica a foto nova e cruza as camadas; se a imagem falhar, a anterior fica e o erro é anunciado. A cor escolhida vale para arara, viewer, detalhe e favoritos (cada cor é o seu registro de origem). Se a nova cor não tem a vista aberta, o viewer volta ao conjunto e avisa.

## Catálogo (P0)
Auditoria completa em `docs/GB_RAIL_V10_ASSET_AUDIT.md` e `data/gb-rail-audit.csv`. As decisões foram tomadas olhando cada uma das 126 imagens, não pelo nome do arquivo.
- **63 na arara.** São 58 peças únicas + 5 grupos de cor: Tech Fleece (4), gola contraste (3), monograma degradê (2), Just Do It (2) e corta-vento (2).
- **5 vistas vinculadas.** `s-029` é a parte de cima do `010`; `s-099` e `s-079` são as partes do `009`; `s-124` é a bermuda do `007`; a foto `015` é a galeria do corta-vento.
- **7 duplicatas ocultadas.** São `s-013`, `s-103`, `s-020`, `s-120`, `s-131`, `s-077` e `s-126`. A `s-126` é provável duplicata e precisa de confirmação da GB.
- **31 fora da arara por categoria.** São bonés, tênis e chinelos, que seguem no catálogo e na busca; o viewer os abre como objeto, sem cabide.
- **9 cadastros corrigidos.** Conjuntos que estavam como avulso/extra: `002`, `007`, `008`, `009`, `010`, `011`, `012`, `013` e `014`.
- **14 estudos SVG fora da arara**, preservados no catálogo como estudo.
- Nada foi apagado; todo registro mantém o ID de origem.

## Implementado × dependente de fotos
| Implementado | Depende de mídia nova |
| --- | --- |
| Arara física, catálogo curado, arrasto/inércia/mola, foco 3/4 → frente, fichas de cor reais, kits com partes reais, Object View unificado, acessibilidade, movimento reduzido | **Costas e lateral**: precisam de fotos reais da mesma peça e cor (`views.back`/`side`). **360°**: sequência de 12–36 fotos ou modelo 3D validado. **Partes isoladas** dos kits que só têm foto do kit (002, 008, 010 inferior, 011, 012, 013 inferior, 014). **Novas cores**: foto de cada cor. **Confirmação da GB** para `s-126` e para nomes, marcas e procedência |

## Testes
- `node tests/e2e.mjs`: **613/613** na fonte, no build (`dist/`) e na **preview da Vercel** (rede real), em 1440, 1024, 768, 390 e 320 px e com movimento reduzido. São 33 cenários V10 por largura, cobrindo:
  - catálogo: sem SVG nem estudo, contagem derivada, sem repetição;
  - física: gancho na barra, gola no cabide, presilhas no cós;
  - navegação: setas, teclado, mola interrompível quadro a quadro, arrasto 1:1, inércia, gesto vertical;
  - cores: fichas reais que não cobrem a roupa nem saem da tela, troca de cor da mesma peça, peça de cor única sem fichas;
  - viewer: cor preservada, vistas só com foto, costas/lateral desligadas, nenhum verso espelhado, creme só com conjunto, Esc devolve o foco, tênis sem cabide;
  - alvos de toque e ausência de overflow;
  - regressão de catálogo, busca, favoritos, detalhe, sacola, hero, showroom, Look Studio e Fit Studio.
- `node scripts/gerar-rail-v10.mjs --check` e `node scripts/validar-crt.mjs` verdes (também no CI).
- **Desempenho.** Medido com Chromium headless sem GPU e CPU 4× mais lenta, em 10 s de arrasto contínuo e trocas de cor, comparando com a `main` atual nas mesmas condições:
  - mobile 390: 0 tarefas longas (main: 8) e quadro p50/p95 de 16,7/33 ms (main: 16,7/50);
  - desktop 1440: 6 tarefas longas, com pico de 60 ms (main: 3, pico de 64 ms), e quadro p50 de 33 ms (main: 66);
  - a primeira versão, com sombra em `blur()` CSS, tinha 82 tarefas longas e foi substituída pela sombra pré-calculada;
  - não medido em aparelho físico.
- **Standalone.** 17,7 MB, contra 17,1 MB na `main`: cada imagem continua embutida uma única vez.

## Riscos e pendências
- Não testado: aparelhos físicos, Safari/iOS real e leitor de tela real.
- 77 registros vêm de arquivos com nome de geração digital. Eles aparecem como "imagem do acervo a validar", nunca como foto comercial.
- Os agrupamentos de cor e as duplicatas são inferência visual da SET77 e precisam de confirmação da GB. Para revisar uma decisão, edite `data/gb-rail-curation.json` e rode o gerador.
