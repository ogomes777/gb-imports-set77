# GB Fit Studio / V09

> **Evoluiu na V16 (FIT REAL)**: o manequim veste as fotos reais do acervo e virou um robô prata de proporção humana. As roupas desenhadas abaixo deixaram de ser usadas. Ver `docs/FIT_REAL_V16.md`. O contrato público e a coreografia continuam os desta página.

O Look Studio deixou de mostrar duas peças soltas. Agora há **um manequim editorial GB, de corpo inteiro e persistente**, que veste a parte superior e a inferior escolhidas. É uma **simulação editorial de composição**: não mede caimento, não ajusta tamanho, não simula tecido e não reconstrói nada em 3D. O aviso fica fixo no palco: *"simulação editorial de composição · caimento e cores reais sujeitos à foto aprovada"*.

## Arquivos
| Arquivo | Papel |
| --- | --- |
| `look-fitting.js` | Rig do manequim, geração das roupas a partir das âncoras do corpo, motor de troca, A/B. Expõe `window.GBFitting`. |
| `look-fitting.css` | Palco (luz principal, contraluz, horizonte, sombra de contato), respiração, encaixes, A/B, mobile, movimento reduzido. |
| `v03.js` | Operação do Look Studio (seletores, setas, swipe, arraste, misturar, salvar, restaurar, A/B). Com o provador montado, toda troca passa por `GBFitting.set`. |

## Como funciona
- **Rig (`RIG`)**: cadeias de articulações `[x, y, raio]` num viewBox 420×1000, com cabeça, pescoço, tronco, braços, mãos, pernas e pés. O chão fica em y = 948.
  - O corpo é uma única união de formas, recortada por `clipPath`. A luz é aplicada por cima. Assim não aparecem costuras falsas entre os membros.
- **Roupas (`FIT`)** são geradas a partir das mesmas âncoras do corpo (ombro, cotovelo, punho, cintura, quadril, joelho, tornozelo):
  - **jaqueta**: tronco, mangas longas, punhos e barra canelados, gola, zíper e bolsos;
  - **camisa**: gola V, manga curta e acabamento;
  - **calça**: cós, cordão, faixa lateral, joelhos e punhos;
  - **short**: cós, faixa lateral e barra.
  - A categoria vem do catálogo: `track` → jaqueta + calça; `short` → camisa + short. As cores vêm do próprio produto (`top`, `bottom`, `accent`, `stripe`).
- **Ordem de camadas**: corpo → inferior → superior → mãos. A barra da camisa ou da jaqueta cobre o cós.
- **Ajuste por SKU**: `window.GB_FIT_OVERRIDES = { 'gb-tr-01': { top: { hem: 540 } } }`. Use só quando houver uma referência aprovada.

## Movimento
- **Entrada (≈ 0,9–1,1 s)**: luz e figura acendem quando o palco entra na tela. Depois disso, uma respiração quase imperceptível; ela fica parada durante as trocas.
- **Troca de superior**: anima só o tronco e as mangas.
  - A peça anterior cede e some em 300 ms.
  - A nova chega como um fantasma a partir do seletor (ou do ponto onde foi solta, ou do lado da seta), encosta no corpo e assenta. O tronco leva 760 ms; as mangas, 800 ms, com 55 ms de atraso e leve rotação.
- **Troca de inferior**: anima só o quadril e as pernas (780 ms).
- **MISTURAR**: sempre troca as duas peças. A inferior entra 120 ms depois da superior.
- **Trocas rápidas**: cada nova escolha cancela as animações em curso (`commitStyles` + `cancel`) e remove o que estava saindo. Vale sempre a última escolha, sem fila e sem piscar. Chamadas no mesmo instante são agrupadas por microtask.
- **Só `transform`/`opacity`** (WAAPI). O microparallax de luz roda só com ponteiro fino, em aparelho não-`lite` e com rAF apenas durante o movimento do ponteiro.
- **`prefers-reduced-motion`**: troca instantânea, sem respiração e sem parallax.
- **Estados da cena (`.look-stage[data-phase]`)**: `entering`, `idle`, `switching-top`, `switching-bottom`, `switching-both`, `comparing`, `reduced-motion`.

## Contrato público
```js
GBFitting.set({topId, bottomId}, {changedPart, source, from:{x,y}, dir})
GBFitting.compare(true, {top, bottom})   // A/B: segundo manequim, mesma pose e escala, divisor
GBFitting.state                          // {topId, bottomId}
document.addEventListener('gb:look-change', e => e.detail) // {topId, bottomId, changedPart, source}
```
- `changedPart` aceita `top`, `bottom` ou `both`.
- `source` indica a origem da troca: `click`, `cycle`, `swipe`, `drag`, `shuffle`, `restore` ou `init`.
- Os looks salvos (`gb-v03-outfits`) guardam IDs reais e `presentationVersion: 'fit-v09'`.

## A/B
A comparação mostra o look atual (A) e o salvo (B) no mesmo corpo, mesma escala e mesma pose.
- **Divisor**: um `input range` acessível pelo teclado (8–92 %).
- **Arraste**: também dá para arrastar o divisor direto sobre o palco, com mouse ou toque.
- **Durante o A/B**: as setas ficam ocultas e o swipe não troca peças.

## Trocar a arte por fotos aprovadas
Recortes PNG não viram caimento real automaticamente, porque peças fotografadas planas não têm a pose do manequim. O caminho é:
1. Fotografar a peça vestida num manequim físico na mesma pose (frente, braços em A) ou produzir o recorte em pose equivalente.
2. Recortar a parte superior e a inferior separadamente e alinhar nas âncoras do `RIG` (ombros em y ≈ 213, cintura em y ≈ 484, tornozelos em y ≈ 897 no viewBox 420×1000).
3. Validar peça, cor e proporção com os responsáveis.
4. Só então substituir o renderizador da categoria por `<image>` dentro do mesmo grupo `.fit-garment`. As camadas, o motor de troca e o A/B continuam iguais.

Até lá, as roupas do provador são **estudos ilustrados** e continuam sinalizadas como tal.

## Limites honestos
- Não é provador virtual de caimento, não ajusta tamanho e não simula física de tecido. Não há 3D validado.
- Cores e detalhes são interpretações da arte de estudo do catálogo, não fotos.
- Os nomes das peças são nomes de trabalho; o provador não confirma venda avulsa, estoque nem disponibilidade.
