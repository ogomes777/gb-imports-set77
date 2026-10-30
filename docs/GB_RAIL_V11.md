# GB RAIL IMMERSIVE V11: a arara dentro de uma loja

A V11 evolui a arara V10 sem substituí-la. Catálogo, estado (`GBRail`), gestos, fichas de cor e Object View continuam sendo os da V10. O que muda é o espaço em volta: barra e cabides passam a ficar no plano z=0 de uma loja com perspectiva real, e uma câmera entra nessa loja depois do capítulo **EM MOVIMENTO**.

Desde a V11.2 a loja é uma **vitrine de vidro**: o fundo e as laterais são caixilhos de alumínio com vidro, lá fora há uma rua em luz de dia (cidade fora de foco, névoa, sol baixo; no tema escuro, a cidade acesa à noite) e o piso polido atravessa o trilho do vidro e continua do lado de fora.

Arquivos: `gb-rail-v11.js`, `gb-rail-v11.css`, ajustes em `gb-rail-v10.js`/`.css` e o teste `tests/rail-immersive-v11.mjs`.

## 1. O filme

| Beat | Quando | O que se vê |
| --- | --- | --- |
| 0. Capítulo | `#rail` entra na tela | Muro amarelo da V12 com **EM MOVIMENTO**, sem mudança. A loja já espera atrás dele, no plano aberto. |
| 1. Porta | Os blocos do capítulo abrem (`.gb-chap.is-out`) | O batente claro da porta enquadra a loja de vidro: caixilhos no fundo e nas laterais (os montantes convergem), a rua lá fora, piso polido com juntas que convergem e seguem para fora, teto com dois trilhos de luz. A barra está vazia, ao fundo. Esse plano fica parado por 0,76 s. |
| 1b. A arara surge | 0,52 s depois dos blocos abrirem | Os cabides são pousados na barra um a um, da peça em foco para fora (75 ms entre pares). Cada um sobe um pouco, desce com mola curta e balança no contato. Fora de quadro, as peças já entram pousadas. |
| 1c. A loja acorda | Junto com os cabides | As fileiras de spots do teto acendem da porta para o vidro (uma a cada 0,17 s), com os cones de luz entre o vidro e a arara e as poças de luz no piso. Só opacidade (transição CSS). |
| 2. Travelling | 1,9 s no desktop, 1,65 s no toque | A câmera avança (dolly), desce (crane) e fecha um pequeno arco lateral, com easing de cinema e três passos curtos (a câmera sobe e desce poucos pixels, como quem anda). O batente passa pela câmera e sai do quadro, e o fio amarelo GB da soleira passa por baixo dela. A luz da sala sobe um pouco antes da câmera chegar. Ao chegar, a câmera passa 1–2% e assenta. |
| 3. A arara ganha vida | Logo depois de assentar | Vem a primeira rajada de ar. Cada cabide balança com a própria mola, o corpo do tecido atrasa em relação ao cabide e a barra da roupa atrasa mais. |
| 4. Exploração | Arrasto (mouse e toque), setas, teclado, roda | Tudo continua igual à V10. Durante o arrasto a sala gira levemente contra o gesto; a arara segue 1:1 sob o dedo. As peças inclinam no máximo ~4,5° (limite suave) e kits em dois cabides giram quase rígidos. As vizinhas ficam em 3/4 (26°; 20° no celular) e a peça em foco de frente; com a arara correndo, cada peça ainda gira no gancho contra o movimento, com a própria mola, e volta ao parar (limite suave abaixo de 40°: só a frente fotografada, em perspectiva). A barra do tecido flexiona por cisalhamento a partir do meio da peça (sem abrir costura), contida durante o arrasto. A peça em foco aparece espelhada no piso polido. Segurar o dedo (ou o mouse) inclina a câmera para a arara e o olhar segue o ponto tocado; soltar devolve. A câmera acompanha cada troca com um respiro lateral e volta ao eixo. A luz de foco atrás da peça recua durante o gesto e acende quando a arara assenta. |
| 4b. Troca de cor | Clique numa ficha de cor (arara ou Object View) | A foto da nova cor sobe da barra até a gola numa frente ondulada, com uma faixa de luz feita da própria foto nova (só acende onde há tecido). A foto antiga fica por baixo até a onda passar (~1 s). No fim resta uma camada só. Movimento reduzido troca na hora. |
| 5. Detalhe | Clique ou Enter na peça | O Object View e o FLIP da V10 continuam. A câmera da sala avança atrás do viewer. |
| 6. Retorno | Fechar ou Esc | A câmera sai de perto da peça e recua até o plano médio, com a mesma peça, cor e foco. |

