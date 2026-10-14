"""30 s / 60 fps motion-graphics sequence built from the 5 layered images.

    python3 render.py                 # full render -> build/motion.mp4
    python3 render.py --stills 1.0 6.5  # preview frames as JPG
    python3 render.py --scale 0.5     # quick low-res draft

Timeline (seconds)
  0.00 - 1.35  intro: three dots bounce in, goo-merge, blob reveal of image 1
  6.00 - 6.90  layered liquid blob wipe            1 -> 2
 12.10 - 12.90 whip pan with speed lines           2 -> 3
 18.20 - 19.10 diagonal pill stripes               3 -> 4
 24.20 - 25.00 zoom-through + bouncy iris          4 -> 5
 28.30 - 30.00 frame shrinks to a card, final bounce, confetti, settle
"""
import argparse
import math
import os
import pickle
import subprocess
import sys
from multiprocessing import Pool

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
LAYERS = os.path.join(HERE, "build", "layers")

FPS = 60
DURATION = 30.0
W, H = 1920, 1080
SRC_W, SRC_H = 2000, 1131

# palette (BGR, 0..1)
def hex2bgr(h):
    h = h.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return np.array([b, g, r], np.float32) / 255.0

ORANGE = hex2bgr("#FF9F1C")
DEEP = hex2bgr("#FF7A00")
CREAM = hex2bgr("#FFF2BF")
WHITE = hex2bgr("#FFFFFF")
YELLOW = hex2bgr("#FFD43B")
SUN = hex2bgr("#FFE45C")
PINK = hex2bgr("#FF8FAB")

# scale factor for drafts (set in main / worker init)
SCALE = 1.0


# --------------------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def spring(t, f=1.6, z=0.5):
    """Damped spring step response 0 -> 1 (overshoots when z < 1)."""
    if t <= 0:
        return 0.0
    w = 2 * math.pi * f
    if z >= 1:
        return 1 - math.exp(-w * t) * (1 + w * t)
    wd = w * math.sqrt(1 - z * z)
    return 1 - math.exp(-z * w * t) * (math.cos(wd * t) + z * w / wd * math.sin(wd * t))


def ease_in_expo(u):
    u = clamp(u)
    return 0.0 if u == 0 else 2 ** (10 * u - 10)


def ease_out_expo(u):
    u = clamp(u)
    return 1.0 if u == 1 else 1 - 2 ** (-10 * u)


def ease_in_out_expo(u):
    u = clamp(u)
    if u == 0 or u == 1:
        return u
    return 2 ** (20 * u - 10) / 2 if u < 0.5 else (2 - 2 ** (-20 * u + 10)) / 2


def ease_in_out_cubic(u):
    u = clamp(u)
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def ease_in_back(u, s=1.7):
    u = clamp(u)
    return (s + 1) * u ** 3 - s * u ** 2


def ease_out_back(u, s=1.7):
    u = clamp(u) - 1
    return 1 + (s + 1) * u ** 3 + s * u ** 2


def smooth(u):
    u = clamp(u)
    return u * u * (3 - 2 * u)


def bounce_out(u):
    """Penner bounce; returns (value, squash impulse)."""
    u = clamp(u)
    n1, d1 = 7.5625, 2.75
    if u < 1 / d1:
        v = n1 * u * u
    elif u < 2 / d1:
        u2 = u - 1.5 / d1
        v = n1 * u2 * u2 + 0.75
    elif u < 2.5 / d1:
        u2 = u - 2.25 / d1
        v = n1 * u2 * u2 + 0.9375
    else:
        u2 = u - 2.625 / d1
        v = n1 * u2 * u2 + 0.984375
    return v


def wobble(t, decay=3.5, freq=2.6):
    if t <= 0:
        return 0.0
    return math.exp(-decay * t) * math.sin(2 * math.pi * freq * t)


# --------------------------------------------------------------------------- matrices
def mat(a=1, b=0, c=0, d=0, e=1, f=0):
    return np.array([[a, b, c], [d, e, f], [0, 0, 1]], np.float64)


def T(x, y):
    return mat(1, 0, x, 0, 1, y)


def S(sx, sy=None):
    return mat(sx, 0, 0, 0, sy if sy is not None else sx, 0)


def R(deg):
    r = math.radians(deg)
    c, s = math.cos(r), math.sin(r)
    return mat(c, -s, 0, s, c, 0)


def about(M, x, y):
    return T(x, y) @ M @ T(-x, -y)


