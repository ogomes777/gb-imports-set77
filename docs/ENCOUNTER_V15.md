# V15 — THE ENCOUNTER

Camada `gb-encounter-v15.css` / `gb-encounter-v15.js`, carregada depois da `gb-film-v14`. No editorial **NÃO É SOBRE TER. É SOBRE SER.**, o palco à direita é só de **Gui e Vitin**. O carrossel de peças e a página da peça (V12) saíram a pedido.

## Personagens e rig
- **Origem.** As camadas saem das ilustrações aprovadas via `scripts/gerar_rig_encounter.py <gui> <vitin>`. O script gera WebP desktop (1280 px de altura) e celular (720 px, `-m`), cerca de 150 KB no desktop.
  - O alfa é limpo só no ruído.
  - Nada no desenho é redesenhado: rosto, cor, roupa e proporção ficam como no arquivo.
- **Gui (mais alto, à direita).** `gb-gui-base` + `gb-gui-hand`.
  - A mão do gesto é **recortada do próprio desenho** (pele + traço marrom). O traço preto neutro do oval do logo fica na base.
  - Ela gira no pulso, com pivô em 71,38% / 37,25%, junto do relógio.
  - Na base, só o que a mão escondia foi reconstruído: a camisa, o trecho do oval (elipse ajustada ao contorno real) e um disco de pele no pulso, para o giro não abrir fresta.
- **Vitin (93% da altura, à esquerda, colado no Gui).** `gb-vitin-base` + `gb-vitin-head`.
  - A cabeça é recortada acima da gola (primeiro trecho sólido da camiseta preta) e gira na base do pescoço, com pivô em 44,94% / 21,28%.
  - A base guarda a pele real do pescoço sob o queixo: quando a cabeça sobe, aparece pescoço, não buraco.
- **Sinalização.** "ILUSTRAÇÃO", como pede o CLAUDE.md. A UI não cita marca de roupa.

## Cena (uma vez por entrada na seção)
| Tempo (desktop) | Plano | O que acontece |
|---|---|---|
| 0–0,9 s | Chegada | O palco acende: luz amarela atrás e no chão. O título faz o letreiro da V14. |
| 0,26–1,6 s | Entrada | Gui entra pela direita (3 passos longos) e Vitin pela esquerda (4 curtos e rápidos). A passada tem desaceleração, sobe e desce, troca de peso, escala de 0,92 a 1 e parada com ultrapassagem ≤2%. **Rastro:** dois ecos do próprio desenho ficam para trás e se recolhem no corpo enquanto ele freia. **Pouso:** uma onda amarela no chão, nos pés, no instante em que cada um para. **Soco de câmera** curto no segundo pouso. |
| ~1,6–2,9 s | **Cumprimento** | Os corpos se inclinam um para o outro. **Gui manda o salve forte:** a mão do gesto sobe 34° no pulso na direção do Vitin, chacoalha três vezes rápido (~1 s), passa um pouco do ponto e volta à pose dele. **Vitin responde com o queixo:** a cabeça sobe e inclina 5,5° para o Gui e volta. |
| ~2,1 s | Impacto | Um único pulso amarelo (anel e quadradinho GB) no vão entre as cabeças. O "SER." do título responde. |
| ~2,5–4,2 s | Quadro final | Aproximação discreta da câmera (3,5%). Aparece "GB IMPORTS / GUI × VITIN · ILUSTRAÇÃO". Depois, nada se move: a cena termina quando todas as animações terminam (`finished`), não por timer. |

- **Gatilho.** Metade do palco visível, depois que o muro do capítulo (V12) abre. Só recomeça se a seção sair inteira da tela. "↻ REVER" repete a cena.
- **Modo leve.** Até 4 núcleos ou economia de dados: menos passos, sem rastro, duas chacoalhadas, sem aproximação de câmera.

### O que ainda não dá (e por quê)
**Aperto de mão ou soquinho** precisa de mão do Vitin. No desenho aprovado as duas estão no bolso, então ela teria de ser desenhada do zero (braço e mão novos).

O que foi feito usa só partes que existem no desenho. Para um toque de mãos, o caminho é este:
1. A ilustração produz braço e antebraço do Vitin em camadas, com o mesmo traço.
2. Com isso, o rig recebe mais um pivô (ombro/cotovelo).
3. As poses-chave são aprovadas antes de animar.

## Engenharia
- **Movimento.** Web Animations API: compositor, só `transform`/`opacity`, sem rAF em loop. Ao fim, nenhuma animação continua rodando; o E2E confere.
- **Mídia.** As camadas só baixam a 500 px da seção. O palco só liga com as quatro decodificadas. Se faltar arquivo, o editorial fica com a foto do acervo (V03).
- **Responsivo.** O JS mede a caixa livre do palco (`--gbe-t/l/r/b`, `--gbe-hpx`):
  - no desktop, ao lado do texto;
  - empilhado, abaixo do texto ou à direita do parágrafo, o que der o maior personagem;
  - nunca cobre o texto nem corta pés ou boné.
  - O `sizes` sai dessa medida, então cada camada baixa uma vez só.
- **Movimento reduzido.** Quadro final parado.
- **Texto empilhado.** O bloco de texto do editorial não intercepta toque fora das palavras.
- **Testes.** Os blocos "encontro:" em `tests/e2e.mjs`:
  - só os dois no palco, alturas, sem cobrir texto e sem cortes;
  - REVER roda o cumprimento articulado;
  - nada animando no fim.