O filme roda uma vez por carregamento. Qualquer intenção do visitante encurta o plano em 340 ms e pousa os cabides que faltam, sem nada ficar bloqueado: `pointerdown`, toque, roda, tecla, navegação, filtro ou chamada da API `GBRail`. Sem capítulo (seção já na tela ao carregar, ou link direto), o filme começa quando a arara aparece.

## 2. O que é geometria, foto, sombra, luz e física

| Camada | Natureza | Como |
| --- | --- | --- |
| Vidro do fundo, vidros laterais, piso, teto | **Geometria real** (CSS 3D) | Os planos são filhos de `.r11-room` (`perspective: P`, origem no horizonte = altura do olho). O vidro do fundo está em `translateZ(-Dw)`. O piso e o teto são planos com `rotateX(-90deg)`; as laterais usam `rotateY(90deg)`. Os montantes de alumínio ficam a cada ~1,5 m (2,4 larguras de roupa). |
| Shopping lá fora | Plano em `translateZ(-Dw - 1,1P)` | Desde a V11.4: corredor de shopping fora de foco — claraboia, mezanino com guarda-corpo de vidro e duas fileiras de vitrines acesas de outras lojas (larguras e tons determinísticos, `.r11-city b`), sem marca. Névoa clara no chão do corredor (perspectiva aérea). |
| Piso | Um plano contínuo | Desde a V11.4: porcelanato polido — placas de ~1,45 roupa (`--tile`, do JS) com rejunte fino e leve variação de tom entre placas, faixa de reflexo do vidro antes do trilho, risco especular sob cada spot e a peça em foco espelhada (`--r11-refl`). O mesmo plano segue pelo corredor do shopping. Sombras longas dos montantes do vidro em direção à câmera. |
| Pilares do corredor | Plano em `translateZ(-Dw - 0,35P)` | Pilares redondos do shopping (`.r11-trees b`) mais perto que as vitrines: parallax real através do vidro quando a câmera anda. Base exatamente no chão. |
| Luz do teto | Spots no plano do teto, cones (planos verticais atrás da arara), poças no piso | 4 fileiras × 2. Acendem em sequência no filme (`.r11-lit`). |
| Vidro | Caixilhos, brilho, faixa jateada | A faixa jateada fica à altura do olhar de quem passa na calçada. |
| Arara: barra, hastes até o teto, cabides | Plano z=0, **igual à V10** | `#railBar` e `#railItems` mudaram de pai para `.r11-rack` sem mudar de lugar. Com a câmera em repouso, o rack fica **sem transform**: geometria, hit-test e nitidez são idênticos aos da V10. |
| Batente da porta | Geometria em `z=+0,42P` | Só existe enquanto a câmera está do lado de fora (`hidden` em repouso). |
| Roupas | **Foto real** do acervo | Recortes de `assets-map.js`, sem alteração. |
| Sombra na parede | Imagem pré-calculada (V10) | `scripts/medir_midia_rail.py`. |
| Contato no piso | Uma sombra suave por peça (`.r10-floor`) | Fica na linha do piso do plano da arara (`GBRailScene.floorY`, ~0,2 roupa abaixo das barras mais longas), acompanha o balanço e some com a peça enquanto ela está no ar. |
| Reflexo no piso polido | A própria foto da peça em foco, espelhada (`.r10-refl`) | Espelhada sobre a linha do piso, esmaecendo para longe do chão, com o balanço invertido. Só a peça em foco: refletir a arara inteira com `-webkit-box-reflect` custou ~45 ms por quadro (medido) e foi descartado. |
| Poça de luz no piso | Gradiente estático no plano do piso | Desenhada sob a arara. |
| Luz | Gradientes estáticos | Leques dos trilhos na parede, faixa de luz no alto, luz de foco atrás da peça (opacidade por `data-phase`), queda nas bordas e nível de luz da chegada (`--r11-light`, só opacidade). |
| Física | Molas do `GBMotion` | Três molas por cabide em cena: cabide → corpo → barra. |

