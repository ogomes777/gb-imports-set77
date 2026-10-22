#!/usr/bin/env python3
"""Importador explícito de recortes da GB, sem adivinhação de categoria/variante.

Uso:
  python scripts/importar_produtos.py /caminho/pasta_recortes [--max 2000] [--dry-run]

Nome obrigatório do arquivo: <id>-<vista>.<ext>
  ids:    gb-tr-01..06, gb-sh-01..08, gb-ex-01..04 (ver data/catalogo-fontes.json)
  vistas: combo (conjunto completo), top (superior), bottom (inferior)
  ext:    .png (preferível, com transparência), .webp, .jpg/.jpeg (sem transparência: aviso)
Exemplo: gb-tr-01-combo.png, gb-tr-01-top.png, gb-tr-01-bottom.png

O que faz:
  - converte para WebP sem perdas (transparência preservada), reduzindo só se passar de --max px;
  - mescla com as fotos já importadas e regrava assets-map.js;
  - atualiza asset_status em data/catalogo-fontes.json e regrava data/manifesto-ativos.json
    (flags foto_real / arte_estudo / pendente por item e vista).
Nada aqui confirma preço, estoque, marca ou procedência: revise cada vínculo antes de publicar.
"""
import argparse, json, re, sys
from datetime import date
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / 'data/catalogo-fontes.json'
MANIFEST = ROOT / 'data/manifesto-ativos.json'
ASSET_MAP = ROOT / 'assets-map.js'
DEST = ROOT / 'assets/products'
VIEWS = ('combo', 'top', 'bottom')
NAME = re.compile(r'(gb-(?:tr|sh|ex)-\d{2})-(combo|top|bottom)', re.I)


def read_asset_map():
    if not ASSET_MAP.exists():
        return {}
    m = re.search(r'window\.GB_ASSETS\s*=\s*(\{.*\})\s*;?\s*$', ASSET_MAP.read_text(encoding='utf-8'), re.S)
    return json.loads(m.group(1)) if m else {}


def write_manifest(catalog, assets):
    rows = []
    for item in catalog['items']:
        views = VIEWS if item['id'].startswith(('gb-tr', 'gb-sh')) else ('combo',)
        per_view = {}
        for v in views:
            real = bool(assets.get(item['id'], {}).get(v))
            per_view[v] = {
                'foto_real': real,
                'arte_estudo': (not real) and item['id'].startswith(('gb-tr', 'gb-sh')),
                'pendente': not real,
                'arquivo': assets.get(item['id'], {}).get(v),
            }
        rows.append({'id': item['id'], 'nome_trabalho': item['nome_trabalho'], 'vistas': per_view,
                     'exibido_no_site': item['id'].startswith(('gb-tr', 'gb-sh')) or bool(assets.get(item['id'], {}).get('combo')),
                     'commercial_status': item.get('commercial_status', 'pendente_validacao')})
    MANIFEST.write_text(json.dumps({
        'gerado_em': date.today().isoformat(),
        'legenda': {'foto_real': 'recorte real importado e vinculado', 'arte_estudo': 'ilustração SVG de estudo exibida no lugar da foto',
                    'pendente': 'foto real ainda não importada'},
        'aviso': 'Manifesto técnico de mídia. Não confirma preço, estoque, marca, licença ou procedência.',
        'itens': rows}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pasta', nargs='?', help='pasta com os recortes nomeados')
    ap.add_argument('--max', type=int, default=2000, help='maior lado em px (só reduz, nunca amplia)')
    ap.add_argument('--dry-run', action='store_true', help='valida sem gravar nada')
    ap.add_argument('--so-manifesto', action='store_true', help='apenas regrava data/manifesto-ativos.json')
    a = ap.parse_args()

    catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
    expected = {i['id'] for i in catalog['items']}
    assets = read_asset_map()
    if a.so_manifesto:
        write_manifest(catalog, assets)
        print('Manifesto regravado:', MANIFEST.relative_to(ROOT))
        return
    if not a.pasta:
        ap.error('informe a pasta dos recortes')
    folder = Path(a.pasta)
    if not folder.is_dir():
        sys.exit(f'Pasta inexistente: {folder}')

    warnings, done = [], 0
    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in ('.png', '.webp', '.jpg', '.jpeg'))
    for file in files:
        m = NAME.fullmatch(file.stem)
        if not m:
            warnings.append(f'NOME NÃO RECONHECIDO (ignorado): {file.name}')
            continue
        pid, view = m.group(1).lower(), m.group(2).lower()
        if pid not in expected:
            warnings.append(f'ID AUSENTE NO CATÁLOGO (ignorado): {pid}')
            continue
        im = Image.open(file)
        im.load()
        if file.suffix.lower() in ('.jpg', '.jpeg'):
            warnings.append(f'SEM TRANSPARÊNCIA (JPEG): {file.name} — prefira PNG recortado')
        if im.mode != 'RGBA':
            im = im.convert('RGBA')
        if im.getextrema()[3] == (255, 255):
            warnings.append(f'NENHUM PIXEL TRANSPARENTE: {file.name} — confirme se o fundo foi removido')
        if min(im.size) < 600:
            warnings.append(f'BAIXA RESOLUÇÃO ({im.width}×{im.height}): {file.name}')
        if max(im.size) > a.max:
            im.thumbnail((a.max, a.max), Image.LANCZOS)
        out = DEST / f'{pid}-{view}.webp'
        if not a.dry_run:
            DEST.mkdir(parents=True, exist_ok=True)
            im.save(out, format='WEBP', lossless=True, method=6)
        assets.setdefault(pid, {})[view] = f'./assets/products/{out.name}'
        done += 1

    if a.dry_run:
        print(f'[dry-run] {done} arquivo(s) válidos; nada foi gravado.')
    else:
        ASSET_MAP.write_text('/* GERADO POR scripts/importar_produtos.py APÓS CONFERÊNCIA DAS FOTOS.\n'
                             ' * Vínculo produto -> vista -> arquivo. NÃO confirma estoque, preço, marca ou procedência. */\n'
                             'window.GB_ASSETS = ' + json.dumps(assets, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
        for item in catalog['items']:
            got = assets.get(item['id'], {})
            if got:
                item['asset_status'] = 'foto_real_importada' if all(got.get(v) for v in item['media']) else 'foto_real_parcial'
                item['media'] = {k: v.replace('./', '', 1) for k, v in {**item['media'], **got}.items()}
        CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        write_manifest(catalog, assets)
        print(f'Fotos importadas nesta execução: {done}. Produtos com foto no mapa: {len(assets)}.')
    if warnings:
        print('\n'.join(warnings))
    print('REVISE O VÍNCULO DE CADA FOTO (peça, vista e cor) ANTES DE PUBLICAR. Depois rode: node scripts/build.mjs')


if __name__ == '__main__':
    main()
