# GB Imports — V31 Fluid Cinema

## Entrega
Ribbon construído como um feixe orgânico de fios dourados, com espinha dorsal contínua, deslocamento de luz, torção independente e dinâmica amortecida. Referência visual: vídeo enviado de Interference Ribbons. A implementação continua original em Canvas2D e não é o componente proprietário React Bits Pro.

### Cinemática
- Direção da entrada preservada: da direita para a esquerda, com uma ponta luminosa acompanhando os fios.
- Revelação do SVG oficial preservada e sincronizada com a mesma frente luminosa. Mantida a intro com Glass branco perolado, tela 'ENTRE NA GB.' e a porta que abre para a hero.
- Movimento agora usa spline amostrada com duas curvaturas em S, ondulações de frequências suaves e variações de torção contínuas.
- Interações com touch/cursor deformam a spline através de molas criticamente amortecidas, evitando mudanças bruscas e retornando ao repouso naturalmente.

### Performance
- Base da spline, tangentes e normais são calculadas apenas uma vez por quadro, em 101 pontos, usando Float32Array reutilizado.
- Cada fio reutiliza as amostras de spline, em vez de chamar repetidamente as funções logísticas e derivadas. Menor custo de CPU e menos alocações transitórias.
- Qualidade adaptativa 0–2, DPR limitado por dispositivo e pausa quando a hero não está visível ou a aba é ocultada.
- A versão mobile usa reflexão estática no Glass, evitando uma camada adicional de animação transformada; mantêm-se os ribbons e sua interação.
- A fluidez final da página depende também de outras animações da landing e do hardware do dispositivo. Não alegar 60 FPS garantidos em todos os aparelhos.

### QA
- tests/intro-v28.mjs: primeiro paint coberto, tela cheia, desktop/mobile, logo oficial e entrada.
- tests/intro-signature-v30.mjs: sweep direita→esquerda e revelação no mesmo movimento.
- tests/intro-perf-v27.mjs: render ativo, pausa offscreen, retomada e acessibilidade.
- tests/intro-fluid-v31.mjs: mola de resposta ao ponteiro/toque, qualidade adaptativa, sprite oficial e custo de pintura do canvas.

### Contrato de preservação
Não alterar main nem a produção 2D. Não alterar o Look Studio, catálogo, navegação ou seções existentes. Publicar exclusivamente Preview para revisão visual.