# GB Fit Studio / V17 — GB UNIT

Evolução da V16 (FIT REAL). O manequim deixou de ser um robô prata genérico. Agora é o **GB UNIT**: um robô de proporção humana e musculatura de atleta, com armadura preta (carbono) e placas amarelo GB.
- **Capacete:** faixa central preta e o **monograma GB oficial** (`assets/brand/gb-monograma-preto.svg`, usado como imagem e nunca redigitado).
- **Rosto:** máscara preta espelhada com olhos acesos e grade da boca.
- **Corpo:** pescoço com cabos, luvas com placas, antebraços blindados, joelheiras, caneleiras e bota GB.

Ele veste o look completo com **fotos reais do acervo**: superior, inferior, **tênis** e **boné**. Continua sendo simulação editorial de composição (o aviso segue fixo no palco). Preço, estoque, tamanhos, marcas e procedência seguem **A VALIDAR**.

## O que mudou no encaixe
- **Pescoço dentro da roupa**:
  - cada superior tem `collar` em `data/gb-fit-curation.json`, marcado olhando a foto: centro e meia-largura internas, borda da gola de trás (`yb`) e da frente (`yf`, ou o ponto do V / início do zíper);
  - o pescoço é desenhado **por cima da peça**: cobre o forro, a etiqueta e as costas da gola, e termina exatamente na gola da frente, com sombra;
  - no moletom com capuz, o pescoço sai de dentro do capuz.
- **Bermuda encaixada**:
  - a coxa enche ~88% da boca de cada perna medida e afina até o joelho, como um quadríceps;
  - a sombra interna da boca fica atrás da perna;
  - o cós é 178 no viewBox.
- **Braços** (manga curta): mais grossos, com a boca da manga em sombra. Placas amarelas no bíceps e no antebraço, e cotovelo com anel GB.
- **Tênis**:
  - as fotos do acervo mostram o **par de lado**, com um pé sobre o outro;
  - na curadoria, `cut` é a linha que separa o pé da frente (do calcanhar, por cima do cano e dos cadarços até a ponta), `toe` diz para onde aponta a ponta e `collar` marca a boca do tênis;
  - o gerador recorta só esse pé e o manequim usa esse mesmo pé real **nos dois pés**, apontando para o mesmo lado (pose de 3/4). Nada espelhado ou pintado;
  - a canela entra na boca do tênis e a sola pisa o chão.
- **Boné**:
  - recorte inteiro do acervo; `crown` marca a copa (largura na base, base e topo);
  - a copa assenta no capacete e a aba deixa os olhos acesos à vista.
  - Fora: 025 (perfil puro) e 077 (duplicata do 075).
- **Sem tênis / sem boné** é uma opção: o robô volta à bota GB / cabeça livre.

## Interface
- Configurador com **01 PARTE SUPERIOR · 02 PARTE INFERIOR · 03 TÊNIS · 04 BONÉ**.
- Tênis e boné têm a opção 00 (BOTA GB / SEM BONÉ). Tênis inicial: 052.
- **MISTURAR** sorteia superior + inferior + tênis, e boné na metade das vezes.
- Salvar, restaurar e o A/B guardam e mostram tênis e boné.
- O resumo e os links "VER TÊNIS / VER BONÉ" seguem a escolha.

## Contrato (`GBFitting`)
- `set({topId,bottomId,shoeId,capId}, opts)`:
  - tênis e boné aceitam `null` (sem);
  - o que não vier no objeto fica como está;
  - `state` traz as quatro partes.
- Camadas, de trás para a frente:
  1. corpo
  2. pernas
  3. tênis
  4. inferior
  5. braços
  6. tronco do superior
  7. mangas
  8. pescoço
  9. cabeça
  10. boné
  11. feixe de varredura
- As pernas são **refeitas** quando muda o inferior ou o tênis (`swapLegs`). A troca é sem sobreposição, junto da peça que chega.
- O evento `gb:look-change` traz `shoeId`/`capId`.

## Imersão
- **Ligar**: quando o palco entra em cena, os olhos acendem com uma piscada de partida, e um feixe amarelo varre o corpo de cima a baixo (1,3 s).
- **Varredura ao vestir**: a cada troca, o feixe atravessa só a faixa do corpo da peça que chegou (superior, inferior, tênis ou boné). Em troca múltipla, varre o corpo todo.
- **Restrições**:
  - só `transform`/`opacity`;
  - nada roda parado;
  - movimento reduzido mostra os olhos acesos sem piscar e sem feixe;
  - aparelho modesto (`gb-lite`) também sem feixe.

## Regerar
`python3 scripts/gerar_fit_v16.py --qa <pasta>` gera, para superiores, inferiores, tênis e bonés:
- `assets/fit/`
- `fit-catalog.js`, versão `fit-v17`

Confira na folha de QA o recorte de cada tênis (pé inteiro, sem sobra do outro pé) e a copa de cada boné.
