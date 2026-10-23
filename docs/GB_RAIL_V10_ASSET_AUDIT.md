# GB RAIL V10 — Auditoria de ativos

> Gerado por `node scripts/gerar-rail-v10.mjs` a partir de `data/gb-rail-curation.json` (decisões tomadas olhando cada imagem) e `data/gb-media-meta.json` (medição dos arquivos). Não editar à mão. Detalhe completo: `data/gb-rail-audit.csv`.

## Resumo
| Item | Quantidade |
| --- | ---: |
| Registros importados auditados | 114 |
| Arquivos de mídia conferidos (existe, WebP íntegro, hash e dimensão iguais à medição, com transparência) | 126 |
| **Cabides na arara** (produto canônico) | **63** |
| Registros de origem representados na arara | 71 |
| Grupos com variantes reais de cor | 5 (13 cores) |
| Vistas vinculadas a outro produto (mesma peça) | 5 |
| Duplicatas ocultadas da arara | 7 |
| Fora da arara por categoria (bonés, calçados, chinelos) | 31 |
| Conjuntos com superior e inferior isolados | 5 |
| Estudos SVG `gb-tr-*`/`gb-sh-*` | 14 fora da arara (seguem no catálogo como estudo) |

## Vistas e rotação
Todas as 126 mídias são **frontais**. Não há arquivo de costas, lateral, sequência de órbita ou modelo 3D. Por isso, para todas as peças: `canTurnBack=false`, `canTurnSide=false`, `canRotate360=false` (tier D). O viewer oferece só a frente; COSTAS e LATERAL aparecem como "sem foto". Algumas camisas de futebol trazem o verso dobrado dentro da mesma foto: isso não vira vista de costas.

## Variantes reais
- **Conjunto tech fleece** (CINZA = `gb-crt-001`, CREME = `gb-crt-002`, AZUL = `gb-crt-003`, GRAFITE = `gb-crt-004`). Mesmo molde nas quatro fotos: costura em chevron no peito, bolso com zíper na manga, punhos e calça jogger iguais; muda só a cor.
- **Jaqueta corta-vento** (BRANCA = `gb-crt-s-026`, PRETA = `gb-crt-s-027`). Mesmo anoraque nas duas cores; a foto gb-crt-015 mostra as duas versões lado a lado.
- **Camiseta gola contraste** (BRANCA = `gb-crt-s-001`, VERMELHA = `gb-crt-s-002`, PRETA = `gb-crt-s-008`). Mesmo modelo fotografado em três cores: gola e barra da manga em cor oposta, etiqueta e caimento iguais.
- **Camiseta monograma degradê** (BRANCA = `gb-crt-s-007`, PRETA = `gb-crt-s-014`). Mesma estampa de monograma que se dissolve do ombro para o peito, em base branca e base preta.
- **Camiseta Just Do It** (PRETA = `gb-crt-s-019`, BRANCA = `gb-crt-s-021`). Mesma estampa e posição do lettering, em preto e em branco.

## Correções de cadastro aplicadas no site
- `gb-crt-002`: categoria → `track`, unidade → conjunto. Foto mostra jaqueta + calça (conjunto agasalho), estava como avulso/extra.
- `gb-crt-007`: unidade → conjunto. Conjunto camiseta + bermuda com as duas partes isoladas (s-124 vinculada).
- `gb-crt-008`: categoria → `short`, unidade → conjunto. Foto mostra camiseta + bermuda (conjunto), estava como avulso/extra.
- `gb-crt-009`: categoria → `short`, unidade → conjunto. Polo + bermuda (conjunto) com as duas partes isoladas (s-099 e s-079).
- `gb-crt-010`: unidade → conjunto. Moletom com zíper + bermuda (conjunto); parte superior isolada em s-029.
- `gb-crt-011`: categoria → `track`, unidade → conjunto. Moletom + calça (conjunto agasalho), estava como avulso/extra.
- `gb-crt-012`: categoria → `track`, unidade → conjunto. Jaqueta + calça (conjunto agasalho), estava como avulso/extra.
- `gb-crt-013`: unidade → conjunto. Moletom + bermuda jeans (conjunto).
- `gb-crt-014`: categoria → `track`, unidade → conjunto. Jaqueta + calça (conjunto agasalho), estava como avulso/extra.

