# GB IMPORTS — HERO COSMOS V46
SET77 Labs · 31/10/2026

## Missão
Evolução cirúrgica da seção hero #inicio do site GB Imports. O cliente pediu Tech Fleece mais flutuantes, um pouco mais rápidos na rotação orbital, com pulsação conjunta e uma galáxia de traços animados atrás dos produtos, sem comprometer mobile nem outras seções.

## Implementação real
1. **v07.js**: preservado o anel 360° atual com as três peças do catálogo; tempo por volta perceptivelmente mais rápido (SPEED de 1/4.2 a 1/3.65), limitando a atualização da geometria 3D a ~30 Hz em telas <=780px (acumula dt real).
2. **gb-hero-cosmos-v46.js**: 95 curvas base com semente determinística, amostradas em perspectiva 3D elíptica e animadas em 2D. A cena desenha até 70 rastros no desktop e 29 no mobile em Canvas2D, com alterações visuais de luz conforme o tema. **Não carrega Three.js**: o mesmo efeito visual de trilhas em perspectiva custa menos memória e menos GPU do que importar uma nova cena Three.js só para este fundo. Compartilha o único ticker GBMotion, para ao sair da tela, na aba oculta, com diálogo aberto ou no modo reduzido.
3. **gb-hero-cosmos-v46.css**: flutuação de 24px, pulsação de ~2.4%, oscilação de inclinação discreta, animada nos elementos internos (não disputa a transform do anel com v07.js). No mobile flutuação reduzida (~13px), imagens com sombra simplificada, glow e canhões de luz mais suaves, e espaço da composição recalibrado.
4. **index.html**: novas camadas conectadas por último ao build estático existente sem alterar a landing, APIs de catálogo, animação da intro V45, arara, Look Studio, hero CTA ou rotas internas.
5. **tests/hero-cosmos-v46.mjs** e **CI**: navegador Chromium em 1440x900, 390x844, 320x720, 390x844 com reduced motion; valida existência das 3 peças, giro contínuo, >2 frames da galáxia, orçamento de canvas, primeira seção, catálogo, carregamento da intro, sem erros/overflow.

## Integridade de produto
O termo "360°" refere-se ao percurso orbital do conjunto de peças entre posições 3D, **não a inventar fotografias de costas** das roupas. Cada Tech Fleece exibe apenas sua mídia oficial frontal, com yaw restrito, conforme a arquitetura original.

## Orçamento e fallbacks
- Desktop: CanvasD2D até 1.050.000 pixels; ~30 fps.
- Mobile: até 420.000 pixels; ~20 fps; redução de trilhas.
- Hardware modesto: até 14 trilhas e ~15 fps.
- Orbit do produto no mobile: updates de transform ~30 Hz, com dt acumulado.
- Reduced motion: galáxia oculta, sem renderização; mídia estática.
- Sem loop rAF separado, sem pacote Three.js adicional, sem fotos falsas, sem animação em seções fora do viewport.

## Testes e publicação
Branch: `feat/gb-hero-cosmos-v46`.
Executar `npm ci`, `npm install --no-save playwright`, `npx playwright install chromium`, `node scripts/build.mjs`, servir `dist` na 8080 e executar `node tests/hero-cosmos-v46.mjs`.
CI `GB Imports | Hero Cosmos V46` executou com sucesso no commit `89e3eac4` na etapa de navegação, animação e performance adaptativa (GitHub Actions #41214734796).

Produção **não alterada**. Preview criado automaticamente no projeto Vercel original. Não promover para produção antes de aprovação visual do usuário. O teste funcional não substitui medição de frame-time em celulares reais de entrada.
