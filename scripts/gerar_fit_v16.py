#!/usr/bin/env python3
"""V16 / FIT REAL — prepara as peças REAIS do acervo para o manequim do Look Studio.

Lê data/gb-fit-curation.json (decisões por registro, olhando a imagem) e, para cada peça:
  - recorta a peça do arquivo do acervo (já vem sem fundo; kits com foto conjunta são separados só quando
    as peças estão separadas no recorte: lado a lado ou em manchas distintas);
  - mede as âncoras no próprio recorte — superior: linha e largura dos ombros, centro, barra, mangas
    (punho das longas / abertura das curtas); inferior: cós (largura e centro) e boca das pernas;
  - grava assets/fit/<produto>-<parte>.webp (até 900 px) + miniatura assets/fit/thumb/ (168 px);
  - escreve fit-catalog.js (window.GB_FIT_CATALOG), que o look-fitting.js usa para vestir o manequim.
Nada é redesenhado, esticado, espelhado ou pintado: a foto entra inteira, só redimensionada.

uso: python3 scripts/gerar_fit_v16.py [--qa pasta]   (--qa grava folhas de conferência com as âncoras)
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets/products/gb-crt')
OUT = os.path.join(ROOT, 'assets/fit')
MAXPX, THUMB = 900, 168


def load_piece(spec):
    """spec: '034' ou {'from':'032','side':'left'|'right'} ou {'from':'090','component':'upper'|'lower'}"""
    name = spec if isinstance(spec, str) else spec['from']
    a = np.array(Image.open(f'{SRC}/gb-crt-{name}.webp').convert('RGBA'))
    al = a[..., 3]
    al[al <= 12] = 0
    m = al > 40
    if isinstance(spec, dict) and 'side' in spec:
        cols = m.sum(0).astype(float); W = len(cols)
        lo, hi = int(W * .3), int(W * .7)
        cut = lo + int(np.argmin(cols[lo:hi]))
        keep = np.zeros_like(m); keep[:, :cut] = spec['side'] == 'left'; keep[:, cut:] = spec['side'] == 'right'
        a[..., 3] = np.where(keep, al, 0)
        # a peça vizinha pode encostar no corte: fica só a maior mancha deste lado
        import cv2
        n, lab, st, _ = cv2.connectedComponentsWithStats((a[..., 3] > 40).astype(np.uint8), 8)
        if n > 1: a[..., 3] = np.where(lab == 1 + int(np.argmax(st[1:, 4])), a[..., 3], 0)
    elif isinstance(spec, dict) and 'component' in spec:
        import cv2
        n, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
        big = sorted([i for i in range(1, n) if st[i, 4] > m.sum() * .08], key=lambda i: cen[i][1])
        pick = big[0] if spec['component'] == 'upper' else big[-1]
        # inclui fiapos próximos da mesma peça (cordões soltos)
        a[..., 3] = np.where(lab == pick, al, 0)
    ys, xs = np.where(a[..., 3] > 40)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy(), name


def extents(m):
    H = m.shape[0]; L = np.full(H, -1); R = np.full(H, -1)
    for y in range(H):
        xs = np.where(m[y])[0]
        if len(xs): L[y], R[y] = xs[0], xs[-1]
    return L, R


def run_at(row, x):
    """trecho contínuo da linha que contém x (ou o mais próximo)"""
    xs = np.where(row)[0]
    if not len(xs): return None
    runs = np.split(xs, np.where(np.diff(xs) > 2)[0] + 1)
    best = min(runs, key=lambda r: 0 if r[0] <= x <= r[-1] else min(abs(r[0] - x), abs(r[-1] - x)))
    return int(best[0]), int(best[-1])


LONG = {'hoodie', 'jacket', 'longsleeve', 'sweatshirt'}
SHORT = {'tee', 'polo', 'jersey'}


def split_sleeves(a, meas, key):
    """Manga curta: a foto plana tem as mangas abertas em T. Separa tronco + mangas pelo prolongamento das laterais
    do tronco (x da barra) e grava cada manga como camada própria, com o pivô no ombro, para o manequim baixá-las
    junto ao braço (mesma ideia do rig da V15: recorte do próprio material, nada redesenhado). Cada manga leva uma
    sombra suave embutida, que cai sobre o tronco quando ela desce."""
    import cv2
    H, W = a.shape[:2]; m = a[..., 3] > 110
    tl = int(round((meas['cx'] - meas['hemw'] / 2) * W)); tr = int(round((meas['cx'] + meas['hemw'] / 2) * W))
    parts = {}; torso = a.copy()
    for side, sl in (('l', slice(0, max(1, tl))), ('r', slice(min(W - 1, tr + 1), W))):
        # a manga = maior mancha fora da lateral do tronco, acima da barra (a lateral pode abrir 1–2 px na barra)
        cut = np.zeros((H, W), bool); cut[:, sl] = True
        probe = m & cut; probe[int(meas['hem'] * H - .1 * H):] = False
        if side == 'l': probe[:, max(0, tl - int(.012 * W)):] = False
        else: probe[:, :tr + int(.012 * W)] = False
        n, lab, st, _ = cv2.connectedComponentsWithStats(probe.astype(np.uint8), 8)
        if n < 2: return None
        big = 1 + int(np.argmax(st[1:, 4]))
        if st[big, 4] < .004 * H * W: return None
        ys, xs = np.where(lab == big)
        cut[int(ys.max() + .015 * H):] = False
        sub = cut & (a[..., 3] > 0)
        # pivô: topo da silhueta na linha de corte (ponto do ombro)
        xc = tl if side == 'l' else tr
        col = np.where(m[:, max(0, xc - 2):xc + 3].any(1))[0]
        if not len(col): return None
        piv = np.array([xc, col.min()], float)
        # abertura da manga (punho): no contorno convexo, a aresta longa mais distante da linha de corte;
        # a direção do braço é a normal dessa aresta, para fora da manga
        hull = cv2.convexHull(np.stack([xs, ys], 1).astype(np.int32))
        poly = cv2.approxPolyDP(hull, .012 * W, True)[:, 0, :].astype(float)
        cen = np.array([xs.mean(), ys.mean()]); best = None
        for i in range(len(poly)):
            p0, p1 = poly[i], poly[(i + 1) % len(poly)]; ln = float(np.hypot(*(p1 - p0)))
            if ln < .035 * W: continue
            mid = (p0 + p1) / 2; t = (p1 - p0) / ln; nrm = np.array([-t[1], t[0]])
            if np.dot(nrm, mid - cen) < 0: nrm = -nrm
            if nrm[1] < -.05 or (nrm[0] > -.15 if side == 'l' else nrm[0] < .15): continue   # punho: para fora e para baixo
            score = abs(mid[0] - xc)
            if best is None or score > best[0]: best = (score, p0, p1, ln, nrm)
        if best is None: return None
        _, p0, p1, ow, nrm = best; op = (p0 + p1) / 2
        L = float(np.hypot(*(op - piv)))
        # camada da manga com borda de corte suavizada (2 px) e sombra
        al = np.where(sub, a[..., 3], 0).astype(np.float32)
        ramp = np.clip((xc - np.arange(W)) / 2.5 if side == 'l' else (np.arange(W) - xc) / 2.5, 0, 1)[None, :]
        al = al * ramp
        pad = int(.05 * W)
        y0, y1 = max(0, ys.min() - pad), min(H, ys.max() + pad); x0, x1 = (max(0, xs.min() - pad), min(W, xc + 2 * pad)) if side == 'l' else (max(0, xc - 2 * pad), min(W, xs.max() + pad))
        layer = np.zeros((y1 - y0, x1 - x0, 4), np.float32)
        layer[..., :3] = a[y0:y1, x0:x1, :3]; layer[..., 3] = al[y0:y1, x0:x1]
        sh = cv2.GaussianBlur(layer[..., 3], (0, 0), max(2., .012 * W)) * .42
        M = np.float32([[1, 0, (1 if side == 'l' else -1) * .012 * W], [0, 1, .008 * W]])
        sh = cv2.warpAffine(sh, M, (sh.shape[1], sh.shape[0]))
        A = layer[..., 3] / 255.; S = sh / 255. * (1 - A)
        out = np.zeros_like(layer); oa = A + S
        out[..., :3] = np.where(oa[..., None] > 0, layer[..., :3] * (A / np.maximum(oa, 1e-6))[..., None], 0)
        out[..., 3] = np.clip(oa * 255, 0, 255)
        parts[side] = {'img': out.astype(np.uint8), 'box': (x0, y0, x1, y1), 'piv': piv, 'op': op, 'ow': ow, 'len': L, 'n': nrm}
        torso[..., 3] = np.where(sub, (torso[..., 3] * (1 - ramp)).astype(np.uint8), torso[..., 3])
    # mangas são simétricas na peça: se um lado mediu fora da curva (punho com faixa/sombra), vale o ângulo do outro
    if len(parts) == 2:
        ang = {k: np.degrees(np.arctan2(abs(p['n'][0]), p['n'][1])) for k, p in parts.items()}
        if abs(ang['l'] - ang['r']) > 20:
            good = min(ang, key=lambda k: abs(ang[k] - 38)); bad = 'r' if good == 'l' else 'l'
            parts[bad]['n'] = np.array([-parts[good]['n'][0], parts[good]['n'][1]])
    s = min(1, MAXPX / max(W, H)); res = {}
    w, h = save(torso, f'{OUT}/{key}-torso.webp', MAXPX)
    res['torso'] = f'./assets/fit/{key}-torso.webp'
    for side, p in parts.items():
        x0, y0, x1, y1 = p['box']
        sw, shh = save(p['img'], f'{OUT}/{key}-sleeve-{side}.webp', round(max(x1 - x0, y1 - y0) * s))
        res[side] = {'src': f'./assets/fit/{key}-sleeve-{side}.webp', 'x': x0 / W, 'y': y0 / H, 'w': (x1 - x0) / W, 'h': (y1 - y0) / H,
                     'px': p['piv'][0] / W, 'py': p['piv'][1] / H, 'ox': p['op'][0] / W, 'oy': p['op'][1] / H, 'ow': p['ow'] / W,
                     'nx': float(p['n'][0]), 'ny': float(p['n'][1])}
    return res


def measure_top(a, kind):
    m = a[..., 3] > 110; H, W = m.shape; L, R = extents(m)
    wid = np.where(L >= 0, R - L, 0)
    ys = int(np.argmax(wid >= .55 * W))                 # linha dos ombros: fim do capuz/gola
    y2 = min(H - 1, ys + int(.03 * H))
    sw = int(wid[y2])
    band = range(ys, min(H, ys + int(.08 * H)))
    cx = float(np.mean([(L[y] + R[y]) / 2 for y in band if L[y] >= 0]))
    cb = m[:, max(0, int(cx - .06 * W)):int(cx + .06 * W) + 1]
    hem = int(np.where(cb.any(1))[0].max())
    hr = run_at(m[max(0, hem - int(.04 * H))], cx)
    hemw = (hr[1] - hr[0]) if hr else sw
    sleeves = {}
    tl, tr = (hr if hr else (int(cx - sw / 2), int(cx + sw / 2)))   # tronco = trecho central da barra
    for side in ('l', 'r'):
        long_ = kind in LONG
        if long_:   # manga longa pendurada: o punho é o ponto mais baixo da faixa externa
            sub = m[:, :int(.2 * W)] if side == 'l' else m[:, int(.8 * W):]
            off = 0 if side == 'l' else int(.8 * W)
        else:       # manga curta: só o que fica FORA do tronco, acima da barra
            sub = m[:int(hem - .12 * H), :max(1, tl - 3)] if side == 'l' else m[:int(hem - .12 * H), tr + 4:]
            off = 0 if side == 'l' else tr + 4
        yy, xx = np.where(sub)
        if not len(yy): continue
        yb = int(yy.max()); xx = xx + off
        if long_:
            sel = yy >= yb - .035 * H
            cxs = float(xx[sel].mean()); cw = float(xx[sel].max() - xx[sel].min() + 1)
            def cen(y0, y1):
                s = (yy >= y0) & (yy <= y1); return np.array([xx[s].mean(), yy[s].mean()]) if s.any() else None
            c1, c2 = cen(yb - .22 * H, yb - .1 * H), cen(yb - .06 * H, yb)
            d = (c2 - c1) if c1 is not None and c2 is not None else np.array([0, 1.])
            d = d / (np.hypot(*d) or 1)
            sleeves[side] = {'type': 'long', 'x': cxs / W, 'y': yb / H, 'w': cw / W, 'dx': float(d[0]), 'dy': float(d[1])}
        else:
            sleeves[side] = {'type': 'short', 'x': float(xx.mean()) / W, 'y': float(yy.mean()) / H, 'yb': yb / H}
    return {'sh': {'y': ys / H, 'w': sw / W}, 'cx': cx / W, 'hem': hem / H, 'hemw': hemw / W, 'sleeves': sleeves}


def measure_bottom(a):
    m = a[..., 3] > 110; H, W = m.shape; L, R = extents(m)
    y0 = int(np.argmax(L >= 0)); rows = [y for y in range(y0 + int(.02 * H), y0 + int(.05 * H) + 1) if L[y] >= 0]
    wl = float(np.mean([L[y] for y in rows])); wr = float(np.mean([R[y] for y in rows]))
    yr = H - 1 - int(.025 * H); row = m[yr]
    xs = np.where(row)[0]; runs = np.split(xs, np.where(np.diff(xs) > 2)[0] + 1) if len(xs) else []
    runs = [r for r in runs if len(r) >= .05 * W]
    if len(runs) >= 2:
        legs = [runs[0], runs[-1]]
        legs = [{'x': float((r[0] + r[-1]) / 2) / W, 'w': float(r[-1] - r[0] + 1) / W} for r in legs]
    else:
        r = runs[0] if runs else np.array([0, W - 1]); c, w = (r[0] + r[-1]) / 2, r[-1] - r[0] + 1
        legs = [{'x': float(c - w * .25) / W, 'w': float(w * .45) / W}, {'x': float(c + w * .25) / W, 'w': float(w * .45) / W}]
    for lg in legs:  # barra de cada perna
        x = int(lg['x'] * W); colb = m[:, max(0, x - 3):x + 4].any(1); lg['y'] = float(np.where(colb)[0].max()) / H
    return {'waist': {'y': y0 / H, 'l': wl / W, 'r': wr / W}, 'legs': legs}


def save(a, path, maxpx):
    im = Image.fromarray(a); s = min(1, maxpx / max(im.size))
    if s < 1: im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    im.save(path, 'WEBP', quality=84, method=6, alpha_quality=88)
    return im.size


def main():
    qa = sys.argv[sys.argv.index('--qa') + 1] if '--qa' in sys.argv else None
    cur = json.load(open(os.path.join(ROOT, 'data/gb-fit-curation.json')))
    os.makedirs(f'{OUT}/thumb', exist_ok=True)
    cat = {'version': 'fit-v16', 'top': {}, 'bottom': {}}
    tiles = []
    for p in cur['pieces']:
        a, srcname = load_piece(p['src'])
        meas = measure_top(a, p['kind']) if p['part'] == 'top' else measure_bottom(a)
        key = f"{p['product']}-{p['part']}"
        w, h = save(a, f'{OUT}/{key}.webp', MAXPX); save(a, f'{OUT}/thumb/{key}.webp', THUMB)
        entry = {'src': f'./assets/fit/{key}.webp', 'thumb': f'./assets/fit/thumb/{key}.webp', 'from': f'gb-crt-{srcname}',
                 'kind': p['kind'], 'w': w, 'h': h, **meas}
        if p['part'] == 'top' and p['kind'] in SHORT:
            rig = split_sleeves(a, meas, key)
            if rig:   # a foto inteira não é usada quando a peça tem rig: tronco + mangas
                entry['rig'] = rig; entry['src'] = rig['torso']; os.remove(f'{OUT}/{key}.webp')
        for k in ('scale', 'dy', 'dx'):
            if k in p: entry[k] = p[k]
        cat[p['part']][p['product']] = entry
        if qa: tiles.append(qa_tile(a, p, {**meas, **({'rig': entry['rig']} if 'rig' in entry else {})}))
    js = ('/* GB IMPORTS / V16 — FIT REAL. GERADO por scripts/gerar_fit_v16.py a partir de data/gb-fit-curation.json; não editar à mão.\n'
          ' * Peças reais do acervo (foto frontal recortada) e as âncoras medidas no próprio recorte. Dados comerciais seguem A VALIDAR. */\n'
          'window.GB_FIT_CATALOG=' + json.dumps(cat, ensure_ascii=False, separators=(',', ':')) + ';\n')
    open(os.path.join(ROOT, 'fit-catalog.js'), 'w').write(js)
    print(f"{len(cat['top'])} superiores, {len(cat['bottom'])} inferiores → fit-catalog.js ({len(js)//1024} KB)")
    if qa:
        os.makedirs(qa, exist_ok=True); C = 10
        out = Image.new('RGB', (200 * C, 230 * ((len(tiles) + C - 1) // C)), (30, 30, 30))
        for i, t in enumerate(tiles): out.paste(t, ((i % C) * 200, (i // C) * 230))
        out.save(f'{qa}/fit-qa.png'); print('QA:', f'{qa}/fit-qa.png')


def qa_tile(a, p, m):
    im = Image.fromarray(a); s = 190 / max(im.size); im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))))
    bg = Image.new('RGBA', (200, 230), (64, 64, 70, 255)); ox, oy = (200 - im.width) // 2, (200 - im.height) // 2
    bg.alpha_composite(im, (ox, oy)); d = ImageDraw.Draw(bg); W, H = im.size
    P = lambda x, y: (ox + x * W, oy + y * H)
    if p['part'] == 'top':
        y = m['sh']['y']; d.line([P(m['cx'] - m['sh']['w'] / 2, y), P(m['cx'] + m['sh']['w'] / 2, y)], fill=(255, 212, 71), width=2)
        d.line([P(m['cx'] - m['hemw'] / 2, m['hem']), P(m['cx'] + m['hemw'] / 2, m['hem'])], fill=(0, 255, 255), width=2)
        for sv in (m['rig'][k] for k in 'lr' if k in m.get('rig', {})):
            o = P(sv['ox'], sv['oy']); d.line([P(sv['px'], sv['py']), o], fill=(255, 0, 255), width=1)
            d.line([o, (o[0] + sv['nx'] * 30, o[1] + sv['ny'] * 30)], fill=(0, 255, 255), width=2)
        for sv in m['sleeves'].values():
            x, yy = P(sv['x'], sv['y']); d.ellipse([x - 4, yy - 4, x + 4, yy + 4], fill=(255, 0, 255) if sv['type'] == 'long' else (0, 255, 0))
    else:
        w = m['waist']; d.line([P(w['l'], w['y'] + .02), P(w['r'], w['y'] + .02)], fill=(255, 212, 71), width=2)
        for lg in m['legs']:
            x, y = P(lg['x'], lg['y']); d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(0, 255, 0))
    d.text((4, 214), f"{p['product'][7:]} {p['part'][0]} {p['kind']}", fill=(255, 255, 0))
    return bg.convert('RGB')


if __name__ == '__main__':
    main()
