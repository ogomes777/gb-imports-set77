---
name: gb-fit-studio
description: Implementar o Look Studio da GB Imports com personagem persistente realmente vestido, motion de troca por parte do corpo e QA mobile.
---

# GB FIT STUDIO
Leia `docs/FIT_V19_SKIN.md` (estado atual), `docs/FIT_V18_JOGO.md`, `docs/FIT_V17_GB_UNIT.md`, `docs/FIT_REAL_V16.md` e `docs/GB_FIT_STUDIO_V09_EXECUTION.md` (contrato e coreografia de origem).

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

## V17 / GB UNIT
- Robô = armadura preta + placas amarelo GB; monograma só pelo arquivo SVG oficial. Proporção humana; nunca voltar ao boneco liso.
- Toda peça nova de cima precisa de `collar` (gola) marcada olhando a foto; tênis precisam de `cut`/`toe`/`collar`; bonés de `crown`.
- Tênis: só o pé da frente do par real, o mesmo nos dois pés, mesma direção. Nunca espelhar.
- Conferir as 81 peças vestidas (35+25+16+5) em 1440 e 390 depois de qualquer ajuste de corpo.

## V18 / jogo
- Giro só por transform (`--yaw`); nada de redesenhar o corpo por pose. Tênis: o outro lado é o mesmo pé espelhado (par simétrico); vista de bico só com foto real.
- Capuz: só peça com `hood` marcado olhando a foto; capuz e boné se excluem.
- Toda troca: ícone voa do seletor, hélice varre, peça assenta; movimento reduzido desliga voo e hélice.
- Palco claro (ORIGEM) e escuro (SINAL) sempre conferidos juntos; mobile em 390 e 320.

## V19 / skin
- O manequim é a arte aprovada (`assets/characters/gb-unit-ref.webp`) recortada em ossos; nunca voltar ao robô vetorial nem redesenhar a arte. Ajuste de junta = coordenada em `scripts/gerar_skin_v19.py`, olhando a imagem com régua.
- Emotes só giram juntas `[data-j]` e o `.fit-emote`; manga curta gira no mesmo pivô do ombro.
- Arrastar o boneco gira (toque e mouse); conferir no celular com toque real (CDP) a cada mudança de gesto.
