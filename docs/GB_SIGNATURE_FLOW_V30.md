# GB Imports | V30 Signature Flow

## Mudanças executadas
- Feixe original de fios dourados, mais flexível: velocidade temporal menor, ondulação de baixa amplitude e interação cursor/touch amortecida.
- Aparição progressiva da direita para a esquerda; cada fio é desenhado apenas da frente luminosa até a borda direita, com ponta de luz.
- A mesma posição do feixe anima o clip-path ondulado que revela o SVG original gb-monograma-amarelo-preto.svg, da direita para a esquerda.
- O highlight da assinatura também anda com a frente luminosa. Não há logo redesenhada.
- Vidro branco perolado em tela cheia com profundidade óptica, reflexo translúcido que se move suavemente, sem blur em tela cheia no mobile.
- Permanecem o filme de 5,45 s, a tela 'ENTRE NA GB.', o portal, a hero original, catálogo e Look Studio 2D.

## Testes
- Build estático e testes de first paint, desktop 1440x900 e mobile 390x844.
- Novo teste tests/intro-signature-v30.mjs observa fração de varredura diminuindo continuamente (direita para esquerda) e progresso da assinatura aumentando em sincronia.
- Testa logo oficial, interação e loop após o filme, ausência de JS errors/overflow.

## Limitações
É uma implementação Canvas2D original fiel à linguagem visual do vídeo de referência, não a biblioteca comercial React Bits Pro. Seu uso exato exige licença/registries e integração React. A taxa real de FPS deve ser validada em hardware físico, não garantida por testes headless.

Branch V30 separada, sem alterações na produção 2D.