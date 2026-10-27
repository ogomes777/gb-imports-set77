# V13 — direção de cinema

Camada `gb-cinema-v13.css` / `gb-cinema-v13.js`, carregada depois da `gb-edit-v12`. São detalhes de acabamento sobre as camadas existentes; nenhuma seção nova.

## O que faz

1. **Tema em círculo.** O sol/lua troca o tema com uma onda circular que nasce do próprio botão (View Transitions).
   - Se o aparelho demorar mais de 220 ms para fotografar a tela, a troca é direta, sem círculo.
   - A camada da transição não segura cliques.
2. **Cursor de cinema** (só mouse). Um ponto amarelo e um anel que segue com atraso.
   - Sobre peça, categoria e vitrine, o anel vira um disco amarelo com "VER".
   - Sobre a arara, o hero e o editorial, vira "ARRASTE".
   - Sobre link e botão, cresce.
   - Some em campos de texto, que ficam com o cursor do sistema.
3. **Lupa.** Sobre a foto do viewer da arara e da página da peça, uma lente de 220 px amplia 2,2× a **própria foto**. Nada é recriado ou pintado.
4. **Física.**
   - Botões magnéticos seguem o ponteiro alguns pixels.
   - Cards do catálogo inclinam em 3D com reflexo.
   - A grade do catálogo dobra levemente com a velocidade da rolagem.
5. **Grão de película.** Um ladrilho de ruído de 128 px pintado uma vez em canvas, com opacidade 0,06. Só se move com ponteiro fino.

## Regras

- **Animação.** Só `transform`, `translate`, `rotate` e `opacity`. O anel do cursor e a dobra da grade usam o `Ticker` do GBMotion e param ao assentar.
- **Sem `mix-blend-mode` em elemento fixo.** Ele obriga compor a página inteira a cada quadro. O cursor usa contorno duplo, que lê em qualquer fundo.
- **Sem filtro SVG no grão.** Ele pesava na captura das transições.
- **Toque e movimento reduzido.** Com toque, não há cursor nem lupa. Com movimento reduzido, nada disso existe: só o grão estático.
- **Testes.** Os blocos "cinema:" em `tests/e2e.mjs`.
