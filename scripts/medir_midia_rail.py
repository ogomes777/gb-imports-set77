#!/usr/bin/env python3
"""GB RAIL V10 — medição determinística das mídias do acervo (requer Pillow).

Para cada WebP em assets/products/gb-crt/ grava em data/gb-media-meta.json:
  dimensões, sha256, transparência, caixa útil normalizada (bbox do alfa),
  ponto de suspensão (centro x da faixa superior da peça) e cor dominante.
Esses números posicionam o gancho e o tecido no mesmo espaço de coordenadas.
O validador Node (scripts/gerar-rail-v10.mjs) confere sha/dimensões e falha se o arquivo mudou.
"""
import hashlib, json, os, sys
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'products', 'gb-crt')
OUT = os.path.join(ROOT, 'data', 'gb-media-meta.json')
SHADOWS = os.path.join(SRC, 'sombras')

def measure(path):
    raw = open(path, 'rb').read()
    im = Image.open(path); im.load()
    rgba = im.convert('RGBA'); a = rgba.getchannel('A')
    W, H = rgba.size
    bb = a.point(lambda v: 255 if v > 24 else 0).getbbox() or (0, 0, W, H)
    x0, y0, x1, y1 = bb; bw, bh = x1 - x0, y1 - y0
    # faixa superior (4% da altura útil): onde gola/capuz/cós encontram o gancho
    band = a.crop((x0, y0, x1, y0 + max(2, int(bh * .04)))).load()
    bwid, bhei = bw, max(2, int(bh * .04)); xs = []
    for yy in range(bhei):
        for xx in range(bwid):
            if band[xx, yy] > 24: xs.append(xx)
    neck = (x0 + (sum(xs) / len(xs) if xs else bw / 2)) / W
    # largura do topo (15% da altura útil): abertura da gola/ombros para o cabide
    top = a.crop((x0, y0 + int(bh * .12), x1, y0 + int(bh * .16)))
    tb = top.point(lambda v: 255 if v > 24 else 0).getbbox()
    topw = ((tb[2] - tb[0]) / W) if tb else bw / W
    # presilhas: primeira linha opaca em colunas a 22% e 78% da largura útil (cós da bermuda / topo do kit)
    def first_y(fx):
        cx = x0 + int(bw * fx)
        col = a.crop((cx - 2, y0, cx + 3, y1)).load()
        for yy in range(bh):
            if any(col[k, yy] > 24 for k in range(5)): return (y0 + yy) / H
        return y0 / H
    clips = [[round((x0 + bw * fx) / W, 4), round(first_y(fx), 4)] for fx in (.22, .78)]
    # cor dominante dos pixels opacos (amostra central), para acento da ficha
    core = rgba.crop((x0 + bw // 4, y0 + bh // 4, x1 - bw // 4, y1 - bh // 4)).resize((24, 24))
    data = core.get_flattened_data() if hasattr(core, "get_flattened_data") else core.getdata()
    px = [p for p in data if p[3] > 200]
    px.sort(key=lambda p: p[0] * .3 + p[1] * .59 + p[2] * .11)
    mid = px[len(px) // 2] if px else (128, 128, 128, 255)
    return {
        'w': W, 'h': H, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(),
        'alpha': a.getextrema()[0] < 250,
        'bbox': [round(x0 / W, 4), round(y0 / H, 4), round(x1 / W, 4), round(y1 / H, 4)],
        'neckX': round(neck, 4), 'topW': round(topw, 4), 'clips': clips,
        'color': '#%02x%02x%02x' % mid[:3],
    }

def shadow(path, name):
    """Sombra na parede pré-calculada: silhueta do alfa, desfocada, em 220 px (mesma proporção e
    mesmo enquadramento do recorte, então usa a mesma geometria). Na arara é só uma imagem com
    opacidade, sem filter: blur() recalculado a cada quadro."""
    a = Image.open(path).convert('RGBA').getchannel('A')
    w, h = a.size; k = 220 / max(w, h)
    small = a.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    pad = 12
    canvas = Image.new('L', (small.width + pad * 2, small.height + pad * 2), 0); canvas.paste(small, (pad, pad))
    blur = canvas.filter(ImageFilter.GaussianBlur(5)).crop((pad, pad, pad + small.width, pad + small.height))
    out = Image.new('RGBA', small.size, (17, 18, 20, 0)); out.putalpha(blur)
    out.save(os.path.join(SHADOWS, name), 'WEBP', quality=70, method=6)

def main():
    os.makedirs(SHADOWS, exist_ok=True)
    files = sorted(f for f in os.listdir(SRC) if f.endswith('.webp'))
    for f in files: shadow(os.path.join(SRC, f), f)
    meta = {f: measure(os.path.join(SRC, f)) for f in files}
    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump({'_note': 'Gerado por scripts/medir_midia_rail.py. Não editar à mão.', 'files': meta}, fh, ensure_ascii=False, indent=1)
    print(f'✓ {len(meta)} mídias medidas → data/gb-media-meta.json · sombras em assets/products/gb-crt/sombras/')

if __name__ == '__main__':
    sys.exit(main())
