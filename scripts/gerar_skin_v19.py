#!/usr/bin/env python3
"""V19 / GB UNIT — skin do manequim recortada da arte aprovada do personagem (assets/characters/gb-unit-ref.webp).

Igual ao rig da V15 (Gui e Vitin): a arte nunca é redesenhada, só separada em peças com âncoras nas juntas para o
look-fitting.js articular. Cada lado usa a própria arte daquele lado (o grafismo tribal só existe no lado direito
do personagem; nada é espelhado).
  - fundo claro removido (só o que toca a borda), franja branca da borda limpa;
  - o "GB" digitado da arte gerada sai (inpaint) e a UI põe o monograma oficial em SVG no lugar;
  - peças: cabeça, braço/antebraço/luva (esq./dir.), coxa/canela/bota (esq./dir.), com pontos de junta;
  - grava assets/fit/skin/*.webp e skin-catalog.js (window.GB_SKIN).
uso: python3 scripts/gerar_skin_v19.py [--qa pasta]
"""
import json, os, sys
import numpy as np, cv2
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets/characters/gb-unit-ref.webp')
OUT = os.path.join(ROOT, 'assets/fit/skin')

# juntas medidas na arte (px da imagem 1024×1536), olhando a imagem com régua
J = {'shL': (300, 330), 'elL': (252, 565), 'wrL': (238, 733), 'tipL': (262, 890),
     'shR': (722, 330), 'elR': (768, 562), 'wrR': (790, 735), 'tipR': (775, 892),
     'hipL': (418, 800), 'knL': (386, 1030), 'anL': (368, 1338), 'toeL': (300, 1500),
     'hipR': (612, 800), 'knR': (645, 1030), 'anR': (664, 1338), 'toeR': (730, 1500)}
# peças: polígono de recorte (inclui a sobreposição na junta) e as duas âncoras
PIECES = {
    'head':   {'poly': [(410, 18), (626, 18), (626, 232), (592, 246), (590, 284), (446, 284), (444, 246), (410, 232)], 'a': (518, 27), 'b': (518, 255)},
    'upL':    {'poly': [(176, 246), (330, 246), (358, 296), (362, 430), (350, 474), (318, 560), (300, 604), (196, 604), (176, 520)], 'a': J['shL'], 'b': J['elL']},
    'foL':    {'poly': [(180, 536), (322, 536), (322, 752), (180, 752)], 'a': J['elL'], 'b': J['wrL']},
    'haL':    {'poly': [(178, 718), (318, 718), (318, 912), (178, 912)], 'a': J['wrL'], 'b': J['tipL']},
    'upR':    {'poly': [(664, 246), (790, 246), (812, 330), (820, 470), (826, 604), (712, 604), (680, 530), (664, 474), (660, 300)], 'a': J['shR'], 'b': J['elR']},
    'foR':    {'poly': [(696, 536), (846, 536), (846, 752), (696, 752)], 'a': J['elR'], 'b': J['wrR']},
    'haR':    {'poly': [(706, 718), (852, 718), (852, 912), (706, 912)], 'a': J['wrR'], 'b': J['tipR']},
    'thL':    {'poly': [(282, 740), (512, 740), (512, 832), (500, 1012), (282, 1012)], 'a': J['hipL'], 'b': J['knL']},
    'shinL':  {'poly': [(282, 972), (478, 972), (478, 1352), (282, 1352)], 'a': J['knL'], 'b': J['anL']},
    'bootL':  {'poly': [(214, 1312), (440, 1312), (440, 1514), (214, 1514)], 'a': J['anL'], 'b': J['toeL']},
    'thR':    {'poly': [(512, 740), (746, 740), (746, 1012), (532, 1012), (512, 832)], 'a': J['hipR'], 'b': J['knR']},
    'shinR':  {'poly': [(548, 972), (760, 972), (760, 1352), (548, 1352)], 'a': J['knR'], 'b': J['anR']},
    'bootR':  {'poly': [(600, 1312), (820, 1312), (820, 1514), (600, 1514)], 'a': J['anR'], 'b': J['toeR']},
}
GB_TEXT = (456, 96, 508, 130)        # caixa do "GB" digitado na testa
EYES = [(474, 152), (555, 152)]      # centro dos olhos (para o brilho da UI)


def cutout(a):
    H, W = a.shape[:2]; c = a.astype(np.int16)
    mx, mn = c.max(2), c.min(2)
    bgc = (mn > 222) & ((mx - mn) < 16)
    n, lab = cv2.connectedComponents(bgc.astype(np.uint8), connectivity=4)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fg = (~np.isin(lab, list(edge))).astype(np.uint8) * 255
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # franja: o halo claro de 2–3 px colado na borda sai
    inner = cv2.erode(fg, np.ones((3, 3), np.uint8), iterations=2)
    ring = (fg > 0) & (inner == 0)
    light = (mn > 150) & ((mx - mn) < 60)
    fg[ring & light] = 0
    fg = cv2.erode(fg, np.ones((2, 2), np.uint8), iterations=1)
    al = cv2.GaussianBlur(fg, (0, 0), .7)
    return al


