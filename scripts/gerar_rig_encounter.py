#!/usr/bin/env python3
"""V15 / THE ENCOUNTER — gera as camadas articuladas de Gui e Vitin a partir das ilustrações APROVADAS.

Nada é redesenhado: a mão do Gui e a cabeça do Vitin são RECORTADAS dos próprios arquivos e giram em CSS.
Só o que ficava ESCONDIDO atrás delas é reconstruído na base (camisa, trecho do oval do logo, pescoço),
para que o movimento não abra buraco. Rosto, cores, roupa e proporções ficam exatamente como no arquivo.

uso: python3 scripts/gerar_rig_encounter.py <gui.png|webp> <vitin.png|webp> [saida=assets/characters]
gera, para desktop (1280 px de altura) e celular (720 px, sufixo -m):
  gb-gui-base / gb-gui-hand   — mão do gesto separada no pulso (pivô em RIG['gui'])
  gb-vitin-base / gb-vitin-head — cabeça separada acima da gola (pivô em RIG['vitin'])
e imprime os pivôs em % para o CSS (gb-encounter-v15.css).
"""
import sys, os, json
import numpy as np, cv2
from PIL import Image

def load(path):
    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    al = a[..., 3]
    al[al <= 8] = 0; al[al >= 244] = 255          # só limpa o ruído do alfa
    ys, xs = np.where(al > 0)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return a

def lumi(a):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    return (r * 299 + g * 587 + b * 114) // 1000

def fill_holes(m):
    ff = m.copy(); h, w = m.shape; z = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(ff, z, (0, 0), 1); m[ff == 0] = 1; return m