**Câmera.** A câmera é uma posição `(cx, cy, c)`. Cada plano recebe `translate3d(-cx, -cy, z - c)` e é projetado pela mesma perspectiva. Por isso a parede anda menos que a arara, o piso converge e a porta passa pela câmera: é parallax físico, não ampliação de imagem. A geometria da sala é derivada da geometria da arara (`GBRail.geometry`):

- horizonte na altura do peito das roupas;
- piso do plano da arara logo abaixo das barras mais longas; o trilho do vidro do fundo encontra o piso mais acima, por trás delas;
- teto fora de quadro no plano final;
- paredes laterais aparecendo 1,5% em cada borda.

## 3. Sistemas (`gb-rail-v11.js`)

| Sistema | Responsabilidade |
| --- | --- |
| `Perf` | Define o nível: `full` (desktop com mouse), `touch` ou `static` (movimento reduzido, saveData, aparelho modesto). Mede os quadros do próprio dolly: abaixo de ~36 fps rebaixa para `-low`, desligando o rig do tecido e o blur da sombra da barra. Sala, câmera e vento continuam. O nível de luz da chegada é escrito só na opacidade da camada que escurece (não como variável no palco inteiro, o que invalidaria o estilo de todas as peças a cada quadro). Durante o filme os planos têm `will-change: transform` (rasterizados uma vez, só reprojetados); ao chegar ele sai e tudo é redesenhado nítido. |
| `Scene` | Monta as camadas e mede a sala a partir da arara. Reage a `ResizeObserver`. |
| `Camera` | Guarda a pose. Faz o dolly com easing, a pressa ao interagir, as molas de parallax/impulso e o push/pull do viewer, e projeta cada camada. |
| `Reveal` | Observa `.gb-chap` (`MutationObserver` da classe `is-out`). Sem timer cego: só há um teto de segurança se o capítulo sumir. Nunca cria um segundo overlay. |
| `Wind` | Rajadas de 3–5 s a cada 1,8–4 s (brisa presente enquanto a arara está em tela), em sequência determinística, agendadas por `setTimeout`. Fora da tela ou com a aba oculta, não há vento. Mouse passando rápido pela arara levanta uma rajada curta (no máximo uma a cada 2,5 s). |
| `Light` / `Depth` | Nível de luz, parallax do ponteiro (mouse), impulso de câmera ao navegar e push/pull do Object View. |
| `Views` (`window.GBRailViews`) | Capacidades de vista por produto (ver §6). |

Contrato com a V10, sem segundo relógio:

- `GBRailScene.wind(t)`: nível da rajada.
- `GBRailScene.rig`: rig ligado ou não.
- `GBRailScene.reflect`: espelho da peça em foco no piso.
- `GBRail.wake()`: o palco acorda **o mesmo** loop da arara.
- `GBRail.stageHide()` / `GBRail.stageEnter(delay)`: entrada dos cabides.
- `GBRailScene.floorY`: linha do piso no plano da arara.
- `GBRail.geometry`.
- Eventos `gb:rail:navigate`, `settled`, `dragstart`, `drag`, `intent`, `open` e `close`, emitidos no `#railViewport`.

## 4. Física do tecido (`gb-rail-v10.js`)

**Roçar a peça (V11.4).** `pointermove` na arara (sem gesto de arrasto) mede a velocidade horizontal do ponteiro e
dá um impulso nas molas da peça sob ele: cabide (`th`) de leve, corpo (`fi`) pouco e barra (`he`) mais — o que dobra
o tecido é a diferença entre corpo e barra, por isso a barra recebe mais. O impulso cresce nas pontas (`|rx|`) e
embaixo (`ry`); a peça gira no gancho (`yw`) contra o lado tocado e as vizinhas recebem um sopro. A peça é medida
pela área de toque (`.r10-hit`): `.r10-swing` é um invólucro de tamanho zero. A amplitude final continua presa
pelos limites suaves do layout (barra ≤ 3,2°), então a roupa dobra inteira. Teste: "roçar a ponta da peça".