# --------------------------------------------------------------------------- drawing
def blit(canvas, rgba, ox, oy, M, alpha=1.0):
    """Composite a premultiplied RGBA crop (whose top-left is at ox,oy in its own
    coordinate system) onto canvas with affine M (3x3)."""
    if alpha <= 0.002:
        return
    h, w = rgba.shape[:2]
    Mc = M @ T(ox, oy)
    pts = np.array([[0, 0, 1], [w, 0, 1], [0, h, 1], [w, h, 1]], np.float64).T
    q = Mc @ pts
    x0 = int(max(math.floor(q[0].min()) - 1, 0))
    y0 = int(max(math.floor(q[1].min()) - 1, 0))
    x1 = int(min(math.ceil(q[0].max()) + 1, canvas.shape[1]))
    y1 = int(min(math.ceil(q[1].max()) + 1, canvas.shape[0]))
    if x1 <= x0 or y1 <= y0:
        return
    Ml = T(-x0, -y0) @ Mc
    dst = cv2.warpAffine(rgba, Ml[:2], (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    if alpha < 1:
        dst *= alpha
    reg = canvas[y0:y1, x0:x1]
    reg *= 1 - dst[..., 3:4]
    reg += dst[..., :3]


def fill_color(canvas, mask, color, alpha=1.0):
    m = mask[..., None] * alpha
    canvas *= 1 - m
    canvas += m * color


def poly_mask(polys, shape=None):
    h, w = shape if shape else (OH, OW)
    m = np.zeros((h, w), np.uint8)
    pts = [np.round(p * 16).astype(np.int32) for p in polys]
    cv2.fillPoly(m, pts, 255, lineType=cv2.LINE_AA, shift=4)
    return m.astype(np.float32) / 255.0


def blob_poly(cx, cy, r, t, seed=0, amp=0.06, n=160, sx=1.0, sy=1.0):
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    rng = np.random.RandomState(seed)
    rr = np.ones_like(th)
    for k in (2, 3, 4, 5):
        ph = rng.uniform(0, 2 * np.pi)
        sp = rng.uniform(1.5, 3.5) * (1 if rng.rand() > 0.5 else -1)
        rr += amp / k * 1.6 * np.sin(k * th + ph + sp * t)
    x = cx + r * rr * np.cos(th) * sx
    y = cy + r * rr * np.sin(th) * sy
    return np.stack([x, y], 1)


def capsule_poly(cx, cy, length, thick, angle_deg, n=24):
    r = thick / 2
    half = max(length / 2 - r, 0)
    pts = []
    for a in np.linspace(-np.pi / 2, np.pi / 2, n):
        pts.append((half + r * np.cos(a), r * np.sin(a)))
    for a in np.linspace(np.pi / 2, 3 * np.pi / 2, n):
        pts.append((-half + r * np.cos(a), r * np.sin(a)))
    pts = np.array(pts)
    c, s = math.cos(math.radians(angle_deg)), math.sin(math.radians(angle_deg))
    x = cx + pts[:, 0] * c - pts[:, 1] * s
    y = cy + pts[:, 0] * s + pts[:, 1] * c
    return np.stack([x, y], 1)


def star_poly(cx, cy, r, rot, points=4, inner=0.3):
    k = points * 2
    a = np.linspace(0, 2 * np.pi, k, endpoint=False) + math.radians(rot)
    rad = np.where(np.arange(k) % 2 == 0, r, r * inner)
    return np.stack([cx + rad * np.sin(a), cy - rad * np.cos(a)], 1)


def soft_shadow(mask, sigma=18, dx=0, dy=14, strength=0.22):
    """Return a darkening factor map for a drop shadow under `mask`."""
    small = cv2.resize(mask, (mask.shape[1] // 4, mask.shape[0] // 4), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigma / 4)
    big = cv2.resize(small, (mask.shape[1], mask.shape[0]), interpolation=cv2.INTER_LINEAR)
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    big = cv2.warpAffine(big, M, (mask.shape[1], mask.shape[0]))
    return big * strength


def apply_shadow(canvas, mask, **kw):
    sh = soft_shadow(mask, **kw) * (1 - mask)
    canvas *= 1 - sh[..., None]


def yellow_backdrop(t):
    """Warm radial gradient used behind intro / outro."""
    key = (OW, OH)
    if key not in _cache:
        yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
        d = np.sqrt(((xx - OW / 2) / OW) ** 2 + ((yy - OH / 2) / OH) ** 2) * 1.6
        d = np.clip(d, 0, 1)[..., None]
        inner = hex2bgr("#FFF07A")
        outer = hex2bgr("#FFC21A")
        _cache[key] = (inner * (1 - d) + outer * d).astype(np.float32)
    return _cache[key].copy()


_cache = {}


# --------------------------------------------------------------------------- sprites
def make_bubble_sprite(size=256):
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    c = (size - 1) / 2
    r = np.sqrt((xx - c) ** 2 + (yy - c) ** 2) / (size / 2 - 4)
    body = np.clip(1 - r, 0, 1) > 0
    rim = np.exp(-((r - 0.93) / 0.07) ** 2)
    fill = 0.10 * (r < 1)
    hx, hy = c - size * 0.2, c - size * 0.2
    hl = np.exp(-(((xx - hx) ** 2 + (yy - hy) ** 2) / (2 * (size * 0.07) ** 2)))
    a = np.clip(rim * 0.75 + fill + hl * 0.9, 0, 1) * (r < 1.02)
    aa = cv2.GaussianBlur(a.astype(np.float32), (0, 0), 1.2)
    col = np.ones((size, size, 3), np.float32)
    tint = hex2bgr("#FFF6D0")
    col[:] = tint
    rgba = np.concatenate([col * aa[..., None], aa[..., None]], 2)
    return rgba.astype(np.float32)


# --------------------------------------------------------------------------- data
SCENES = []
BUBBLE = None
CARD_MASK = None
OW, OH = W, H


def load():
    global SCENES, BUBBLE, OW, OH
    OW, OH = int(round(W * SCALE)), int(round(H * SCALE))
    SCENES = []
    for n in range(1, 6):
        with open(os.path.join(LAYERS, "%d.pkl" % n), "rb") as f:
            d = pickle.load(f)
        d["bg"] = d["bg"]
        for P in d["pastries"]:
            P["rgba"] = P["rgba"].astype(np.float32)
        d["bubble"]["rgba"] = d["bubble"]["rgba"].astype(np.float32)
        for L in d["lines"]:
            L["rgba"] = L["rgba"].astype(np.float32)
        # pastry order: sweep around the clock so they pop in sequence
        cx, cy = SRC_W / 2, SRC_H / 2
        d["pastries"].sort(key=lambda P: math.atan2(P["center"][1] - cy, P["center"][0] - cx))
        SCENES.append(d)
    BUBBLE = make_bubble_sprite()


# --------------------------------------------------------------------------- scene
S0 = W / SRC_W  # source px -> output px at zoom 1


def cam_matrix(zoom, pan, rot, par):
    """Camera for a layer with parallax factor `par` (1 = background)."""
    k = S0 * (1 + (zoom - 1) * par) * SCALE
    return (T(OW / 2 + pan[0] * par * SCALE, OH / 2 + pan[1] * par * SCALE) @ R(rot * par) @ S(k)
            @ T(-SRC_W / 2, -SRC_H / 2))


def render_scene(idx, t, extra_zoom=1.0, extra_pan=(0.0, 0.0), extra_rot=0.0, intro_zoom=True,
                 exit_squeeze=0.0):
    """Render scene idx at local time t (seconds since it started)."""
    d = SCENES[idx]
    seed = idx * 17
    # ---- camera: dynamic zoom-out on entry, slow push in, gentle drift
    zin = 0.16 * (1 - spring(t, 1.1, 0.62)) if intro_zoom else 0.0
    zoom = (1.065 + 0.045 * smooth(t / 6.0) + zin) * extra_zoom
    pan = (14 * math.sin(0.55 * t + seed) + extra_pan[0], 9 * math.sin(0.43 * t + seed * 0.7) + extra_pan[1])
    rot = 0.45 * math.sin(0.37 * t + seed) + extra_rot

    canvas = np.empty((OH, OW, 3), np.float32)
    Mbg = cam_matrix(zoom, pan, rot, 1.0)
    bg = cv2.warpAffine(d["bg"], Mbg[:2], (OW, OH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    canvas[:] = bg.astype(np.float32) * (1.0 / 255.0)

    # ---- bubble (jelly pop with squash & stretch)
    Mmid = cam_matrix(zoom, pan, rot, 1.18)
    tcx, tcy = d["text_center"]
    tb = t - 0.10
    s = 0.15 + 0.85 * spring(tb, 1.55, 0.42)
    w_ = 0.10 * wobble(tb, 3.2, 2.4)
    breath = 1 + 0.012 * math.sin(2 * math.pi * 0.45 * t + seed)
    sx = s * (1 + w_) * breath * (1 - 0.06 * exit_squeeze)
    sy = s * (1 - w_) * breath * (1 - 0.06 * exit_squeeze)
    b = d["bubble"]
    if tb > 0:
        Mb = Mmid @ about(S(sx, sy), tcx, tcy)
        blit(canvas, b["rgba"], b["bbox"][0], b["bbox"][1], Mb, alpha=clamp(tb * 7))

    # ---- text lines: staggered bouncy drop-in, then a soft wave
    nl = len(d["lines"])
    for j, L in enumerate(d["lines"]):
        tl = t - 0.30 - 0.085 * j
        if tl <= 0:
            continue
        x0, y0, x1, y1 = L["bbox"]
        lx, ly = (x0 + x1) / 2, (y0 + y1) / 2
        sp = spring(tl, 2.0, 0.45)
        dy = 90 * (1 - sp) + 3.0 * math.sin(2 * math.pi * 0.5 * t - j * 0.9)
        sc = (0.55 + 0.45 * spring(tl, 2.1, 0.42)) * (1 - 0.05 * exit_squeeze)
        stretch = 0.08 * wobble(tl, 4.0, 2.8)
        ang = (7 if j % 2 == 0 else -7) * (1 - sp)
        Ml = Mmid @ T(0, dy) @ about(R(ang) @ S(sc * (1 - stretch), sc * (1 + stretch)), lx, ly)
        blit(canvas, L["rgba"], x0, y0, Ml, alpha=clamp(tl * 9))

    # ---- pastries: fly in from outside with spring, then float
    Mfg = cam_matrix(zoom, pan, rot, 1.4)
    for k, P in enumerate(d["pastries"]):
        tp = t - 0.02 - 0.06 * k
        px, py = P["center"]
        vx, vy = px - SRC_W / 2, py - SRC_H / 2
        vn = math.hypot(vx, vy) + 1e-6
        vx, vy = vx / vn, vy / vn
        sp = spring(tp, 1.5, 0.5)
        off = 420 * (1 - sp)
        ph = k * 1.7 + seed
        fx = 6 * math.sin(2 * math.pi * 0.21 * t + ph)
        fy = 10 * math.sin(2 * math.pi * 0.33 * t + ph * 1.3)
        ang = 2.0 * math.sin(2 * math.pi * 0.25 * t + ph) + (14 if k % 2 else -14) * (1 - sp)
        sc = 1 + 0.018 * math.sin(2 * math.pi * 0.4 * t + ph) + 0.12 * (1 - sp)
        # exit anticipation: pastries push outwards a touch
        off -= 0 if exit_squeeze == 0 else -60 * exit_squeeze
        Mp = Mfg @ T(vx * off + fx, vy * off + fy) @ about(R(ang) @ S(sc), px, py)
        blit(canvas, P["rgba"], P["bbox"][0], P["bbox"][1], Mp)

    # ---- sparkles popping around the bubble once the text lands
    x0, y0, x1, y1 = d["text_box"]
    spots = [(x0 - 70, y0 - 40), (x1 + 70, y0 - 30), (x1 + 50, y1 + 40), (x0 - 50, y1 + 35)]
    polys_w, polys_o = [], []
    for k, (sx_, sy_) in enumerate(spots):
        ts = t - 0.55 - 0.08 * k - 0.07 * nl
        if ts <= 0 or ts > 1.6:
            continue
        r = 26 * spring(ts, 2.2, 0.4) * (1 - smooth((ts - 0.9) / 0.7))
        if r <= 0.5:
            continue
        q = Mmid @ np.array([sx_, sy_, 1.0])
        poly = star_poly(q[0], q[1], r * SCALE * 1.4, ts * 140 + k * 30)
        (polys_w if k % 2 == 0 else polys_o).append(poly)
        polys_o.append(star_poly(q[0] + 30 * SCALE * (1 if k < 2 else -1), q[1] + 26 * SCALE,
                                 r * SCALE * 0.6, -ts * 200))
    if polys_w:
        fill_color(canvas, poly_mask(polys_w), WHITE)
    if polys_o:
        fill_color(canvas, poly_mask(polys_o), DEEP, 0.9)
    return canvas


# --------------------------------------------------------------------------- ambient
_RNG = np.random.RandomState(7)
AMBIENT = [dict(x=_RNG.uniform(0, W), y=_RNG.uniform(0, H), r=_RNG.uniform(10, 46),
                v=_RNG.uniform(25, 70), ph=_RNG.uniform(0, 6.28), sw=_RNG.uniform(10, 30))
           for _ in range(16)]


def draw_ambient(canvas, t, push=0.0):
    for b in AMBIENT:
        y = (b["y"] - b["v"] * t) % (H + 160) - 80
        x = (b["x"] + b["sw"] * math.sin(0.8 * t + b["ph"]) - push * b["r"] / 20) % (W + 160) - 80
        r = b["r"] * (1 + 0.08 * math.sin(2.2 * t + b["ph"]))
        k = 2 * r / BUBBLE.shape[0] * SCALE
        M = T(x * SCALE, y * SCALE) @ S(k) @ T(-BUBBLE.shape[1] / 2, -BUBBLE.shape[0] / 2)
        blit(canvas, BUBBLE, 0, 0, M, alpha=0.75)


# --------------------------------------------------------------------------- timeline
T_S1, T_S2, T_S3, T_S4, T_S5 = 0.80, 6.30, 12.38, 18.62, 24.52


def frame_intro(t):
    """0 - 1.35 s: bouncing dots -> goo merge -> layered blob reveal."""
    canvas = yellow_backdrop(t)
    floor = H / 2
    rad = 34
    xs = [W / 2 - 120, W / 2, W / 2 + 120]
    cols = [WHITE, ORANGE, CREAM]
    merge = smooth((t - 0.56) / 0.22)  # dots rush together
    goo_fields = []
    shadow_polys = []
    dot_polys = [[], [], []]
    for i in range(3):
        td = t - 0.07 * i
        u = clamp(td / 0.52)
        yv = bounce_out(u)
        y = -80 + (floor - (-80)) * yv
        # squash on each impact
        imp = 0.0
        for ti, amp in ((1 / 2.75, 1.0), (2 / 2.75, 0.45), (2.5 / 2.75, 0.2), (1.0, 0.08)):
            imp += amp * math.exp(-((u - ti) / 0.035) ** 2)
        vel = abs(bounce_out(clamp(u + 0.01)) - yv) / 0.01
        st = min(vel * 0.06, 0.3)
        sxx = (1 - st * 0.6) * (1 + 0.32 * imp)
        syy = (1 + st) * (1 - 0.32 * imp)
        x = xs[i] * (1 - ease_in_back(merge, 2.2)) + W / 2 * ease_in_back(merge, 2.2)
        cy = y - rad * (syy - 1)  # keep bottom on the floor
        if td > 0:
            poly = blob_poly(x * SCALE, cy * SCALE, rad * SCALE, t, seed=i, amp=0.0, n=64, sx=sxx, sy=syy)
            dot_polys[i].append(poly)
            hgt = clamp((floor - y) / 400)
            shadow_polys.append(blob_poly(x * SCALE, (floor + rad + 6) * SCALE, rad * SCALE * (1 - 0.5 * hgt),
                                          0, amp=0.0, n=48, sx=1.3, sy=0.25))
    if shadow_polys and t < 0.95:
        sm = poly_mask(shadow_polys)
        sm = cv2.GaussianBlur(sm, (0, 0), 6 * SCALE + 0.5)
        canvas *= 1 - (sm * 0.18 * (1 - smooth((t - 0.6) / 0.3)))[..., None]
    if t < 0.62:
        for i in range(3):
            if dot_polys[i]:
                col = cols[i] * (1 - smooth((t - 0.48) / 0.12)) + ORANGE * smooth((t - 0.48) / 0.12)
                fill_color(canvas, poly_mask(dot_polys[i]), col)
    elif t < 0.9:
        # gooey merge: blur + threshold
        allp = [p for ps in dot_polys for p in ps]
        grow = 1 + 0.9 * smooth((t - 0.66) / 0.2)
        allp.append(blob_poly(W / 2 * SCALE, floor * SCALE, rad * SCALE * grow * merge, t, amp=0.04))
        m = poly_mask(allp)
        m = cv2.GaussianBlur(m, (0, 0), 10 * SCALE + 0.5)
        m = np.clip((m - 0.35) / 0.2, 0, 1)
        fill_color(canvas, m, ORANGE)
    # layered blob reveal
    layers = [(0.66, ORANGE, 11), (0.73, CREAM, 12), (0.80, None, 13)]
    for (t0, col, sd) in layers:
        u = (t - t0) / 0.55
        if u <= 0:
            continue
        r = 60 + 1500 * ease_in_out_expo(u) + 300 * u
        if u > 0.98 and col is not None:
            pass
        m = poly_mask([blob_poly(W / 2 * SCALE, floor * SCALE, r * SCALE, t * 2, seed=sd, amp=0.10)])
        apply_shadow(canvas, m, sigma=24 * SCALE, dy=10 * SCALE, strength=0.25)
        if col is None:
            sc = render_scene(0, t - T_S1)
            m3 = m[..., None]
            canvas = canvas * (1 - m3) + sc * m3
        else:
            fill_color(canvas, m, col)
    return canvas


def frame_t1(t):
    """6.0 - 6.9: liquid layered blob from the lower-left corner."""
    a = render_scene(0, t - T_S1, extra_zoom=1 + 0.35 * ease_in_expo((t - 6.0) / 0.55),
                     exit_squeeze=smooth((t - 5.95) / 0.2))
    cx, cy = -120, H + 140
    for (t0, col, sd) in [(6.02, ORANGE, 21), (6.10, CREAM, 22), (6.18, None, 23)]:
        u = (t - t0) / 0.62
        if u <= 0:
            continue
        r = 80 + 2600 * ease_in_out_expo(u)
        m = poly_mask([blob_poly(cx * SCALE, cy * SCALE, r * SCALE, t * 3, seed=sd, amp=0.08, n=200)])
        apply_shadow(a, m, sigma=26 * SCALE, dx=8 * SCALE, dy=-8 * SCALE, strength=0.28)
        if col is None:
            b = render_scene(1, t - T_S2)
            m3 = m[..., None]
            a = a * (1 - m3) + b * m3
        else:
            fill_color(a, m, col)
    return a


def frame_t2(t):
    """12.1 - 12.9: whip pan with speed ramp (exp ease in, springy settle)."""
    u = t - 12.10
    # exponential ease-in into a spring settle
    if u < 0.30:
        P = 0.5 * ease_in_expo(u / 0.30)
    else:
        P = 0.5 + 0.5 * spring(u - 0.30, 1.25, 0.62)
    off = P * (W + 60)
    tilt = 4.0 * math.sin(math.pi * clamp(u / 0.55))
    a = render_scene(1, t - T_S2, extra_pan=(-off, 0), extra_rot=-tilt)
    b = render_scene(2, t - T_S3, extra_pan=(W + 60 - off, 0), extra_rot=-tilt)
    out = b
    xa = int(clamp((W - off + 30) * SCALE, 0, OW))
    out[:, :xa] = a[:, :xa]
    # gap filled with orange
    g0, g1 = int(clamp((W - off) * SCALE, 0, OW)), int(clamp((W + 60 - off) * SCALE, 0, OW))
    if g1 > g0:
        out[:, g0:g1] = ORANGE
    # speed lines
    if 0.12 < u < 0.62:
        polys_w, polys_o = [], []
        rng = np.random.RandomState(5)
        for i in range(9):
            y = rng.uniform(80, H - 80)
            L = rng.uniform(260, 700)
            th = rng.uniform(8, 22)
            x = W + 400 - (u - 0.12) * rng.uniform(5200, 7800)
            (polys_w if i % 2 else polys_o).append(capsule_poly(x * SCALE, y * SCALE, L * SCALE, th * SCALE, 0))
        fade = math.sin(math.pi * clamp((u - 0.12) / 0.5))
        fill_color(out, poly_mask(polys_w), WHITE, 0.85 * fade)
        fill_color(out, poly_mask(polys_o), ORANGE, 0.85 * fade)
    return out


def pill_layout():
    ang = -22
    thick = 300
    n = 8
    out = []
    cols = [ORANGE, CREAM, YELLOW, WHITE, ORANGE, CREAM, YELLOW, WHITE]
    c, s = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    nx, ny = -s, c  # normal
    for i in range(n):
        k = i - (n - 1) / 2
        cx, cy = W / 2 + nx * k * (thick - 40), H / 2 + ny * k * (thick - 40)
        out.append((cx, cy, cols[i], ang))
    return out, thick


def frame_t3(t):
    """18.2 - 19.1: diagonal capsules sweep in (staggered spring) and out (expo)."""
    u = t - 18.20
    switch = 18.62
    if t < switch:
        base = render_scene(2, t - T_S3, extra_zoom=1 + 0.08 * ease_in_expo(u / 0.42),
                            exit_squeeze=smooth(u / 0.2))
    else:
        base = render_scene(3, t - T_S4)
    pills, thick = pill_layout()
    length = 3200
    c, s = math.cos(math.radians(pills[0][3])), math.sin(math.radians(pills[0][3]))
    polys = []
    for i, (cx, cy, col, ang) in enumerate(pills):
        tin = u - 0.035 * i
        tout = t - (switch + 0.02) - 0.035 * i
        travel_in = (1 - spring(tin, 1.7, 0.7)) * 3600 if tin > 0 else 4000
        travel_out = ease_in_expo(clamp(tout / 0.38)) * 3800 if tout > 0 else 0
        d = -travel_in + travel_out
        # squash while moving
        if tin <= 0:
            continue
        x = cx + c * d
        y = cy + s * d
        poly = capsule_poly(x * SCALE, y * SCALE, length * SCALE, thick * SCALE, ang)
        m = poly_mask([poly])
        apply_shadow(base, m, sigma=22 * SCALE, dy=12 * SCALE, strength=0.22)
        fill_color(base, m, col)
    return base


def frame_t4(t):
    """24.2 - 25.0: exponential zoom into scene 4, scene 5 bursts out of a bouncy iris."""
    u = t - 24.20
    z = 1 + 2.6 * ease_in_expo(u / 0.45)
    out = render_scene(3, t - T_S4, extra_zoom=z, extra_rot=6 * ease_in_expo(u / 0.45))
    ti = t - 24.40
    if ti > 0:
        r = 1300 * spring(ti, 1.1, 0.55)
        sx = 1 + 0.10 * wobble(ti, 3.0, 2.2)
        sy = 1 - 0.10 * wobble(ti, 3.0, 2.2)
        poly = blob_poly(W / 2 * SCALE, H / 2 * SCALE, r * SCALE, t * 4, seed=41, amp=0.05, sx=sx, sy=sy)
        m = poly_mask([poly])
        apply_shadow(out, m, sigma=26 * SCALE, dy=12 * SCALE, strength=0.3)
        sc = render_scene(4, t - T_S5)
        m3 = m[..., None]
        out = out * (1 - m3) + sc * m3
        # bouncy rim ring
        ring_w = 26 * (1 - smooth(ti / 0.6)) + 2
        outer = blob_poly(W / 2 * SCALE, H / 2 * SCALE, (r + ring_w) * SCALE, t * 4, seed=41, amp=0.05, sx=sx, sy=sy)
        ring = np.clip(poly_mask([outer]) - m, 0, 1)
        fill_color(out, ring, WHITE, 0.95 * (1 - smooth((ti - 0.4) / 0.4)))
    return out


def card_mask():
    global CARD_MASK
    if CARD_MASK is None or CARD_MASK.shape != (OH, OW):
        m = np.zeros((OH, OW), np.uint8)
        rr = int(64 * SCALE)
        cv2.rectangle(m, (rr, 0), (OW - rr, OH), 255, -1)
        cv2.rectangle(m, (0, rr), (OW, OH - rr), 255, -1)
        for (x, y) in [(rr, rr), (OW - rr - 1, rr), (rr, OH - rr - 1), (OW - rr - 1, OH - rr - 1)]:
            cv2.circle(m, (x, y), rr, 255, -1, lineType=cv2.LINE_AA)
        CARD_MASK = m.astype(np.float32) / 255.0
    return CARD_MASK


CONFETTI = None


def confetti(t, t0, cx, cy):
    global CONFETTI
    if CONFETTI is None:
        rng = np.random.RandomState(3)
        CONFETTI = []
        cols = [ORANGE, WHITE, CREAM, DEEP, PINK, YELLOW]
        for i in range(46):
            a = rng.uniform(-math.pi, 0) if i % 3 else rng.uniform(-math.pi * 0.9, -math.pi * 0.1)
            sp = rng.uniform(700, 1500)
            CONFETTI.append(dict(vx=math.cos(a) * sp * 1.35, vy=math.sin(a) * sp, col=cols[i % 6],
                                 kind=i % 3, size=rng.uniform(9, 18), spin=rng.uniform(-500, 500),
                                 x0=rng.uniform(-500, 500)))
    tt = t - t0
    if tt <= 0:
        return []
    out = []
    drag = 2.6
    for c in CONFETTI:
        # velocity with drag + gravity
        e = (1 - math.exp(-drag * tt)) / drag
        x = cx + c["x0"] + c["vx"] * e
        y = cy + c["vy"] * e + 260 * tt * tt
        life = 1 - smooth((tt - 0.6) / 0.6)
        sz = c["size"] * spring(tt, 2.5, 0.5) * life
        if sz < 0.5:
            continue
        rot = c["spin"] * tt
        if c["kind"] == 0:
            poly = star_poly(x * SCALE, y * SCALE, sz * 1.5 * SCALE, rot)
        elif c["kind"] == 1:
            poly = blob_poly(x * SCALE, y * SCALE, sz * 0.7 * SCALE, 0, amp=0, n=20)
        else:
            poly = capsule_poly(x * SCALE, y * SCALE, sz * 2.4 * SCALE, sz * 0.9 * SCALE, rot)
        out.append((poly, c["col"]))
    return out


def frame_outro(t):
    """28.3 - 30: frame becomes a card, lifts, drops with squash, confetti, settle."""
    sc = render_scene(4, t - T_S5)
    u = t - 28.30
    k = 1 - 0.17 * spring(u, 1.0, 0.6)                  # shrink to card with overshoot
    rad_mix = smooth(u / 0.3)
    # final bounce: hop up, fall, land with squash & stretch, settle
    hop, sq = 0.0, 0.0
    tb = t - 28.95
    up, fall = 0.30, 0.16
    if 0 < tb < up:
        hop = -70 * math.sin(math.pi / 2 * tb / up)
        sq = -0.035 * math.sin(math.pi * tb / up)
    elif up <= tb < up + fall:
        f = (tb - up) / fall
        hop = -70 * (1 - f * f)
        sq = -0.03 * f
    elif tb >= up + fall:
        sq = 0.11 * wobble(tb - up - fall, 4.2, 2.4)
    sx = k * (1 + sq)
    sy = k * (1 - sq)
    # anchor squash at the bottom edge of the card
    M = T(OW / 2, (H / 2 + H * k / 2 + hop) * SCALE) @ S(sx, sy) @ T(-OW / 2, -OH)
    bg = yellow_backdrop(t)
    draw_ambient(bg, t + 3.0)
    cm = card_mask()
    cm = cm * rad_mix + 1 * (1 - rad_mix)
    rgba = np.concatenate([sc * cm[..., None], cm[..., None]], 2)
    m = cv2.warpAffine(cm, M[:2], (OW, OH), flags=cv2.INTER_LINEAR)
    lift = clamp(-hop / 70)
    apply_shadow(bg, m, sigma=(30 + 30 * lift) * SCALE, dy=(22 + 40 * lift) * SCALE, strength=0.32 - 0.1 * lift)
    blit(bg, rgba, 0, 0, M)
    # confetti burst on landing
    parts = confetti(t, 28.95 + 0.32 + 0.16, W / 2, H / 2 + H * k / 2 - 20)
    for poly, col in parts:
        fill_color(bg, poly_mask([poly]), col)
    return bg


def frame(t):
    if t < 1.35:
        c = frame_intro(t)
    elif t < T_S1 + 5.2:
        c = render_scene(0, t - T_S1)
    elif t < 6.9:
        c = frame_t1(t)
    elif t < 12.10:
        c = render_scene(1, t - T_S2)
    elif t < 12.95:
        c = frame_t2(t)
    elif t < 18.20:
        c = render_scene(2, t - T_S3)
    elif t < 19.10:
        c = frame_t3(t)
    elif t < 24.20:
        c = render_scene(3, t - T_S4)
    elif t < 25.10:
        c = frame_t4(t)
    elif t < 28.30:
        c = render_scene(4, t - T_S5)
    else:
        return frame_outro(t)
    push = 0.0
    draw_ambient(c, t, push)
    return c


# motion-blur sub-samples (temporal supersampling) per time window
WINDOWS = [  # (start, end, samples, shutter in frames)
    (0.0, 1.40, 5, 0.6),
    (6.0, 6.95, 6, 0.7),
    (12.08, 12.98, 12, 1.0),
    (18.2, 19.15, 6, 0.7),
    (24.2, 25.15, 9, 0.9),
    (28.3, 29.9, 4, 0.6),
]
ENTRANCES = [T_S2, T_S3, T_S4, T_S5]


def samples_at(t):
    for a, b, n, sh in WINDOWS:
        if a <= t < b:
            return n, sh
    for s in ENTRANCES:
        if s <= t < s + 0.8:
            return 4, 0.5
    return 1, 0.0


def render_frame(i):
    t = i / FPS
    n, sh = samples_at(t)
    if n == 1:
        c = frame(t)
    else:
        c = np.zeros((OH, OW, 3), np.float32)
        for k in range(n):
            dt = ((k + 0.5) / n - 0.5) * sh / FPS
            c += frame(max(0.0, min(DURATION - 1e-4, t + dt)))
        c /= n
    # tiny warm grade + dither
    c = np.clip(c, 0, 1)
    out = (c * 255.0 + np.random.uniform(-0.5, 0.5, c.shape).astype(np.float32))
    return np.clip(out, 0, 255).astype(np.uint8)


def init_worker(scale):
    global SCALE
    SCALE = scale
    cv2.setNumThreads(1)
    load()


def main():
    global SCALE
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--stills", type=float, nargs="*")
    ap.add_argument("--out", default=os.path.join(HERE, "build", "motion.mp4"))
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=DURATION)
    ap.add_argument("--jobs", type=int, default=os.cpu_count())
    ap.add_argument("--crf", type=int, default=18)
    a = ap.parse_args()
    SCALE = a.scale
    if a.stills:
        init_worker(a.scale)
        d = os.path.join(HERE, "build", "stills")
        os.makedirs(d, exist_ok=True)
        for s in a.stills:
            img = render_frame(int(round(s * FPS)))
            p = os.path.join(d, "t%05.2f.jpg" % s)
            cv2.imwrite(p, img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            print(p)
        return
    ow, oh = int(round(W * a.scale)), int(round(H * a.scale))
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "%dx%d" % (ow, oh),
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", str(a.crf),
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart", a.out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    frames = range(int(a.start * FPS), int(a.end * FPS))
    with Pool(a.jobs, initializer=init_worker, initargs=(a.scale,)) as pool:
        for n, img in enumerate(pool.imap(render_frame, frames, chunksize=2)):
            ff.stdin.write(img.tobytes())
            if n % 60 == 0:
                print("frame", frames[n], flush=True)
    ff.stdin.close()
    ff.wait()
    print("wrote", a.out)


if __name__ == "__main__":
    main()
