# GB Imports | Sistema de navegação V39

## Objetivo
Incorporar à GB Imports a qualidade de navegação do site Street Goose 034, mas sem reutilizar código, nomes, textos, cores de marca ou simular funções comerciais que a GB ainda não possui.

## Entrega
- Navegação em ilha Glass com compactação progressiva durante a rolagem.
- Cores contextuais por seção e pelo estágio do hero: pearl, gold, ice e graphite. Nenhuma cor de copy da landing é alterada.
- Lockup otimizado: símbolo amarelo oficial GB + lettering IMPORTS, sem duplicação GB.
- Tema sol/lua permanece exposto na navbar. Configurações incluem Claro, Escuro e Sistema, com opções de idioma conectadas ao seletor existente.
- Painel Minha GB com favoritos, seleção de interesse, Look Studio e Shop usando o estado real no navegador; sem fingir login, compra, pontos ou ranking.
- Busca ampliada em tela inteira, inspirada na experiência de referência: X de fechar, fonte grande, sugestões comerciais e resultados do catálogo existente. A abertura exibe 8 destaques para não montar 102 cards e pesquisa o acervo inteiro quando houver termo.
- Mobile: menu com acesso a pesquisa, favoritos, seleção, Look Studio, tema e idioma. Controles nativos de sacola/favoritos preservados.
- ESC, Ctrl+K, backdrops e rotas de produtos usam handlers originais de main.js.

## QA local
- Build estático executado com sucesso; os dez chunks sequenciais, o intro separado e o HTML offline continuam gerados.
- Playwright 1440×900 e 390×844: navbar, ambient showroom ice, modo compacto, tema escuro, idioma EN, pesquisa 'Manchester', resultados reais, fechamento e ausência de overflow/JS exceptions.
- A suíte antiga completa tests/e2e.mjs não concluiu no sandbox porque o browser foi fechado durante sua execução; não alegar aprovação dessa suíte. CI dedicado à navegação foi criado.

## Limites e próximos sistemas
A Street Goose possui contas autenticadas, pedidos, histórico de XP/ranking, cupons e outras rotas com backend. A GB atualmente é um catálogo conceitual não transacional. Tais recursos exigem produto, identidade, fluxo de dados e backend próprios antes de serem disponibilizados; esta entrega não os falsifica. O projeto de nav fica em preview até a aprovação, sem publicar em produção.
