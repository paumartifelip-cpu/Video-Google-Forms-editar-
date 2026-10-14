"""Split each source image into animatable layers.

For every image we produce:
  - bg       : background with pastries + bubble + text removed (inpainted)
  - pastries : list of RGBA cut-outs (one per pastry) with their bbox
  - bubble   : RGBA cut-out of the glass bubble, text removed
  - lines    : list of RGBA cut-outs, one per text line

Everything is stored as premultiplied float16 in layers/<n>.npz.
"""
import os
import sys
import pickle
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "assets", "%d.webp")
OUT = os.path.join(HERE, "build", "layers")


def soft(mask, feather):
    m = mask.astype(np.float32) / 255.0
    if feather > 0:
        k = feather * 2 + 1
        m = cv2.GaussianBlur(m, (k, k), feather / 2.0)
    return m


def fill_holes(mask):
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = np.zeros_like(mask)
    cv2.drawContours(out, cnts, -1, 255, -1)
    return out


def inpaint_lowres(img, mask):
    big = pushpull_fill(img, cv2.dilate(mask, np.ones((9, 9), np.uint8)))
    big = cv2.GaussianBlur(big, (0, 0), 6)
    a = soft(cv2.dilate(mask, np.ones((15, 15), np.uint8)), 12)[..., None]
    return np.clip(img * (1 - a) + big * a, 0, 255).astype(np.uint8)


def crop_rgba(img, alpha, pad=4):
    ys, xs = np.where(alpha > 0.01)
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, img.shape[1])
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, img.shape[0])
    rgb = img[y0:y1, x0:x1].astype(np.float32) / 255.0
    a = alpha[y0:y1, x0:x1, None].astype(np.float32)
    rgba = np.concatenate([rgb * a, a], axis=2)  # premultiplied
    return rgba.astype(np.float16), (int(x0), int(y0), int(x1), int(y1))


