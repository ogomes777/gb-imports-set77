# V13 — direção de cinema

Camada `gb-cinema-v13.css` / `gb-cinema-v13.js`, carregada depois da `gb-edit-v12`. São detalhes de acabamento sobre as camadas existentes; nenhuma seção nova.

## O que faz

1. **Tema em círculo.** O sol/lua troca o tema com uma onda circular que nasce do próprio botão (View Transitions).
   - Se o aparelho demorar mais de 220 ms para fotografar a tela, a troca é direta, sem círculo.
   - A camada da transição não segura cliques.
2. **Lupa.** Sobre a foto do viewer da arara, uma lente de 220 px amplia 2,2× a **própria foto**. Nada é recriado ou pintado.
3. **Física.**
   - Botões magnéticos seguem o ponteiro alguns pixels.
   - Cards do catálogo inclinam em 3D com reflexo.
   - A grade do catálogo dobra levemente com a velocidade da rolagem.
4. **Grão de película.** Um ladrilho de ruído de 128 px pintado uma vez em canvas, com opacidade 0,06. Só se move com ponteiro fino.

## Regras

- **Cursor.** Sempre o do sistema. O cursor customizado (ponto, anel, VER/ARRASTE) saiu a pedido.
- **Animação.** Só `transform`, `translate`, `rotate` e `opacity`. A dobra da grade usa o `Ticker` do GBMotion e para ao assentar.
- **Sem `mix-blend-mode` em elemento fixo.** Ele obriga compor a página inteira a cada quadro.
- **Sem filtro SVG no grão.** Ele pesava na captura das transições.
- **Toque e movimento reduzido.** Com toque, não há lupa. Com movimento reduzido, nada disso existe: só o grão estático.
- **Testes.** Os blocos "cinema:" em `tests/e2e.mjs`.
