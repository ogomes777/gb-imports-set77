# GB Imports | Flagship

Protótipo navegável da **GB Imports**, desenvolvido pela **SET77 LABS**. Experiência editorial + loja rápida, **não transacional**: não há preço, estoque, pagamento ou pedido real.

- **Produção (branch `main`):** https://gb-imports-set77.vercel.app
- **Staging:** cada push em outra branch gera um preview na Vercel (link no PR / painel da Vercel).
- **Plataforma:** Vercel com integração GitHub. Build estático sem dependências (`node scripts/build.mjs` → `dist/`).

## Estrutura
```text
index.html               marcação da página (todas as seções)
styles.css · main.js     núcleo: tokens, catálogo, busca, filtros, detalhe, sacola, favoritos
v03.css · v03.js         hero editorial, Look Studio, filme em 3 cenas, entrada de loja
v04.css · v04.js         GB Rail (arara física), viewer, Night Showroom, Chromatic Lab
v05.css · v05.js         identidade V1 (ORIGEM / TRAMA / SINAL), monograma vetorial
v06.css · v06.js         capítulos do hero (autoplay pausável), GB Wipe, header adaptativo
motion-core.js           núcleo de movimento V07 (tokens, molas, relógio rAF único, gesto, FLIP, mídia)
v07.css · v07.js         palco de câmera do hero, slots de campanha, cenas V07
v08.css · v08.js         viewer de peça (Object View) e cores dentro da peça
look-fitting.css · .js   V09 GB Fit Studio: manequim de corpo inteiro que veste o look (docs/FIT_STUDIO_V09.md)
gb-rail-v10.css · .js    V10 GB RAIL: arara física, fichas de cor reais, Object View (docs/GB_RAIL_V10_RESULTADOS.md)
rail-catalog.js          catálogo curado da arara (GERADO por scripts/gerar-rail-v10.mjs)
assets-map.js            vínculo produto → vista → foto real (gerado pelo importador)
campaign-map.js          mídia de campanha autorizada por slot (vazio = composição de estudo)
assets/brand/            monograma e assinaturas SVG/PNG da proposta V1 (em revisão)
assets/products/         fotos reais em WebP (vazio até a importação)
data/catalogo-fontes.json   14 posições de vitrine + 4 do acervo, status por item
data/manifesto-ativos.json  flags foto_real / arte_estudo / pendente por item e vista
data/gb-rail-curation.json  decisão visual V10 para os 114 registros (arara / variante / vista / duplicata / fora)
data/gb-media-meta.json     medição dos recortes (caixa útil, pescoço, presilhas, hash)
data/gb-rail-audit.csv      auditoria por registro (também em docs/GB_RAIL_V10_ASSET_AUDIT.md)
scripts/build.mjs        build com hash + dist/gb-standalone.html (abre offline)
scripts/importar_produtos.py importa recortes PNG → WebP e atualiza mapa/manifesto
scripts/medir_midia_rail.py  mede recortes e gera sombras da arara (Pillow)
scripts/gerar-rail-v10.mjs   gera/valida o catálogo da arara (--check falha se algo mudou)
tests/e2e.mjs            QA automatizado (Playwright) em 5 larguras + movimento reduzido (~100 verificações por largura)
docs/                    arquitetura, direção V07, QA, pendências de publicação
```

## Rodar
```bash
npx http-server . -p 8080 -c-1        # fonte direto, sem build
node scripts/build.mjs                # gera dist/ (o que a Vercel publica)
npx http-server dist -p 8081 -c-1     # confere o build
node tests/e2e.mjs http://localhost:8081/   # QA (precisa do pacote playwright + Chromium)
```
`dist/gb-standalone.html` é um arquivo único que abre com duplo clique, sem servidor.

## Colocar as fotos reais dos produtos
1. Reúna os recortes autorizados (PNG com fundo transparente) numa pasta local.
2. Nomeie pelo ID do catálogo e vista: `gb-tr-01-combo.png`, `gb-tr-01-top.png`, `gb-tr-01-bottom.png` (idem `gb-sh-01…08`, `gb-ex-01…04`).
3. `python3 scripts/importar_produtos.py /pasta/dos/recortes` (use `--dry-run` para só validar).
4. Confira peça, vista e cor de cada foto; depois `node scripts/build.mjs` e publique.

Com foto, a mesma peça troca automaticamente no hero, card, arara, showroom, detalhe, look studio e busca; vistas sem foto deixam de aparecer na galeria (sem misturar foto e ilustração). As peças do acervo `gb-ex-*` só entram na vitrine quando têm foto.

## Limites deste protótipo
- O acervo CRT01 (114 registros, 126 imagens, algumas geradas digitalmente) está integrado como **imagem do acervo a validar**; as 14 ilustrações originais seguem como **estudos** e ficam fora da arara.
- Todas as imagens atuais são frontais: a arara e o viewer não oferecem lateral, costas nem 360° até existirem fotos reais desses ângulos.
- Nomes de produto são **nomes de trabalho**: não confirmam marca, licença ou procedência.
- Preço, estoque, tamanhos, entrega e pagamento aparecem como "a confirmar". A "seleção de interesse" copia uma mensagem para o Direct da GB; não é pedido.
- A identidade V1 (monograma, ORIGEM/TRAMA/SINAL, grafia IMPORTS/IMPORTTS) é proposta em revisão.
- O material privado (gravações de referência, manual em PDF, briefing, skills) **não** fica neste repositório público.

---
Direção criativa e desenvolvimento: SET77 LABS.