# ---------------------------------------------------------------- GUI: a mão do gesto
def gui_rig(a):
    H, W = a.shape[:2]
    r, g, b, al = [a[..., i].astype(int) for i in range(4)]
    L = lumi(a)
    box = np.zeros((H, W), bool); box[int(H*.282):int(H*.405), int(W*.415):int(W*.737)] = True
    skin = (r > 95) & (r > g + 8) & (g > b + 5) & ((r - b) > 38) & (al > 200) & (r < 250)
    m = (skin & box).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    hand = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    hand = fill_holes(cv2.morphologyEx(hand, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8)))
    # o traço do desenho em volta da mão é marrom; o do oval do logo é preto neutro e fica na base
    near = cv2.dilate(hand, np.ones((9, 9), np.uint8)).astype(bool)
    outline = near & ~hand.astype(bool) & (L < 150) & ((r - b) > 22) & box
    full = (hand.astype(bool) | outline).astype(np.uint8)
    full = cv2.morphologyEx(full, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    # pivô no pulso: borda esquerda do relógio, meio da altura do pulso
    piv = (int(W * .7154), int(H * .3731))   # centro do pulso, junto da borda esquerda do relógio
    hand_l = a.copy(); soft = cv2.GaussianBlur(full.astype(np.float32), (3, 3), 0)
    hand_l[..., 3] = (hand_l[..., 3] * np.clip(soft * 1.7, 0, 1)).astype(np.uint8)
    # ---- base: reconstrói só o que a mão escondia
    hole = cv2.dilate(full, np.ones((5, 5), np.uint8))
    rgb = a[..., :3].copy()
    ip = cv2.inpaint(rgb, hole * 255, 7, cv2.INPAINT_TELEA)
    # oval do logo: borda de cima e de baixo do anel medidas por coluna (fora da mão) e ajustadas a uma elipse
    dark = (L < 75) & (np.abs(r - b) < 18) & (al > 200)
    # só a faixa do logo (o contorno do braço à esquerda também é preto e contaminaria o ajuste)
    X0, X1 = int(W * .228), int(W * .702); pts = []
    for y in range(int(H * .267), int(H * .334)):
        c = np.where(dark[y, X0:X1])[0]
        if len(c):
            for xx in (X0 + c[0], X0 + c[-1]):
                if not hole[y, xx]: pts.append((xx, y))
    for x in range(X0, X1):
        c = np.where(dark[int(H * .258):int(H * .282), x])[0]
        if len(c) and not hole[int(H * .258) + c[0], x]: pts.append((x, int(H * .258) + c[0]))
        c = np.where(dark[int(H * .324):int(H * .345), x])[0]
        if len(c) and not hole[int(H * .324) + c[-1], x]: pts.append((x, int(H * .324) + c[-1]))
    pts = np.array(pts, np.float32)
    (ex, ey), (ea, eb), eang = cv2.fitEllipse(pts)
    col = dark[int(H * .258):int(H * .29), int(ex)]
    s0 = int(np.argmax(col)); th = max(4, int(np.argmax(~col[s0:])) if col.any() else 7)
    ringc = np.median(rgb[dark & (np.abs(np.arange(H)[:, None] - ey) < eb) & (np.abs(np.arange(W)[None, :] - ex) < ea / 2) & ~hole.astype(bool)], axis=0)
    # miolo do oval sob os dedos: o creme do próprio logo (sem borrar as linhas d'água)
    inside = np.zeros((H, W), np.uint8); cv2.ellipse(inside, ((ex, ey), (ea - 2 * th, eb - 2 * th), eang), 1, -1)
    light = (L > 200) & inside.astype(bool) & ~hole.astype(bool)
    cream = np.median(rgb[light], axis=0) if light.any() else np.array([243, 235, 226])
    # fora do oval, a sombra dos dedos na camisa também sai (senão o preenchimento a espalha como mancha)
    wide = cv2.dilate(full, np.ones((11, 11), np.uint8)) & (1 - cv2.dilate(inside, np.ones((9, 9), np.uint8)))
    lim = np.zeros((H, W), np.uint8); lim[int(ey):int(ey + eb / 2 + H * .035), X0:int(W * .66)] = 1   # só logo abaixo do oval
    wide &= lim
    hole = np.maximum(hole, wide)
    # o preto do anel não pode vazar para a camisa: no preenchimento, o oval inteiro vira cor de camisa
    oval = np.zeros((H, W), np.uint8); cv2.ellipse(oval, ((ex, ey), (ea + 6, eb + 6), eang), 1, -1)
    shirtpx = (L > 205) & ~oval.astype(bool) & (cv2.dilate(oval, np.ones((41, 41), np.uint8)) > 0) & ~hole.astype(bool)
    shirtc = np.median(rgb[shirtpx], axis=0).astype(np.uint8) if shirtpx.any() else cream.astype(np.uint8)
    src2 = rgb.copy(); src2[oval > 0] = shirtc
    ip = cv2.inpaint(src2, hole * 255, 9, cv2.INPAINT_TELEA)
    fin = (inside > 0) & (hole > 0)
    ip[fin] = cream.astype(np.uint8)
    ringm = np.zeros((H, W), np.uint8)
    cv2.ellipse(ringm, ((ex, ey), (ea - th, eb - th), eang), 255, thickness=th, lineType=cv2.LINE_AA)
    k = (ringm.astype(np.float32) / 255.0) * (hole > 0)
    ip = (ip * (1 - k[..., None]) + ringc[None, None, :] * k[..., None]).astype(np.uint8)
    base = a.copy(); base[..., :3] = np.where(hole[..., None] > 0, ip, a[..., :3])
    # articulação do pulso: um disco de pele sob a mão para o giro não abrir fresta
    sk = rgb[(hand > 0) & (np.abs(np.arange(W)[None, :] - piv[0]) < 40)]
    skc = np.median(sk, axis=0) if len(sk) else np.array([190, 120, 90])
    jm = np.zeros((H, W), np.uint8); cv2.ellipse(jm, piv, (int(W*.04), int(H*.019)), 0, 0, 360, 255, -1, cv2.LINE_AA)
    jk = cv2.GaussianBlur(jm, (5, 5), 0).astype(np.float32) / 255 * (hole > 0)
    base[..., :3] = (base[..., :3] * (1 - jk[..., None]) + skc[None, None, :] * jk[..., None]).astype(np.uint8)
    return base, hand_l, piv, {'ellipse': [float(ex), float(ey), float(ea), float(eb), float(eang)], 'ring': int(th)}

# ---------------------------------------------------------------- VITIN: a cabeça (aceno de queixo)
def vitin_rig(a):
    H, W = a.shape[:2]
    r, g, b, al = [a[..., i].astype(int) for i in range(4)]
    L = lumi(a)
    skin = (r > 105) & (r > g + 8) & (g > b) & ((r - b) > 30) & (al > 200)
    shirt = (L < 55) & (al > 200)
    # gola: primeiro trecho SÓLIDO da camiseta preta por coluna (o traço do queixo é fino e não conta)
    y0, y1 = int(H * .15), int(H * .26)
    collar = np.full(W, -1)
    for x in range(int(W * .15), int(W * .85)):
        col = shirt[y0:y1, x]; run = 0
        for i, v in enumerate(col):
            run = run + 1 if v else 0
            if run >= 10: collar[x] = y0 + i - 9; break
    xs = np.where(collar > 0)[0]
    sm = collar.astype(float)
    for x in xs:  # suaviza a curva da gola
        win = collar[max(0, x - 6):x + 7]; win = win[win > 0]; sm[x] = np.median(win)
    cut = np.full(W, int(H * .17))
    cut[xs] = (sm[xs] - 3).astype(int)
    head = np.zeros((H, W), np.uint8)
    for x in range(W): head[:cut[x], x] = 1
    head &= (al > 0).astype(np.uint8)
    # pivô na base do pescoço, no meio das colunas de pele logo acima da gola
    neckcols = [x for x in xs if skin[max(0, cut[x] - 4), x]]
    px = int(np.median(neckcols)) if neckcols else W // 2
    piv = (px, int(sm[px]) if collar[px] > 0 else int(H * .19))
    head_l = a.copy(); head_l[..., 3] = (head_l[..., 3] * head).astype(np.uint8)
    # base: sem a cabeça, mas com a pele REAL do pescoço que fica abaixo do queixo (sobe até o traço da mandíbula)
    keep = np.zeros((H, W), np.uint8)
    for x in neckcols:
        y = cut[x] - 1
        while y > 0 and skin[y, x] and cut[x] - y < int(H * .04): keep[y, x] = 1; y -= 1
    keep = cv2.morphologyEx(keep, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    base = a.copy(); base[..., 3] = (base[..., 3] * np.maximum(1 - head, keep)).astype(np.uint8)
    return base, head_l, piv, {'neck_px': int(keep.sum())}

def save(a, path, h):
    im = Image.fromarray(a); w = round(im.width * h / im.height)
    im.resize((w, h), Image.LANCZOS).save(path, 'WEBP', quality=86, method=6, alpha_quality=90)
    return w

if __name__ == '__main__':
    gui_p, vit_p = sys.argv[1], sys.argv[2]; out = sys.argv[3] if len(sys.argv) > 3 else 'assets/characters'
    os.makedirs(out, exist_ok=True); info = {}
    for name, path, fn in (('gui', gui_p, gui_rig), ('vitin', vit_p, vitin_rig)):
        a = load(path); base, part, piv, extra = fn(a); H, W = a.shape[:2]
        partname = 'hand' if name == 'gui' else 'head'
        for tag, h in (('', 1280), ('-m', 720)):
            save(base, f'{out}/gb-{name}-base{tag}.webp', h); save(part, f'{out}/gb-{name}-{partname}{tag}.webp', h)
        info[name] = {'size': [W, H], 'ratio': round(W / H, 4), 'pivot_px': list(map(int, piv)),
                      'pivot_pct': [round(piv[0] / W * 100, 2), round(piv[1] / H * 100, 2)], **extra}
    print(json.dumps(info, indent=1))
