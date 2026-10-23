---
name: gb-catalogo-real
description: "Use quando produtos de estudo, imagens repetidas ou classificações incorretas aparecem na arara GB Imports; valida fonte de verdade, categorias, kits, vistas e variantes reais."
---
# Skill GB Catálogo Real — Asset Truth Gate

## Missão

Substituir conteúdo de protótipo por produtos verdadeiros do acervo informado, sem criar SKU, estoque, preço, variante ou origem de forma especulativa.

## Entrada

`main.js`, `imported-products.js`, `assets-map.js`, `data/catalogo-fontes.json`, `data/manifesto-ativos.json`, `assets/products/**`, `docs/02_AUDITORIA_CATALOGO.md`, `exemplos/gb-product-schema.json`.

## Passos

1. Contar `GB_IMPORTED_PRODUCTS`, mapear paths reais, confirmar arquivo no filesystem, verificar dimensão, decodificação e duplicidade.
2. Para todos os IDs, reportar foto oficial/provisória, categoria observada, categoria verificada, se é kit, se existe cada vista, se existem variantes.
3. Manter `sourceId` imutável; criar `canonicalProductId` apenas com justificativa verificável.
4. Corrigir `single` / `extra` apenas após inspeção da mídia. Não inferir por regex do nome.
5. Gerar manifesto de seleção com `railEligible` e `reason` por item.
6. Impedir `garmentSVG` no rack final e proibir fallback enganoso quando foto não carrega.
7. Preservar relatórios para cada item ocultado ou deduplicado.
8. Revalidar contadores, busca, viewer e filtros quando fonte muda.

## Invariantes

- `variant.color` deve apontar para mídia correspondente à mesma cor.
- Um `combo` não concede automaticamente `top` nem `bottom` independente.
- `commerciallyAvailable` não pode ser deduzido de imagem presente.
- Sem foto real verificável = não elegível para o rack.
- Diferentes vistas de um item não são produtos duplicados.

## Entrega

Relatório com todas as 114 linhas, motivos de inclusão/exclusão, imagens faltantes, duplicatas e assets incorretos; código de validação reproduzível, falhando de forma clara quando faltam arquivos.