Vistas vinculadas: `gb-crt-010` + top `gb-crt-029.webp`; `gb-crt-009` + bottom `gb-crt-079.webp`, top `gb-crt-099.webp`; `gb-crt-007` + bottom `gb-crt-124.webp`.

## Origem das imagens
77 registros vêm de arquivos com nome de geração digital (`Imagem do ChatGPT…`, `image-gen…`). Eles entram na arara como **imagem do acervo a validar**, nunca como foto comercial confirmada. O catálogo de origem já declara: "algumas geradas digitalmente".

## Decisão por registro
| Origem | Nome de trabalho | Cadastro (antes → conferido) | Decisão | Cabide / vínculo | Motivo |
| --- | --- | --- | --- | --- | --- |
| `gb-crt-001` | Conjunto sportswear cinza | track / conjunto | VARIANTE | `gb-v10-tech-fleece` | Cor real (CINZA) de Conjunto tech fleece: Mesmo molde nas quatro fotos: costura em chevron no peito, bolso com zíper na manga, punhos e calça jogger iguais; muda só a cor. |
| `gb-crt-002` | Conjunto sportswear creme | extra / avulso → **track / conjunto** | VARIANTE | `gb-v10-tech-fleece` | Cor real (CREME) de Conjunto tech fleece: Mesmo molde nas quatro fotos: costura em chevron no peito, bolso com zíper na manga, punhos e calça jogger iguais; muda só a cor. |
| `gb-crt-003` | Conjunto sportswear azul | track / conjunto | VARIANTE | `gb-v10-tech-fleece` | Cor real (AZUL) de Conjunto tech fleece: Mesmo molde nas quatro fotos: costura em chevron no peito, bolso com zíper na manga, punhos e calça jogger iguais; muda só a cor. |
| `gb-crt-004` | Conjunto sportswear grafite | track / conjunto | VARIANTE | `gb-v10-tech-fleece` | Cor real (GRAFITE) de Conjunto tech fleece: Mesmo molde nas quatro fotos: costura em chevron no peito, bolso com zíper na manga, punhos e calça jogger iguais; muda só a cor. |
| `gb-crt-005` | Conjunto preto com lettering neon | short / conjunto | NA ARARA | `gb-crt-005` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-006` | Moletom e calça branca | track / conjunto | NA ARARA | `gb-crt-006` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-007` | Camiseta e short Nike World | short / avulso → **short / conjunto** | NA ARARA | `gb-crt-007` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-008` | Camiseta e short cinza | extra / avulso → **short / conjunto** | NA ARARA | `gb-crt-008` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-009` | Polo areia e short marinho | extra / avulso → **short / conjunto** | NA ARARA | `gb-crt-009` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-010` | Conjunto de moletom cinza | extra / avulso → **extra / conjunto** | NA ARARA | `gb-crt-010` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-011` | Conjunto agasalho branco | extra / avulso → **track / conjunto** | NA ARARA | `gb-crt-011` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-012` | Conjunto agasalho preto e branco | extra / avulso → **track / conjunto** | NA ARARA | `gb-crt-012` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-013` | Moletom e bermuda preto | extra / avulso → **extra / conjunto** | NA ARARA | `gb-crt-013` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-014` | Conjunto esportivo preto | extra / avulso → **track / conjunto** | NA ARARA | `gb-crt-014` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-015` | Jaquetas corta-vento preta e branca | extra / avulso | VISTA VINCULADA | → `gb-v10-corta-vento` | Foto conjunta das variantes branca e preta do mesmo corta-vento; vira galeria do produto, não um terceiro cabide. |
| `gb-crt-s-001` | Camiseta branca gola contraste | extra / avulso | VARIANTE | `gb-v10-gola-contraste` | Cor real (BRANCA) de Camiseta gola contraste: Mesmo modelo fotografado em três cores: gola e barra da manga em cor oposta, etiqueta e caimento iguais. |
| `gb-crt-s-002` | Camiseta vermelha gola contraste | extra / avulso | VARIANTE | `gb-v10-gola-contraste` | Cor real (VERMELHA) de Camiseta gola contraste: Mesmo modelo fotografado em três cores: gola e barra da manga em cor oposta, etiqueta e caimento iguais. |
| `gb-crt-s-003` | Camiseta listrada preta e branca | extra / avulso | NA ARARA | `gb-crt-s-003` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-004` | Camiseta preta estampa esportiva | extra / avulso | NA ARARA | `gb-crt-s-004` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-005` | Polo bege | extra / avulso | NA ARARA | `gb-crt-s-005` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-007` | Camiseta branca estampada | extra / avulso | VARIANTE | `gb-v10-monograma-degrade` | Cor real (BRANCA) de Camiseta monograma degradê: Mesma estampa de monograma que se dissolve do ombro para o peito, em base branca e base preta. |
| `gb-crt-s-008` | Camiseta preta gola contraste | extra / avulso | VARIANTE | `gb-v10-gola-contraste` | Cor real (PRETA) de Camiseta gola contraste: Mesmo modelo fotografado em três cores: gola e barra da manga em cor oposta, etiqueta e caimento iguais. |
| `gb-crt-s-009` | Camiseta preta EA7 | extra / avulso | NA ARARA | `gb-crt-s-009` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-013` | Conjunto preto lettering neon — apresentação | extra / avulso | DUPLICATA (oculta) (confirmada) | = `gb-crt-005` | Outra apresentação do conjunto preto com lettering neon (gb-crt-005), já na arara. |
| `gb-crt-s-014` | Camiseta preta padronagem geométrica | extra / avulso | VARIANTE | `gb-v10-monograma-degrade` | Cor real (PRETA) de Camiseta monograma degradê: Mesma estampa de monograma que se dissolve do ombro para o peito, em base branca e base preta. |
| `gb-crt-s-016` | Camiseta preta EA7 dourada | extra / avulso | NA ARARA | `gb-crt-s-016` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-019` | Camiseta preta Just Do It | extra / avulso | VARIANTE | `gb-v10-just-do-it` | Cor real (PRETA) de Camiseta Just Do It: Mesma estampa e posição do lettering, em preto e em branco. |
| `gb-crt-s-020` | Camiseta preta Air Basketball | extra / avulso | DUPLICATA (oculta) (confirmada) | = `gb-crt-s-004` | Render da mesma camiseta preta AIR / basketball fotografada em gb-crt-s-004. |
| `gb-crt-s-021` | Camiseta branca Just Do It | extra / avulso | VARIANTE | `gb-v10-just-do-it` | Cor real (BRANCA) de Camiseta Just Do It: Mesma estampa e posição do lettering, em preto e em branco. |
| `gb-crt-s-022` | Polo branca | extra / avulso | NA ARARA | `gb-crt-s-022` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-023` | Polo preta canelada | extra / avulso | NA ARARA | `gb-crt-s-023` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-024` | Boné azul com padronagem LV | extra / avulso | FORA DA ARARA | — | Boné não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-025` | Boné preto com padronagem LV | extra / avulso | FORA DA ARARA | — | Boné não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-026` | Jaqueta branca estilo corta-vento | extra / avulso | VARIANTE | `gb-v10-corta-vento` | Cor real (BRANCA) de Jaqueta corta-vento: Mesmo anoraque nas duas cores; a foto gb-crt-015 mostra as duas versões lado a lado. |
| `gb-crt-s-027` | Jaqueta preta estilo corta-vento | extra / avulso | VARIANTE | `gb-v10-corta-vento` | Cor real (PRETA) de Jaqueta corta-vento: Mesmo anoraque nas duas cores; a foto gb-crt-015 mostra as duas versões lado a lado. |
| `gb-crt-s-029` | Moletom cinza com zíper | extra / avulso | VISTA VINCULADA | → `gb-crt-010` | Mesmo moletom cinza com zíper do conjunto gb-crt-010 (capuz, cordões, bolso canguru e logo idênticos). |
| `gb-crt-s-045` | Tênis esportivo roxo | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-046` | Tênis esportivo vinho e preto | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-047` | Tênis esportivo vermelho e preto | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-048` | Tênis esportivo preto com detalhe rosa | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-049` | Tênis verde e branco | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-050` | Tênis branco e verde | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-051` | Tênis azul-claro com amortecimento | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-052` | Tênis preto e branco | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-053` | Tênis azul esportivo | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-054` | Tênis branco e roxo | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-055` | Tênis preto de amortecimento | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-056` | Tênis preto e branco cano médio | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-057` | Tênis azul e branco cano médio | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-058` | Tênis preto com solado branco | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-059` | Tênis branco monocromático | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-060` | Tênis branco com detalhe preto | extra / avulso | FORA DA ARARA | — | Calçado não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-061` | Camisa Alemanha preta | extra / avulso | NA ARARA | `gb-crt-s-061` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-062` | Camisa Real Madrid branca retrô | extra / avulso | NA ARARA | `gb-crt-s-062` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-063` | Camisa Manchester United vermelha | extra / avulso | NA ARARA | `gb-crt-s-063` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-064` | Camisa Milan rubro-negra | extra / avulso | NA ARARA | `gb-crt-s-064` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-065` | Camisa Brasil azul | extra / avulso | NA ARARA | `gb-crt-s-065` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-066` | Camisa Milan branca | extra / avulso | NA ARARA | `gb-crt-s-066` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-067` | Camisa Real Madrid preta | extra / avulso | NA ARARA | `gb-crt-s-067` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-068` | Camisa Brasil preta | extra / avulso | NA ARARA | `gb-crt-s-068` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-069` | Camisa Alemanha branca | extra / avulso | NA ARARA | `gb-crt-s-069` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-070` | Camisa Alemanha preta manga longa | extra / avulso | NA ARARA | `gb-crt-s-070` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-071` | Camisa Barcelona azul e grená | extra / avulso | NA ARARA | `gb-crt-s-071` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-072` | Camisa Brasil azul número 8 | extra / avulso | NA ARARA | `gb-crt-s-072` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-073` | Camisa Santos branca | extra / avulso | NA ARARA | `gb-crt-s-073` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-074` | Boné monograma grafite | extra / avulso | FORA DA ARARA | — | Boné não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-075` | Boné monograma verde | extra / avulso | FORA DA ARARA | — | Boné não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-076` | Boné monograma azul | extra / avulso | FORA DA ARARA | — | Boné não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-077` | Boné monograma verde — vista 02 | extra / avulso | DUPLICATA (oculta) (confirmada) | = `gb-crt-s-075` | Segunda vista do mesmo boné monograma verde. |
| `gb-crt-s-078` | Boné Nike SB azul acinzentado | extra / avulso | FORA DA ARARA | — | Boné não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-079` | Bermuda marinho | extra / avulso | VISTA VINCULADA | → `gb-crt-009` | Mesma bermuda marinho com logo bordado do conjunto gb-crt-009. |
| `gb-crt-s-080` | Bermuda preta logo branco | extra / avulso | NA ARARA | `gb-crt-s-080` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-081` | Bermuda cargo preta e areia | extra / avulso | NA ARARA | `gb-crt-s-081` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-082` | Bermuda cinza | extra / avulso | NA ARARA | `gb-crt-s-082` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-083` | Bermuda preta esportiva | extra / avulso | NA ARARA | `gb-crt-s-083` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-084` | Bermuda cargo cinza | extra / avulso | NA ARARA | `gb-crt-s-084` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-085` | Bermuda jeans preta | extra / avulso | NA ARARA | `gb-crt-s-085` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-086` | Bermuda jeans azul | extra / avulso | NA ARARA | `gb-crt-s-086` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-087` | Bermuda jeans grafite | extra / avulso | NA ARARA | `gb-crt-s-087` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-088` | Bermuda Jordan preta | extra / avulso | NA ARARA | `gb-crt-s-088` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-089` | Moletom azul-marinho | extra / avulso | NA ARARA | `gb-crt-s-089` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-095` | Jaqueta preta | extra / avulso | NA ARARA | `gb-crt-s-095` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-096` | Jaqueta branca | extra / avulso | NA ARARA | `gb-crt-s-096` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-098` | Moletom preto bordado | extra / avulso | NA ARARA | `gb-crt-s-098` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-099` | Polo areia | extra / avulso | VISTA VINCULADA | → `gb-crt-009` | Mesma polo areia de gola e punhos brancos do conjunto gb-crt-009 (foto real do kit). |
| `gb-crt-s-100` | Camiseta branca Nike Air | extra / avulso | NA ARARA | `gb-crt-s-100` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-101` | Camiseta branca Nike | extra / avulso | NA ARARA | `gb-crt-s-101` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-102` | Polo cinza | extra / avulso | NA ARARA | `gb-crt-s-102` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-103` | Camiseta preta Nike multicolor | extra / avulso | DUPLICATA (oculta) (confirmada) | = `gb-crt-005` | Mesma camiseta preta Nike multicolor que já é a vista superior de gb-crt-005. |
| `gb-crt-s-105` | Camiseta preta lisa | extra / avulso | NA ARARA | `gb-crt-s-105` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-106` | Camiseta branca Chevron | extra / avulso | NA ARARA | `gb-crt-s-106` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-107` | Camiseta branca Nike Air | extra / avulso | NA ARARA | `gb-crt-s-107` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-108` | Camiseta preta Jordan | extra / avulso | NA ARARA | `gb-crt-s-108` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-109` | Chinelo branco acolchoado | extra / avulso | FORA DA ARARA | — | Chinelo não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-110` | Chinelo preto acolchoado | extra / avulso | FORA DA ARARA | — | Chinelo não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-111` | Chinelo cinza e branco | extra / avulso | FORA DA ARARA | — | Chinelo não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-112` | Chinelo branco e preto | extra / avulso | FORA DA ARARA | — | Chinelo não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-113` | Chinelo preto e branco | extra / avulso | FORA DA ARARA | — | Chinelo não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-114` | Chinelo preto Nike bold | extra / avulso | FORA DA ARARA | — | Chinelo não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-115` | Chinelo vermelho e preto | extra / avulso | FORA DA ARARA | — | Chinelo não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-116` | Chinelo preto texturizado | extra / avulso | FORA DA ARARA | — | Chinelo não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-117` | Chinelo bege Nike | extra / avulso | FORA DA ARARA | — | Chinelo não é pendurado em cabide; permanece no catálogo e na busca. |
| `gb-crt-s-120` | Bermuda preta com faixa branca | extra / avulso | DUPLICATA (oculta) (confirmada) | = `gb-crt-s-080` | Mesma bermuda preta de cós branco, frisos e swoosh grande de gb-crt-s-080 (recorte menor). |
| `gb-crt-s-121` | Bermuda preta Nike | extra / avulso | NA ARARA | `gb-crt-s-121` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-122` | Bermuda cargo cinza | extra / avulso | NA ARARA | `gb-crt-s-122` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-123` | Bermuda preta swoosh | extra / avulso | NA ARARA | `gb-crt-s-123` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-124` | Bermuda Nike World branca | extra / avulso | VISTA VINCULADA | → `gb-crt-007` | Mesma bermuda branca Nike World com smile laranja da foto do conjunto gb-crt-007. |
| `gb-crt-s-125` | Bermuda Nike World preta | extra / avulso | NA ARARA | `gb-crt-s-125` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-126` | Bermuda Jordan preta | extra / avulso | DUPLICATA (oculta) (provável — revisar) | = `gb-crt-s-088` | Bermuda Jordan preta com losango e faixas brancas praticamente idêntica a gb-crt-s-088; ocultada da arara até a GB confirmar se são peças diferentes. |
| `gb-crt-s-127` | Bermuda Nike cinza | extra / avulso | NA ARARA | `gb-crt-s-127` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-128` | Bermuda jeans azul XO | extra / avulso | NA ARARA | `gb-crt-s-128` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-129` | Bermuda jeans preta rasgada | extra / avulso | NA ARARA | `gb-crt-s-129` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-130` | Bermuda jeans cargo azul | extra / avulso | NA ARARA | `gb-crt-s-130` | Imagem real do acervo, peça pendurável, sem duplicata na arara. |
| `gb-crt-s-131` | Bermuda cargo preta e areia | extra / avulso | DUPLICATA (oculta) (confirmada) | = `gb-crt-s-081` | Mesma bermuda preta com cós e bolso cargo areia de gb-crt-s-081. |