def text_mask(img, pastry_union):
    h, w = img.shape[:2]
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    dark = (g < 80).astype(np.uint8) * 255
    zone = np.zeros_like(dark)
    zone[int(h * 0.22):int(h * 0.80), int(w * 0.18):int(w * 0.82)] = 255
    dark &= zone
    dark &= ~cv2.dilate(pastry_union, np.ones((25, 25), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(dark)
    comps = [dict(i=j, x=st[j, 0], y=st[j, 1], w=st[j, 2], h=st[j, 3], a=st[j, 4], cy=cen[j][1])
             for j in range(1, n) if st[j, 4] > 25 and st[j, 3] < 160]
    big = [c for c in comps if c["a"] > 400]
    med_h = float(np.median([c["h"] for c in big]))
    # cluster glyphs into lines by vertical centre
    big.sort(key=lambda c: c["cy"])
    lines = []
    for c in big:
        if lines and c["cy"] - np.mean([d["cy"] for d in lines[-1]]) < 0.55 * med_h:
            lines[-1].append(c)
        else:
            lines.append([c])
    lines = [L for L in lines if len(L) >= 2]
    spans = [[min(c["y"] for c in L), max(c["y"] + c["h"] for c in L)] for L in lines]
    xs = [[min(c["x"] for c in L), max(c["x"] + c["w"] for c in L)] for L in lines]
    members = [[c["i"] for c in L] for L in lines]
    # attach accents, dots and commas (anything not yet in a line) to the nearest line
    used = {i for mem in members for i in mem}
    for c in comps:
        if c["i"] in used:
            continue
        cy = c["cy"]
        cx = c["x"] + c["w"] / 2
        best, bd = None, 1e9
        for k, (a, b) in enumerate(spans):
            if not (xs[k][0] - 30 <= cx <= xs[k][1] + 30):
                continue
            d = 0 if a <= cy <= b else min(abs(cy - a), abs(cy - b))
            if d < bd:
                best, bd = k, d
        if best is not None and bd < 45:
            members[best].append(c["i"])
    masks = []
    for mem in members:
        m = np.isin(lab, mem).astype(np.uint8) * 255
        masks.append(m)
    full = np.zeros_like(dark)
    for m in masks:
        full |= m
    ys, xs_ = np.where(full > 0)
    box = (int(xs_.min()), int(ys.min()), int(xs_.max()) + 1, int(ys.max()) + 1)
    return full, masks, box


def pushpull_fill(img, mask):
    """Fill masked pixels with a smooth pyramid interpolation (no streaks)."""
    f = img.astype(np.float32)
    wgt = (mask == 0).astype(np.float32)
    levels = []
    cf, cw = f * wgt[..., None], wgt
    while min(cw.shape) > 4:
        levels.append((cf, cw))
        cf = cv2.pyrDown(cf)
        cw = cv2.pyrDown(cw)
    est = cf / np.maximum(cw[..., None], 1e-6)
    for cf, cw in reversed(levels):
        est = cv2.resize(est, (cw.shape[1], cw.shape[0]), interpolation=cv2.INTER_LINEAR)
        est = cv2.GaussianBlur(est, (5, 5), 0)
        known = cf / np.maximum(cw[..., None], 1e-6)
        a = np.clip(cw * 1.5, 0, 1)[..., None]
        est = known * a + est * (1 - a)
    return est


def superellipse(shape, cx, cy, ax, ay, p=3.0):
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.abs((xx - cx) / ax) ** p + np.abs((yy - cy) / ay) ** p
    return d


def process(n, debug_dir):
    img = cv2.imread(SRC % n)
    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hh, ss, vv = [hsv[..., k].astype(int) for k in range(3)]

    # ---- pastries: warm brown / pink / dark, against the saturated yellow bg
    raw = (((hh < 20) | (hh > 160) | (vv < 150))).astype(np.uint8) * 255
    raw = cv2.morphologyEx(raw, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    raw = cv2.morphologyEx(raw, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))

    n_c, lab, st, cen = cv2.connectedComponentsWithStats(raw)
    pastries = []
    pastry_union = np.zeros_like(raw)
    for j in range(1, n_c):
        x, y, bw, bh, area = st[j]
        if area < 15000:
            continue
        # skip the text block itself (wide component around the centre)
        bcx, bcy = x + bw / 2, y + bh / 2
        if abs(bcx - w / 2) < 260 and abs(bcy - h / 2) < 260 and bw > 550:
            continue
        m = (lab == j).astype(np.uint8) * 255
        m = fill_holes(m)
        # convex-ish smoothing to repair bites from glossy highlights
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
        m = fill_holes(m)
        m = cv2.erode(m, np.ones((3, 3), np.uint8))
        pastry_union |= m
        a = soft(m, 3)
        rgba, bb = crop_rgba(img, a)
        # which borders does it touch (for slide-in direction)
        touch = dict(l=bb[0] <= 2, t=bb[1] <= 2, r=bb[2] >= w - 2, b=bb[3] >= h - 2)
        pastries.append(dict(rgba=rgba, bbox=bb, center=(float(cen[j][0]), float(cen[j][1])), touch=touch, area=int(area)))

    tmask, line_masks, tbox = text_mask(img, pastry_union)
    tx0, ty0, tx1, ty1 = tbox
    tcx, tcy = (tx0 + tx1) / 2, (ty0 + ty1) / 2

    # ---- bubble: superellipse around the text block
    ax = (tx1 - tx0) / 2 + 150
    ay = (ty1 - ty0) / 2 + 125
    d = superellipse((h, w), tcx, tcy, ax, ay, 2.6)
    bub = np.clip((1.0 - d) / 0.12, 0, 1).astype(np.float32)  # soft edge
    bub *= 1.0 - soft(pastry_union, 4)

    # remove text from the bubble image
    tdil = cv2.dilate(tmask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    no_text = img.copy()
    pad = 30
    sl = (slice(ty0 - pad, ty1 + pad), slice(tx0 - pad, tx1 + pad))
    no_text[sl] = cv2.inpaint(img[sl], tdil[sl], 11, cv2.INPAINT_TELEA)
    blurred = cv2.GaussianBlur(no_text, (0, 0), 6)
    ta = soft(tdil, 6)[..., None]
    no_text = (no_text * (1 - ta) + blurred * ta).astype(np.uint8)
    bubble_rgba, bubble_bb = crop_rgba(no_text, bub)

    # ---- text lines (letters + their white glow)
    lines = []
    for lm in line_masks:
        glow = cv2.dilate(lm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
        la = soft(glow, 5)
        rgba, bb = crop_rgba(img, la)
        lines.append(dict(rgba=rgba, bbox=bb))

    # ---- background: remove pastries + bubble
    bub_hard = (np.clip((1.0 - d) / 0.12 + 0.35, 0, 1) > 0.05).astype(np.uint8) * 255
    holes = cv2.dilate(pastry_union, np.ones((11, 11), np.uint8)) | bub_hard
    bg = inpaint_lowres(img, holes)

    data = dict(bg=bg, pastries=pastries, bubble=dict(rgba=bubble_rgba, bbox=bubble_bb),
                lines=lines, text_box=tbox, text_center=(tcx, tcy), size=(w, h))
    with open(os.path.join(OUT, "%d.pkl" % n), "wb") as f:
        pickle.dump(data, f, protocol=4)

    if debug_dir:
        cv2.imwrite(os.path.join(debug_dir, "bg%d.jpg" % n), cv2.resize(bg, (1000, 566)))
        vis = (img * 0.25).astype(np.uint8)
        colors = [(0, 0, 255), (0, 255, 0), (255, 0, 0), (0, 255, 255), (255, 0, 255), (255, 255, 0)]
        for i, L in enumerate(lines):
            x0, y0, x1, y1 = L["bbox"]
            cv2.rectangle(vis, (x0, y0), (x1, y1), colors[i % 6], 3)
        for P in pastries:
            x0, y0, x1, y1 = P["bbox"]
            a = P["rgba"][..., 3:].astype(np.float32)
            vis[y0:y1, x0:x1] = (vis[y0:y1, x0:x1] * (1 - a) + img[y0:y1, x0:x1] * a).astype(np.uint8)
        x0, y0, x1, y1 = bubble_bb
        cv2.rectangle(vis, (x0, y0), (x1, y1), (255, 255, 255), 2)
        cv2.imwrite(os.path.join(debug_dir, "layers%d.jpg" % n), cv2.resize(vis, (1000, 566)))
        b = bubble_rgba.astype(np.float32)
        bv = (b[..., :3] + (1 - b[..., 3:]) * 0.2) * 255
        cv2.imwrite(os.path.join(debug_dir, "bubble%d.jpg" % n), bv.astype(np.uint8))
    print("image", n, "pastries", len(pastries), "lines", len(lines), "textbox", tbox)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    dbg = sys.argv[1] if len(sys.argv) > 1 else None
    if dbg:
        os.makedirs(dbg, exist_ok=True)
    for n in range(1, 6):
        process(n, dbg)