def main():
    qa = sys.argv[sys.argv.index('--qa') + 1] if '--qa' in sys.argv else None
    os.makedirs(OUT, exist_ok=True)
    rgb = np.array(Image.open(SRC).convert('RGB'))
    al = cutout(rgb)
    # "GB" digitado sai: inpaint a partir do capacete em volta (o monograma oficial entra pela UI)
    x0, y0, x1, y1 = GB_TEXT; m = np.zeros(al.shape, np.uint8); m[y0:y1, x0:x1] = 255
    rgb = cv2.inpaint(rgb, m, 7, cv2.INPAINT_TELEA)
    rgba = np.dstack([rgb, al])
    cat = {'version': 'skin-v19', 'src': 'assets/characters/gb-unit-ref.webp', 'pieces': {}}
    for k, p in PIECES.items():
        H, W = al.shape; mask = np.zeros((H, W), np.uint8)
        cv2.fillPoly(mask, [np.array(p['poly'], np.int32)], 255)
        mask = cv2.GaussianBlur(mask, (0, 0), 1.2)
        piece = rgba.copy(); piece[..., 3] = (piece[..., 3].astype(np.float32) * mask / 255).astype(np.uint8)
        # só a maior mancha (pontas de dedo vizinhas não entram na coxa, etc.)
        n, lab, st, _ = cv2.connectedComponentsWithStats((piece[..., 3] > 40).astype(np.uint8), 8)
        if n > 2:
            big = 1 + int(np.argmax(st[1:, 4])); keepm = cv2.dilate((lab == big).astype(np.uint8), np.ones((5, 5), np.uint8))
            piece[..., 3] = np.where(keepm > 0, piece[..., 3], 0)
        if k == 'head':   # o pescoço da arte some aos poucos: a UI desenha o pescoço que entra na gola
            yy = np.arange(H)[:, None]; fade = np.clip((282 - yy) / 22, 0, 1)
            piece[..., 3] = (piece[..., 3] * fade).astype(np.uint8)
        ys, xs = np.where(piece[..., 3] > 8)
        bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        im = Image.fromarray(piece[by0:by1, bx0:bx1])
        im.save(f'{OUT}/{k}.webp', 'WEBP', quality=88, method=6, alpha_quality=90)
        rel = lambda pt: [round(float(pt[0] - bx0), 1), round(float(pt[1] - by0), 1)]
        e = {'src': f'./assets/fit/skin/{k}.webp', 'w': int(bx1 - bx0), 'h': int(by1 - by0), 'a': rel(p['a']), 'b': rel(p['b'])}
        # largura da peça ao longo do eixo a→b (perpendicular), para o encaixe em mangas e bocas de perna
        A = np.array(p['a'], float); Bv = np.array(p['b'], float); ax = (Bv - A) / np.linalg.norm(Bv - A); nr = np.array([-ax[1], ax[0]])
        al2 = piece[..., 3] > 100; wid = []
        for t in np.linspace(0, 1, 11):
            c = A + (Bv - A) * t; pts = [c + nr * d for d in range(-160, 161)]
            on = [d for d, q in zip(range(-160, 161), pts) if 0 <= int(q[1]) < H and 0 <= int(q[0]) < W and al2[int(q[1]), int(q[0])]]
            wid.append(round(float(max(on) - min(on) + 1), 1) if on else 0.0)
        e['len'] = round(float(np.linalg.norm(Bv - A)), 1); e['wid'] = wid
        if k == 'head':
            e['eyes'] = [rel(c) for c in EYES]; e['mono'] = [rel((GB_TEXT[0] - 4, GB_TEXT[1] - 2)), rel((GB_TEXT[2] + 4, GB_TEXT[3] + 2))]
        cat['pieces'][k] = e
    js = ('/* GB IMPORTS / V19 — GB UNIT. GERADO por scripts/gerar_skin_v19.py a partir da arte aprovada do personagem; não editar à mão.\n'
          ' * Peças da skin com as âncoras de junta (px da própria peça). */\n'
          'window.GB_SKIN=' + json.dumps(cat, separators=(',', ':')) + ';\n')
    open(os.path.join(ROOT, 'skin-catalog.js'), 'w').write(js)
    print(len(cat['pieces']), 'peças → skin-catalog.js', sum(os.path.getsize(f'{OUT}/{k}.webp') for k in PIECES) // 1024, 'KB')
    if qa:
        os.makedirs(qa, exist_ok=True)
        bg = Image.new('RGBA', (rgba.shape[1], rgba.shape[0]), (60, 60, 70, 255)); bg.alpha_composite(Image.fromarray(rgba)); d = ImageDraw.Draw(bg)
        for k, p in PIECES.items():
            d.line(p['poly'] + [p['poly'][0]], fill=(0, 255, 255), width=2); d.line([p['a'], p['b']], fill=(255, 0, 255), width=3)
            for q in (p['a'], p['b']): d.ellipse([q[0] - 6, q[1] - 6, q[0] + 6, q[1] + 6], outline=(255, 255, 0), width=2)
        bg.convert('RGB').save(f'{qa}/skin-qa.png')


if __name__ == '__main__':
    main()
