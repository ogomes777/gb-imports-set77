# GB IMPORTS — Look Studio True Volume V21

## Arquitetura

O acervo FIT V17 contém fotografias frontais, e não arquivos 3D completos das roupas. A vista fotográfica padrão preserva os recortes, logos, cores e estampas reais da curadoria.

O arquivo gb-true3d.js constrói um manequim volumétrico WebGL independente, com superfícies 3D em todos os ângulos para capacete, tronco, braços, pernas, tênis e roupas. O verso não é uma fotografia nem um espelhamento do original: é geometria simulada. A interface identifica explicitamente o verso das roupas como SIMULADO; não inferir detalhes inexistentes.

## Controles

- VOLUME 3D abre o manequim; o personagem, as setas e o comando 360° também dão acesso.
- Arraste o personagem com mouse ou dedo para girar continuamente.
- Presets 0°, 90°, 180°, 270° mostram frente, direita, costas e esquerda.
- ORBITAR cobre todo o intervalo -180° a +180°; o comando 360° completa uma revolução.
- VOLTAR À FOTO preserva a seleção e retorna ao configurador de produtos.
- Quando WebGL não está disponível, o configurador fotográfico original permanece funcional.

## Performance e QA

A GPU recebe um buffer apenas quando a geometria muda. O frame loop executa durante a interação ou animação e para quando estabiliza. Rotação baseada em tempo real, com conclusão mesmo sob quadros atrasados. Device pixel ratio é limitado para preservar recursos no mobile.

Laboratório em Chromium com WebGL por software, 750 e 390 pixels: 19.248 vértices (calça), ângulos 90° e 180° confirmados, arraste touch, barra ORBIT, troca para bermuda com 17.904 vértices, saída para a fotografia, zero erros JS e sem overflow. npm run build aprovado. A landing completa foi validada com inicialização direta do Look Studio devido à intro bloquear automação do scroll.

## Limitação fundamental

Esta V21 traz volume 3D real do manequim, mas NÃO é prova fiel de cada peça em 360°. Para modelagem específica de estampas, detalhes traseiros, materiais PBR e caimento de todas as roupas, serão necessários modelos GLB/GLTF ou imagens de múltiplos ângulos. Nunca anunciar o verso reconstruído como foto autêntica do produto.