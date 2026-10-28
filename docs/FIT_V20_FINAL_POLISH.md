# GB Imports | Look Studio V20 — acabamento final

Continuidade da V19.1, sem reconstruir a landing nem tocar em checkout ou catálogo externo.

## Ajustes implementados
- Tênis: a pose frontal deixou de comprimir o recorte a 64%. Agora usa 91% e 98% nas vistas laterais, com largura-base de 164 unidades; sapato e perna compartilham o alvo medido da gola do tênis.
- Pernas: redução da espessura de coxas/panturrilhas com escala controlada pela boca da bermuda real e sombreamento de contato na barra; flexão do joelho menos agressiva.
- Manga curta: rotação limitada a 24° para não rebatê-la artificialmente para dentro; braço mais estreito. Punho longo: luva menor e inserida 13 unidades na foto, sem punho flutuando.
- Capuz: máscaras corrigidas para as coordenadas finais do palco, em vez de misturar referência da fotografia e do SVG; apenas um recorte de tecido para costas e uma borda vazada na frente.
- Interface: painel premium de cinco emotes (PASSINHO, TCHAU, SALVE, 360° e PULAR), círculos dourados e controles de giro. Modo ORIGEM e SINAL e layouts de mobile preservados.
- Um corpo persistente, peças fotografadas sem esticar, aviso de composição editorial e sem simular fotos reais do verso.

## Validação
- Build `npm run build` concluído e sintaxe de JS aprovada.
- Smoke em Firefox automatizado (desktop 1440×900, mobile 390×844): 12 combinações aleatórias determinísticas de top + inferior + tênis + boné por viewport, troca de capuz, 5 emotes, um corpo persistente e nenhuma exceção de JS ou overflow horizontal.
- Capturas inspecionadas em 390 px: look padrão, camisa curta + bermuda, moletom com capuz; giro esquerda/frente/direita com calçado, sem falha visível de ancoragem no calcanhar.
- No CI do repositório: `tests/e2e.mjs` contém duas verificações extras de V20; aguardar o resultado da execução completa.
- QA físico (Safari iOS/Android e leitores de tela) ainda é necessário. Emotes são composições editoriais, não tecido 3D.

## Limites honestos de mídia
Alguns moletons/jaquetas do acervo foram fotografados com as mangas cruzadas ou dobradas. Uma foto frontal plana não contém pixels suficientes para reconstruir mangas abertas e caimento real. A V20 reduz distorções e corrige o encaixe do personagem, mas **não afirma ter convertido essas fotografias em peças articuladas**. A correção definitiva dos produtos afetados exige novas fotos com mangas abertas ou recortes individuais aprovados.
