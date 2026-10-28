---
name: gb-fit-studio
description: Implementar o Look Studio da GB Imports com personagem persistente realmente vestido, motion de troca por parte do corpo e QA mobile.
---

# GB FIT STUDIO
Leia `docs/FIT_REAL_V16.md` (estado atual) e `docs/GB_FIT_STUDIO_V09_EXECUTION.md` (contrato e coreografia de origem).

## V16 / FIT REAL
- O manequim veste só peças reais: `data/gb-fit-curation.json` → `python3 scripts/gerar_fit_v16.py --qa <pasta>` → `assets/fit/` + `fit-catalog.js` (gerado, nunca à mão).
- Incluir peça = registro na curadoria, olhando a imagem (foto frontal plana, peça sozinha, recorte limpo). Conferir a folha de QA.
- Manga curta usa o rig de manga (tronco + mangas da própria foto, giradas no ombro). Nunca espelhar, esticar ou pintar.
- Robô prata humano: mexer em proporção só em `B`/`FIT` de `look-fitting.js`. Conferir as 60 peças vestidas em 1440 e 390 depois de qualquer ajuste.

## Obrigatório
- Um único corpo em cena, oclusão/âncoras e roupa superior/inferior *vestindo* o boneco.
- Preservar `v03.js` e todos os fluxos de escolher, arrastar, misturar, salvar, restaurar, A/B.
- Trocas coreografadas, interrompíveis, sem travar; `prefers-reduced-motion` e baixo consumo.
- Criar rig autoral sem copiar referência, fotos alheias ou inventar produto/física reais.
- Paleta GB em estudo, sem marca de outro cliente.
- Testar 320/390/768/1024/1440 e regressões na home/shop/rail/detalhe.
- Entregar código, screenshots, preview Vercel, branch, testes e pendências; nunca só mockup ou proposta.

## Falha inaceitável
Dois SVGs flutuando com um boneco desenhado atrás, sem encaixe anatômico. Falhar em trocar somente a peça solicitada. Afirmar virtual try-on real com apenas flat-lays.
