"""Cut glass renders off their white studio background, keeping translucency.

Background pixels connected to the border are unmixed from white (alpha from how far each
pixel is from white, colour un-premultiplied), so soft caustics and glass edges stay
semi-transparent. Pixels enclosed by the object keep at least 0.92 alpha so inner
highlights stay solid. Output: assets/img/<name>.png trimmed to its content.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def cut(src, dst, keep_floor=0.55):
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
    mn = im.min(axis=2)
    near_white = mn > 0.93
    lab, _ = ndimage.label(near_white)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bgc = np.isin(lab, border[border > 0])
    bgc = ndimage.binary_dilation(bgc, iterations=2) & (mn > 0.85)
    # alpha by distance from white
    a = np.clip((1 - mn) * 2.6, 0, 1)
    inside = ~bgc
    inside = ndimage.binary_erosion(inside, iterations=2)
    a = np.where(inside, np.maximum(a, 0.94), a)
    a = np.where(bgc, np.minimum(a, 0.25) * 0.4, a)
    # floor caustics/shadow: keep some, softer
    a = np.clip(a, 0, 1)
    a_s = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    a = np.maximum(a_s * (a > 0.02), np.where(inside, a, 0))
    rgb = (im - (1 - a[..., None])) / np.maximum(a[..., None], 1e-3)
    rgb = np.clip(rgb, 0, 1)
    out = np.dstack([rgb, a])
    out = (out * 255).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if bbox:
        pad = 12
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(img.width, bbox[2] + pad), min(img.height, bbox[3] + pad))
        img = img.crop(bbox)
    img.save(dst, optimize=True)
    return img.size

if __name__ == "__main__":
    names = sys.argv[1:]
    for n in names:
        s = cut(ROOT / f"assets/img/raw/{n}.png", ROOT / f"assets/img/{n}.png")
        print(n, s)
