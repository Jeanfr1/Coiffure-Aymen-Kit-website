#!/usr/bin/env python3
"""Prepare the photo plates for the web build (scripts/out/plates/).

- facade: the client's capture without the Google Maps viewer bar (rows 0-110, the kit's
  own crop), Real-ESRGAN x4 then Lanczos down to 2x. Documentary photo: nothing is drawn in.
- plate, montage, contact (campaign masters): same 2x pass.
- every plate also gets a desktop "-wide" version: the picture at board scale, centred on a
  blurred, darkened ambient copy of itself that ends in charbon, so it reaches the window
  edges on wide screens without being zoomed (never scale a narrow board up to the window).

~/anaconda3/bin/python3 scripts/prepare-images.py [name ...] [--force]   (--force redoes ESRGAN)
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import upscale  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts/out/plates"
CHARBON = np.array([16, 17, 16], np.float32)

# name: source, crop (x0, y0, x1, y1) in source px, ambient side extension (left, right) in source px
PLATES = {
    "facade": ("images/originals/Fachada-Aymen-Original.png", (0, 110, 1342, 1000), (330, 330)),
    "plate": ("images/master/hero-plate.png", None, (140, 380)),
    "montage": ("images/master/craft-montage.png", None, (520, 520)),
    "contact": ("images/master/contact-campaign.png", None, (400, 500)),
}


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def extend(img, left, right, feather=0.035):
    """Board-scale picture centred on an ambient copy of itself: the same image scaled to
    cover the wide canvas, heavily blurred and darkened, fading to charbon at the outer ends.
    The sharp picture's own edges are feathered into it. No mirrored shapes, no new content."""
    h, w = img.shape[:2]
    W = w + left + right
    s = W / w
    amb = cv2.resize(img, (W, int(round(h * s))), interpolation=cv2.INTER_AREA).astype(np.float32)
    y0 = (amb.shape[0] - h) // 2
    amb = amb[y0:y0 + h]
    amb = cv2.GaussianBlur(amb, (0, 0), W * 0.018)
    x = np.arange(W)
    # distance outside the sharp picture, 0 at its edge, 1 at the canvas end
    d = np.where(x < left, (left - x) / max(left, 1), np.where(x >= left + w, (x - left - w + 1) / max(right, 1), 0.0))
    dark = 0.5 * (1 - 0.55 * smooth(0, 0.8, d))
    amb = amb * dark[None, :, None]
    fade = smooth(0.45, 1.0, d)[None, :, None]
    amb = amb * (1 - fade) + CHARBON * fade
    alpha = np.ones(w, np.float32)
    f = int(w * feather)
    ramp = smooth(0, 1, (np.arange(f) + 0.5) / f)
    if left:
        alpha[:f] = ramp
    if right:
        alpha[w - f:] = np.minimum(alpha[w - f:], ramp[::-1])
    out = amb.copy()
    a = alpha[None, :, None]
    out[:, left:left + w] = img.astype(np.float32) * a + amb[:, left:left + w] * (1 - a)
    return np.clip(out, 0, 255).astype(np.uint8)


def main(names):
    OUT.mkdir(parents=True, exist_ok=True)
    for name in names:
        rel, crop, ext = PLATES[name]
        src = Image.open(ROOT / rel).convert("RGB")
        if crop:
            src = src.crop(crop)
        rgb = np.asarray(src)
        print(name, "source", rgb.shape[1], "x", rgb.shape[0], flush=True)
        cached = OUT / f"{name}.png"
        if cached.exists() and "--force" not in sys.argv:
            x2 = np.asarray(Image.open(cached).convert("RGB"))
        else:
            sr = upscale.sr4(rgb)
            x2 = cv2.resize(sr, (rgb.shape[1] * 2, rgb.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
            Image.fromarray(x2).save(cached)
        if ext:
            Image.fromarray(extend(x2, ext[0] * 2, ext[1] * 2)).save(OUT / f"{name}-wide.png")
        print(name, "done", flush=True)


if __name__ == "__main__":
    main([a for a in sys.argv[1:] if not a.startswith('--')] or list(PLATES))
