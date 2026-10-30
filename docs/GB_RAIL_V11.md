# GB RAIL IMMERSIVE V11: a arara dentro de uma loja

A V11 evolui a arara V10 sem substituí-la. Catálogo, estado (`GBRail`), gestos, fichas de cor e Object View continuam sendo os da V10. O que muda é o espaço em volta: barra e cabides passam a ficar no plano z=0 de uma sala com perspectiva real, e uma câmera entra nessa loja depois do capítulo **EM MOVIMENTO**.

Arquivos: `gb-rail-v11.js`, `gb-rail-v11.css`, ajustes em `gb-rail-v10.js`/`.css` e o teste `tests/rail-immersive-v11.mjs`.

## 1. O filme

| Beat | Quando | O que se vê |
| --- | --- | --- |
| 0. Capítulo | `#rail` entra na tela | Muro amarelo da V12 com **EM MOVIMENTO**, sem mudança. A loja já espera atrás dele, no plano aberto. |
| 1. Porta | Os blocos do capítulo abrem (`.gb-chap.is-out`) | O batente grafite da porta enquadra a loja: parede ao fundo, piso de cimento com juntas que convergem, teto com dois trilhos de luz e paredes laterais. A arara aparece pequena, ao fundo, e a sala está com a luz baixa. Esse plano fica parado por 0,76 s. |
| 2. Travelling | 1,9 s no desktop, 1,65 s no toque | A câmera avança (dolly), desce (crane) e fecha um pequeno arco lateral, com easing de cinema. O batente passa pela câmera e sai do quadro, e o fio amarelo GB da soleira passa por baixo dela. A luz da sala sobe um pouco antes da câmera chegar. |
| 3. A arara ganha vida | Logo depois de assentar | Vem a primeira rajada de ar. Cada cabide balança com a própria mola, o corpo do tecido atrasa em relação ao cabide e a barra da roupa atrasa mais. |
| 4. Exploração | Arrasto, setas, teclado, roda | Tudo continua igual à V10. A câmera acompanha cada troca com um respiro lateral e volta ao eixo. A luz de foco atrás da peça recua durante o gesto e acende quando a arara assenta. |
| 5. Detalhe | Clique ou Enter na peça | O Object View e o FLIP da V10 continuam. A câmera da sala avança atrás do viewer. |
| 6. Retorno | Fechar ou Esc | A câmera sai de perto da peça e recua até o plano médio, com a mesma peça, cor e foco. |

O filme roda uma vez por carregamento. Qualquer intenção do visitante encurta o plano em 340 ms e é atendida na hora, sem nada ficar bloqueado: `pointerdown`, roda, tecla ou navegação. Sem capítulo (seção já na tela ao carregar, ou link direto), o filme começa quando a arara aparece.

## 2. O que é geometria, foto, sombra, luz e física

| Camada | Natureza | Como |
| --- | --- | --- |
| Parede, piso, teto, paredes laterais | **Geometria real** (CSS 3D) | Os planos são filhos de `.r11-room` (`perspective: P`, origem no horizonte = altura do olho). A parede está em `translateZ(-Dw)`. O piso e o teto são planos com `rotateX(-90deg)`; as laterais usam `rotateY(90deg)`. |
| Arara: barra, hastes até o teto, cabides | Plano z=0, **igual à V10** | `#railBar` e `#railItems` mudaram de pai para `.r11-rack` sem mudar de lugar. Com a câmera em repouso, o rack fica **sem transform**: geometria, hit-test e nitidez são idênticos aos da V10. |
| Batente da porta | Geometria em `z=+0,42P` | Só existe enquanto a câmera está do lado de fora (`hidden` em repouso). |
| Roupas | **Foto real** do acervo | Recortes de `assets-map.js`, sem alteração. |
| Sombra na parede | Imagem pré-calculada (V10) | `scripts/medir_midia_rail.py`. |
| Contato e poça de luz no piso | Gradiente estático no plano do piso | Desenhado sob a arara. |
| Luz | Gradientes estáticos | Leques dos trilhos na parede, faixa de luz no alto, luz de foco atrás da peça (opacidade por `data-phase`), queda nas bordas e nível de luz da chegada (`--r11-light`, só opacidade). |
| Física | Molas do `GBMotion` | Três molas por cabide em cena: cabide → corpo → barra. |

**Câmera.** A câmera é uma posição `(cx, cy, c)`. Cada plano recebe `translate3d(-cx, -cy, z - c)` e é projetado pela mesma perspectiva. Por isso a parede anda menos que a arara, o piso converge e a porta passa pela câmera: é parallax físico, não ampliação de imagem. A geometria da sala é derivada da geometria da arara (`GBRail.geometry`):

- horizonte na altura do peito das roupas;
- encontro parede/piso logo abaixo das barras mais longas;
- teto fora de quadro no plano final;
- paredes laterais aparecendo 1,5% em cada borda.

## 3. Sistemas (`gb-rail-v11.js`)

| Sistema | Responsabilidade |
| --- | --- |
| `Perf` | Define o nível: `full` (desktop com mouse), `touch` ou `static` (movimento reduzido, saveData, aparelho modesto). Mede os quadros do próprio dolly: abaixo de ~36 fps rebaixa para `-low`, desligando o rig do tecido e o blur da sombra da barra. Sala, câmera e vento continuam. |
| `Scene` | Monta as camadas e mede a sala a partir da arara. Reage a `ResizeObserver`. |
| `Camera` | Guarda a pose. Faz o dolly com easing, a pressa ao interagir, as molas de parallax/impulso e o push/pull do viewer, e projeta cada camada. |
| `Reveal` | Observa `.gb-chap` (`MutationObserver` da classe `is-out`). Sem timer cego: só há um teto de segurança se o capítulo sumir. Nunca cria um segundo overlay. |
| `Wind` | Rajadas de 2,4–3,8 s a cada 4,5–8 s, em sequência determinística, agendadas por `setTimeout`. Fora da tela ou com a aba oculta, não há vento. Mouse passando rápido pela arara levanta uma rajada curta (no máximo uma a cada 2,5 s). |
| `Light` / `Depth` | Nível de luz, parallax do ponteiro (mouse), impulso de câmera ao navegar e push/pull do Object View. |
| `Views` (`window.GBRailViews`) | Capacidades de vista por produto (ver §6). |

Contrato com a V10, sem segundo relógio:

- `GBRailScene.wind(t)`: nível da rajada.
- `GBRailScene.rig`: rig ligado ou não.
- `GBRail.wake()`: o palco acorda **o mesmo** loop da arara.
- `GBRail.geometry`.
- Eventos `gb:rail:navigate`, `settled`, `dragstart`, `open` e `close`, emitidos no `#railViewport`.

## 4. Física do tecido (`gb-rail-v10.js`)

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