- **Molas por peça.** Cada cabide em cena tem `th` (cabide), `fi` (corpo, segue o cabide) e `he` (barra, segue o corpo). A rigidez depende da família: camiseta 112, bermuda 94, jaqueta 80, conjunto 74, com ±12% por semente do id. Moletom e conjunto oscilam menos e mais devagar que camiseta.
- **Vento.** Três senoides com frequência e fase próprias por peça. A frente da rajada atravessa a arara (fase pela posição na tela), então nada balança em sincronia.
- **Navegação.** A velocidade da arara entra como torque no cabide. Trocar de cor dá um impulso só no cabide trocado.
- **Rig 2.5D.** A mesma foto entra em dois ossos com máscaras complementares: o corpo é opaco até 64% da altura; a barra começa em 50% e gira sobre 57%. Na faixa de troca o corpo continua opaco por baixo, então não aparece faixa translúcida nem contorno duplicado. A rotação da barra fica em décimos de grau a pouco mais de 1°. Só a peça em foco e as vizinhas (no celular, só a em foco) ligam o osso da barra. Logos, estampas e costuras não são redesenhados nem deformados além desse giro rígido.
- **Inclinação 3/4.** Caiu de 24° para 15° (11° no celular) e o passo extra de 4° para 2,5°, porque a foto é só frontal. A profundidade agora vem da sala.
- **Estado.** `GBRail.state.moving` não conta vento ambiente: só gesto, mola da arara e tecido assentando depois de navegar. `GBRail.state.wind` expõe o nível.
- **Relógio.** Com rajada ou mola ativa, o loop da V10 roda; em repouso, para.

## 5. Bug da borda direita: diagnóstico e correção

**Sintoma.** Ao avançar, perto da borda direita aparecem "cópias", letras e números.

**Reprodução.** Usei Playwright em 1140, 1440 e 390 px, com 24 a 30 avanços rápidos, gravação em vídeo e instrumentação por quadro (`requestAnimationFrame`).

**Causa confirmada.** A janela de hidratação das imagens (`R = 6` no desktop, 3 no celular) era a mesma da janela visível (`R + 0,8`). Uma peça entrava em cena no mesmo instante em que recebia o `src`. O gancho (SVG inline) e a sombra pré-calculada (imagem leve) pintavam antes da foto da roupa chegar. Na borda direita, por onde a arara entra ao avançar, isso aparecia como silhuetas cinzas "duplicadas" ao lado de peças reais, e como cabides vazios.

**Medição** (com latência de 400 ms por foto, realista para CDN e celular):

| Largura | Antes | Depois |
| --- | --- | --- |
| 1140 px | 152 de 240 quadros | 0 |
| 390 px | 50 de 240 quadros | 0 |
| 1440 px, foto a 900 ms | — | 0 |

**Causa agravante.** Peças cortadas pelo quadro, com estampas de números (camisas 22, 3, 9, 10), se empilhavam no mesmo trecho do letreiro vertical legítimo `FROM THE RACK / TO THE STREET`. As letras do letreiro e as fatias de estampa se misturavam.

**Descartado.** Também verifiquei, e não são causa:

- fichas `.gb-tags`: 0–1 grupo em repouso;
- `swapFigure`: um `.hg` por peça em repouso;
- lista duplicada: sempre 63 `.r10-item`;
- script carregado duas vezes;
- `aria-live` visível;
- overflow horizontal: 0.

**Correção.**

1. Hidratação adiantada: 8 peças no desktop e 4,5 no celular, além da janela visível.
2. `.r10-item.is-ready`: gancho, sombra e foto só aparecem juntos, depois que a foto decodifica. `swapFigure` e `renderCard` mantêm o estado.
3. No palco V11, a arara esmaece por máscara estática da camada inteira só nos 36–76 px da borda (12 px no celular). Peça cortada pelo quadro deixa de virar fatia de estampa, e a faixa dos letreiros fica limpa. Os letreiros continuam: não são bug, são identidade, agora a 14 px da borda e acima da arara.
4. A composição em foco reserva 80 px de cada lado (12 px no celular) para não cair nessa faixa.

Nada foi tapado com `display:none` nem com `overflow:hidden` novo.

