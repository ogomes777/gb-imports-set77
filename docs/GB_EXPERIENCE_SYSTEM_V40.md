# GB IMPORTS — EXPERIENCE SYSTEM V40
SET77 LABS / revisão 29.10.2026 / branch \`feat/gb-adaptive-navigation-v39\`

## Mandato
Completar visualmente a experiência da GB Imports, mesmo antes do backend, sem inventar contas, pedidos, pontos, compras, preços, rastreio, vantagens, estoque, reviews ou receitas. A referência de abrangência de funcionalidades é a Street Goose 034; não se compartilha identidade, texto, CSS, assets ou código daquela marca.

**Não reconstruir a landing existente.** O V40 foi adicionado em módulos isolados:
- \`gb-experience-v40.js\`: roteador visual independente, fluxos e interface;
- \`gb-experience-v40.css\`: design responsivo premium da GB;
- \`gb-nav-v39.js/css\`: acesso às rotas pelo menu Minha GB e mobile;
- \`index.html\`: monta os módulos da flagship, base de URLs;
- \`vercel.json\`: deep links V40 em \`/gb\` e \`/gb-studio\`;
- \`tests/experience-v40.mjs\`: verificação de rota, UI e estados em Chromium.

## Sistema de rotas
**GB / Shop e experiência:** \`/gb\`, \`/gb/busca\`, \`/gb/colecoes\`, \`/gb/drops\`, \`/gb/marcas\`, \`/gb/medidas\`, \`/gb/alertas\`, \`/gb/favoritos\`, \`/gb/sacola\`, \`/gb/comparar\`, \`/gb/checkout\`.

**GB / Conta:** \`/gb/entrar\`, \`/gb/cadastro\`, \`/gb/perfil\`, \`/gb/identidade\`, \`/gb/pedidos\`, \`/gb/pedido\`, \`/gb/rastreio\`, \`/gb/configuracoes\`, \`/gb/privacidade\`, \`/gb/acessibilidade\`, \`/gb/ajuda\`, \`/gb/trocas\`.

**GB ACCESS / Comunidade e clube:** \`/gb/club\`, \`/gb/club/avatar\`, \`/gb/club/distrito\`, \`/gb/club/armario\`, \`/gb/club/recompensas\`, \`/gb/club/conquistas\`, \`/gb/club/temporada\`, \`/gb/club/ranking\`, \`/gb/club/amigos\`, \`/gb/comunidade\`, \`/gb/comunidade/publicar\`.

**GB STUDIO / apenas protótipo interno:** \`/gb-studio\`, \`/gb-studio/pedidos\`, \`/gb-studio/produtos\`, \`/gb-studio/clientes\`, \`/gb-studio/comunidade\`, \`/gb-studio/beneficios\`, \`/gb-studio/financeiro\`, \`/gb-studio/newsletter\`.

Todas as rotas são visuais. O backend não existe. Mesmo \`/gb-studio\` não contém dados privados, login administrativo ou permissões reais; não divulgar como painel operacional. Implementar acesso autenticado e RLS antes de habilitar administração.

## Interfaces e interações existentes
- Painel com menu independente, tiles, estados vazios, páginas e mobile.
- Entrada/cadastro visual: formulário sem transmitir nem reter senhas.
- Identidade: @handle local em \`gb-v40-preview\`, sem reserva pública.
- Avatar GB: três bases autorais, seleção salva localmente; sem selfie/câmera/biometria.
- Distrito GB: 5 hotspots clicáveis para armário, benefícios, ranking, conexões e comunidade.
- Benefícios/ranking: sete marcos visuais, placar vazio e opt-in local; **nenhum XP real**.
- Comunidade: estrutura de mural e publicação; upload apenas mostra preview local e não transmite arquivo.
- Favoritos e sacola: leem os estados locais já existentes no núcleo GB.
- Catálogo visual: usa apenas \`PUBLIC_PRODUCTS\` com imagem. O V40 não inventa foto da peça.
- Checkout e rastreio: telas completas de etapas e estados, bloqueio de execução real com feedback claro.
- Marca GB: monograma amarelo oficial, amarelo \`#FFD447\`, grafite \`#111214\`, papel \`#F4F1E8\`.
- Navegação: ilha que diminui na rolagem, monograma sem duplicação do GB, nome IMPORTS oculto ao compactar, menu Minha GB e mobile; temas, busca e Look Studio já existentes continuam ativos.

## Regras de fidelidade / integração futura
1. Catálogo e variantes precisam de registros aprovados e fotos das vistas reais. Nada de “360°” inventado a partir de uma foto.
2. Autenticação exige fluxo seguro de sessão, confirmação, recuperação, consentimento e exclusão.
3. \`GB Studio\` exige autenticação e autorização real antes de lidar com clientes, finanças, mídia e operações.
4. XP, níveis, ranking e resgates exigem regras, antifraude, transações reais e reversão de pontos em reembolso.
5. Busca, favoritos e sacola podem continuar locais; pedidos, pagamentos, cupons e rastreio não são simulados como reais.
6. Comunidade exige autorização de imagem, moderação, remoção de metadados pessoais e denúncia.
7. Trocas, prazo e política precisam de validação comercial.
8. Interface de pre-backend não deve pedir nem guardar números de cartão, dados de autenticação ou fotos sensíveis.

## QA e publicação
Executar: \`npm run build\`, \`node tests/nav-adaptive-v39.mjs\`, \`node tests/experience-v40.mjs\`, além dos testes de intro existentes.
\`tests/experience-v40.mjs\` sobe servidor local com fallback para \`index.html\`, evitando falso 404 em \`/gb/*\` e \`/gb-studio/*\`.
O CI em \`.github/workflows/gb-adaptive-nav-v39.yml\` executa os testes com Chromium desktop/mobile.
As alterações seguem em **branch de preview**. Não mesclar em \`main\` nem promover à produção sem testes verdes e revisão da experiência.
