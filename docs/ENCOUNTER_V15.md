# V15 — THE ENCOUNTER

Camada `gb-encounter-v15.css` / `gb-encounter-v15.js`, carregada depois da `gb-film-v14`. No editorial **NÃO É SOBRE TER. É SOBRE SER.**, o palco à direita apresenta **Gui e Vitin** antes do carrossel de peças da V12. Nada da V12 foi removido.

## Personagens
- **Origem.** Ilustrações aprovadas em `assets/characters/`. Desktop com 1280 px de altura; celular (`-m`) com 720 px. WebP com transparência, 30–75 KB cada.
  - O recorte é feito pela borda do desenho.
  - O alfa é limpo só no ruído: abaixo de 8 vira 0; acima de 244 vira 255.
  - Nada no desenho foi alterado: nem rosto, nem cor, nem proporção.
- **Gui.** Conjunto branco, boné bege, gesto com a mão. Fica à direita e é o mais alto (100%).
- **Vitin.** Conjunto preto, boné bege virado para trás, óculos. Fica à esquerda, com 93% da altura do Gui, levemente à frente e colado nele.
- **Sinalização.** O palco mostra "ILUSTRAÇÃO", como pede o CLAUDE.md. As marcas que aparecem nas roupas são do desenho aprovado; a UI não cita marca.

## Cena (uma vez por entrada na seção)
| Tempo | Plano | O que acontece |
|---|---|---|
| 0–0,9 s | Chegada | O palco acende: luz amarela atrás e no chão. O título faz o letreiro da V14. |
| 0,3–1,9 s | Entrada | Gui entra pela direita, com passada longa (3 passos). Vitin entra pela esquerda, com passada curta (4 passos), 150 ms depois. A passada tem quatro elementos:<br>• desaceleração no fim;<br>• sobe e desce a cada meio passo;<br>• troca de peso (±1°);<br>• escala de 0,92 a 1 e parada com ultrapassagem ≤2%. |
| ~2,0–3,0 s | Encontro | Os dois se inclinam um para o outro e voltam. |
| ~2,4 s | Impacto | Um único pulso amarelo (anel e quadradinho GB) no ponto de encontro. O "SER." do título responde. |
| ~2,5–4,2 s | Quadro final | Aproximação discreta da câmera (3,5%). Aparece "GB IMPORTS / GUI × VITIN · ILUSTRAÇÃO". Depois, nada se move. |

- **Gatilho.** Só começa com metade do palco na tela, e depois que o muro do capítulo (V12) abre.
  - Só recomeça se a seção sair inteira da tela; oscilação pequena de rolagem não reinicia.
  - "↻ REVER" repete a cena.
- **Modo leve.** Aparelho com até 4 núcleos ou economia de dados: menos passos, cena mais curta, sem aproximação de câmera.

### Por que não há aperto de mão
Os PNGs aprovados são achatados: braço, antebraço e mão não existem como camadas. Mover a imagem inteira para "fazer" o cumprimento deformaria o corpo e fingiria uma articulação que não existe.

Por isso a V15 faz um **microencontro**: o corpo inteiro inclina, com o pulso no ponto de contato. Um cumprimento real é a **fase 2**:
1. Separar, a partir do arquivo-fonte, braço superior, antebraço e mão de cada um, com pivôs. Cabeça, rosto, boné e tronco ficam travados.
2. Desenhar 2–3 poses-chave (aproximação, toque, separação).
3. Validar os quadros antes de animar: sprites ou rig 2D, sem regenerar rosto.

## Modos
- **A GALERA / AS PEÇAS.** É um seletor com `aria-pressed`; as setas ←/→ alternam.
  - Com a galera em cena, as peças ficam inertes, o arrasto não mexe no carrossel e o autoplay da V12 para (`GBEditCarousel.refresh()`).
  - Em AS PEÇAS, o carrossel volta inteiro: setas, arrasto, autoplay e a página da peça.
- **Troca entre modos.** Um traço amarelo cruza o palco, junto com fade e escala. Voltar para a galera mostra o quadro final; a cena inteira fica no REVER.

## Engenharia
- **Movimento.** Web Animations API: compositor, só `transform`/`opacity`, sem rAF em loop. Ao fim da cena, nenhuma animação continua rodando.
- **Mídia.** As ilustrações só baixam a 500 px da seção. O palco só liga com as duas decodificadas. Se faltar arquivo, o palco não aparece e o carrossel fica como estava.
- **Responsivo.** O JS mede a caixa livre do palco (`--gbe-t/l/r/b`, `--gbe-hpx`):
  - no desktop, ao lado do texto;
  - empilhado, escolhe entre "abaixo de todo o texto" e "à direita do parágrafo", o que der o maior personagem;
  - nunca cobre o texto nem corta pés ou boné.
  - O `sizes` das imagens sai dessa medida, então o navegador baixa um arquivo só.
- **Movimento reduzido.** Quadro final parado, sem cena e sem traço.
- **Tradução.** Os textos novos estão no dicionário do `gb-i18n.js`; "GUI × VITIN" não traduz.
- **Testes.** Os blocos "encontro:" em `tests/e2e.mjs`:
  - palco, alturas, sem cobrir texto e sem cortes;
  - pausa do carrossel;
  - REVER;
  - AS PEÇAS pelo teclado.

  Depois disso seguem os testes do carrossel V12.