**Regressão.** `tests/rail-immersive-v11.mjs` (bloco "borda") repete 30 avanços com foto a 400 ms em 5 larguras e exige:

- 0 quadros com cabide ou sombra sem a foto;
- em repouso, 63 peças;
- um `.hg` por peça;
- nenhum `.is-leaving`;
- no máximo 1 grupo de fichas, com o número certo de cores;
- 0 overflow.

## 6. Vistas: 3D espacial agora, fidelidade comercial sempre

O acervo tem **só fotos frontais**. A sala é 3D; a roupa, não. Nada gira para mostrar costas, nada é espelhado e nada é gerado.

`GBRailViews.resolve(productId)` é a única porta para vistas extras. O manifesto futuro vai em `window.GB_RAIL_MULTIVIEW`:

```js
window.GB_RAIL_MULTIVIEW = {
  'gb-crt-003': {
    approved: true,                       // aprovado pela GB
    provenance: 'Sessão estúdio 2026-11', // de onde vêm as fotos
    views: { back: 'gb-crt-003:back', side: 'gb-crt-003:side' }, // arquivos reais em GB_ASSETS
    turntable: { frames: ['gb-crt-003:t00', /* … ≥ 12 quadros */] }
  }
};
```

Uma vista só existe com as três coisas: `approved === true`, procedência preenchida e o arquivo real presente em `GB_ASSETS`. O 360° exige 12 ou mais quadros reais. No Object View, os botões LATERAL e COSTAS já leem o resolvedor e ligam sozinhos quando houver foto. Hoje continuam desligados, com o motivo.

**Para multivista de verdade, cada cor de cada peça precisa de:**

- frente, 45° esquerda e direita, laterais e costas, com o mesmo enquadramento, distância focal, luz e fundo;
- 12 a 36 quadros em giro para 360°, ou um modelo 3D aprovado do produto exato.

Os arquivos entram via `scripts/importar_produtos.py` → `assets-map.js`, como hoje.

## 7. Responsividade, acessibilidade e degradação

- **320–1440 px.** A sala é medida a partir da arara. No celular, a perspectiva é mais forte, o dolly mais curto (1,65 s), não há parallax de ponteiro e o rig fica só na peça em foco.
- **`prefers-reduced-motion`.** Sem capítulo (a V12 já desliga). A loja aparece pronta, sem dolly, vento, rig, balanço ou impulso de câmera. A navegação é completa.
- **saveData / aparelho modesto** (`GBMotion.Prefs.lite`). Mesmo resultado do reduzido: loja pronta, estática.
- **Toque.** Continua `touch-action: pan-y`: a rolagem vertical nunca é capturada.
- **Teclado, foco, ARIA, alvos de 44 px.** Iguais aos da V10. A sala é `aria-hidden` e `pointer-events: none`; só a arara recebe eventos.
- **Tema claro/escuro.** Claro é ORIGEM (loja de papel e luz de dia). Escuro é SINAL: loja à noite, luz quente nos trilhos e monograma invertido.
- **Movimento.** Só `transform` e `opacity` animam. Sombras e luzes são gradientes e imagens estáticas.

## 8. QA

```bash
node scripts/build.mjs
```

```bash
(cd dist && python3 -m http.server 8081)
```

```bash
node tests/rail-immersive-v11.mjs http://localhost:8081/
```

```bash
node tests/e2e.mjs http://localhost:8081/
```

Os testes `nav-adaptive-v39`, `experience-v40` e `intro-*` esperam o build servido em `http://127.0.0.1:8080/`.

O teste V11 cobre:

- capítulo preservado;
- câmera parada até os blocos abrirem;
- dolly contínuo, sem salto, medido quadro a quadro;
- duração e luz;
- plano final idêntico ao da V10;
- piso em perspectiva abaixo das roupas;
- vento fora de sincronia que para entre rajadas;
- rig só no foco;
- setas, Home e End;
- Object View com push/pull;
- os quatro filtros;
- letreiros na faixa limpa;
- overflow;
- erros de JavaScript;
- interrupção durante o dolly;
- bug da borda;
- movimento reduzido;
- capacidades de vista.

O relatório final da tarefa traz os números medidos e as falhas legadas, separadas das regressões.
