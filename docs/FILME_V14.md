# V14 — filme puro

Camada `gb-film-v14.css` / `gb-film-v14.js`, carregada depois da `gb-cinema-v13`. Ela evolui o que já existe; não cria seções.

## O que faz

1. **Letreiros.** Os títulos usam a revelação por linha da V06 (`.split-ready .hl`). Agora cada linha entra sob uma luz que a varre: amarela, ou tinta nas seções amarelas.
   - A linha sobe com um leve ângulo que se acerta.
   - A V14 estende isso aos títulos que não tinham: arara, categorias e SEU PRÓXIMO CAPÍTULO.
   - Em seção coberta pelo muro do capítulo (V12), o letreiro espera o muro abrir (`gbf-hold`). Há uma trava de segurança de 9 s.
   - As linhas são montadas com os nós de texto originais, então a tradução continua funcionando.
   - O ABAIXO DE ZERO fica sem a luz, porque tem o congelamento próprio.
2. **Profundidade por rolagem.** Usa as animações por rolagem nativas do CSS (`animation-timeline: view()`), que rodam fora da thread principal.
   - Os cards do catálogo sobem do fundo.
   - O objeto das categorias flutua em paralaxe.
   - O monograma SVG sobe como cartela final no rodapé.
   - Sem suporte do navegador, tudo aparece parado.
3. **Hero em camadas** (só mouse). Marca d'água, peças e texto se movem em profundidades diferentes seguindo o ponteiro, com um canhão de luz no mouse.
   - O loop usa o `Ticker` do GBMotion, só com o hero em tela, e para ao assentar.

## Regras

- **Animação.** Só `transform`, `translate`, `scale` e `opacity`.
- **Movimento reduzido.** Desliga a luz, o canhão, as camadas e as animações por rolagem. Os títulos não são divididos.
- **Testes.** Os blocos "filme:" em `tests/e2e.mjs`.
