#!/usr/bin/env python3
"""Measure every text line of the approved board and fit the kit's fonts to it.

For each line: tight ink box on the board (pixel scan inside a search box), then the
font size whose rendered ink height matches and the letter-spacing that makes the
rendered ink width match. `ref` is the text rendered for the height when the board box
was cut to skip accents, commas or the arrow. Results (board px) go to
src/data/board-type.json; the CSS reads them as custom properties, so the page sets its
words where the board has them. scripts/out/type-boxes.png draws every box for a check.

python3 scripts/fit-type.py   (Pillow + numpy)
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BOARD_IMG = Image.open(ROOT / "references/Modelo-3-Aprovado.png").convert("RGB")
BOARD = np.asarray(BOARD_IMG).astype(int)
FONTS = {
    "barlow800": ROOT / "fonts/BarlowCondensed-ExtraBold.ttf",
    "sora400": ROOT / "fonts/Sora-Regular.ttf",
    "sora500": ROOT / "fonts/Sora-Medium.ttf",
}

# id, text, font, ink ("light" | "dark"), search box (x0, y0, x1, y1), ref text for the ink height
LINES = [
    ("nav1", "Le savoir-faire", "sora400", "light", (228, 16, 318, 38), None),
    ("nav2", "Les services", "sora400", "light", (334, 16, 412, 38), None),
    ("nav3", "Nous trouver", "sora400", "light", (428, 16, 510, 38), None),
    ("nav-cta", "Venir au salon", "sora400", "light", (612, 22, 690, 42), None),
    ("h1a", "PRENEZ", "barlow800", "light", (30, 370, 250, 428), None),
    ("h1b", "PLACE.", "barlow800", "light", (30, 433, 240, 494), None),
    ("hero-eyebrow", "COIFFURE HOMME · ENFANT · BARBE", "sora500", "light", (34, 500, 292, 521), None),
    ("hero-cta", "Sans rendez-vous", "sora400", "dark", (54, 543, 168, 568), None),
    ("sf1", "LA MAIN.", "barlow800", "light", (28, 640, 384, 728), None),
    ("sf-eyebrow", "HOMME · ENFANT · BARBE", "sora500", "light", (528, 990, 716, 1010), None),
    ("fa1", "AYMEN,", "barlow800", "light", (36, 1276, 232, 1320), "AYMEN"),
    ("fa2", "PONTCHATEAU.", "barlow800", "light", (66, 1338, 410, 1384), None),
    ("fa2-a", "A", "barlow800", "light", (36, 1338, 64, 1384), None),
    ("fa-addr", "2 rue Maurice Sambron", "sora400", "light", (68, 1388, 230, 1414), None),
    ("fa-cta", "Voir l’itinéraire", "sora400", "light", (570, 1374, 660, 1398), None),
    ("sv1", "VOTRE ALLURE.", "barlow800", "light", (252, 1468, 610, 1520), None),
    ("sv2", "NOTRE ATTENTION.", "barlow800", "light", (252, 1520, 676, 1572), None),
    ("sv-i1", "COUPE HOMME", "sora500", "light", (254, 1606, 370, 1628), None),
    ("sv-i2", "COUPE ENFANT", "sora500", "light", (404, 1606, 526, 1628), None),
    ("sv-i3", "BARBE & CONTOURS", "sora500", "light", (558, 1606, 716, 1628), None),
    ("ct1", "LE STYLE", "barlow800", "light", (32, 1736, 214, 1784), None),
    ("ct2", "VOUS ATTEND.", "barlow800", "light", (32, 1782, 316, 1828), None),
    ("ct-cta1", "Venir au salon", "sora400", "dark", (58, 1876, 160, 1902), None),
    ("ct-cta2", "Appeler", "sora400", "light", (254, 1876, 318, 1902), None),
    ("ct-phone", "07 53 49 64 35", "sora400", "light", (34, 1920, 214, 1952), None),
    ("ct-walk", "Sans rendez-vous", "sora400", "light", (34, 1952, 150, 1970), None),
    ("ft-addr", "2 rue Maurice Sambron, 44160 Pontchâteau", "sora400", "light", (244, 2040, 474, 2062), None),
]


def ink_box(box, ink, board=None):
    board = BOARD if board is None else board
    x0, y0, x1, y1 = box
    lum = board[y0:y1, x0:x1].mean(axis=2)
    mid = np.percentile(lum, 50)
    if ink == "light":
        mask = lum > mid + 0.45 * (lum.max() - mid)
    else:
        mask = lum < mid - 0.45 * (mid - lum.min())
    rows, cols = np.where(mask)
    if not len(rows):
        return None
    return [int(x0 + cols.min()), int(y0 + rows.min()), int(x0 + cols.max() + 1), int(y0 + rows.max() + 1)]


def render_ink(text, font_key, size, tracking=0.0):
    font = ImageFont.truetype(str(FONTS[font_key]), size)
    width = int(size * len(text) * (1.0 + max(tracking, 0)) + 80)
    img = Image.new("L", (width, int(size * 2.2)), 0)
    d = ImageDraw.Draw(img)
    x, y = 20, int(size * 0.4)
    for ch in text:
        d.text((x, y), ch, font=font, fill=255)
        x += font.getlength(ch) + tracking * size
    a = np.asarray(img)
    rows, cols = np.where(a > 110)
    asc = font.getmetrics()[0]
    return cols.max() - cols.min() + 1, rows.max() - rows.min() + 1, y + asc - rows.min(), cols.min() - 20


def main():
    out = {}
    overlay = BOARD_IMG.copy()
    draw = ImageDraw.Draw(overlay)
    for key, text, font, ink, box, ref in LINES:
        found = ink_box(box, ink)
        if found is None:
            print("no ink", key)
            continue
        w, h = found[2] - found[0], found[3] - found[1]
        size = 400 * h / render_ink(ref or text, font, 400)[1]
        rw = render_ink(text, font, 400)[0] * size / 400
        tracking = (w - rw) / max(len(text) - 1, 1) / size
        if size < 18 and not text.isupper():
            # small mixed-case text: antialiased ink is unreliable in height, fit the width
            size = 400 * w / render_ink(text, font, 400)[0]
            tracking = 0.0
        if size < 18 and not text.isupper():
            # small mixed-case text: antialiased ink is unreliable in height, fit the width
            size = 400 * w / render_ink(text, font, 400)[0]
            tracking = 0.0
        _, _, top, lsb = (float(v) for v in render_ink(ref or text, font, size, tracking))
        out[key] = {
            "text": text, "font": font, "ink": found,
            "size": round(size, 2), "tracking": round(tracking, 4),
            "baseline": round(found[1] + top, 1), "left": round(found[0] - lsb, 1),
        }
        draw.rectangle(found, outline=(255, 40, 80))
        draw.rectangle(box, outline=(40, 200, 255))
        print(f"{key:13s} ink={found} size={size:6.2f} tracking={tracking:+.3f}em baseline={out[key]['baseline']}")
    dest = ROOT / "src/data/board-type.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    (ROOT / "scripts/out").mkdir(parents=True, exist_ok=True)
    overlay.save(ROOT / "scripts/out/type-boxes.png")

    # render check: every fitted line drawn in magenta over the board
    check = BOARD_IMG.copy()
    cd = ImageDraw.Draw(check)
    for e in out.values():
        f = ImageFont.truetype(str(FONTS[e["font"]]), max(1, round(e["size"])))
        asc = f.getmetrics()[0]
        x = e["left"]
        for ch in e["text"]:
            cd.text((x, e["baseline"] - asc), ch, font=f, fill=(255, 0, 140))
            x += f.getlength(ch) + e["tracking"] * e["size"]
    check.save(ROOT / "scripts/out/type-check.png")

    # render check: every fitted line drawn in magenta over the board
    check = BOARD_IMG.copy()
    cd = ImageDraw.Draw(check)
    for e in out.values():
        f = ImageFont.truetype(str(FONTS[e["font"]]), max(1, round(e["size"])))
        asc = f.getmetrics()[0]
        x = e["left"]
        for ch in e["text"]:
            cd.text((x, e["baseline"] - asc), ch, font=f, fill=(255, 0, 140))
            x += f.getlength(ch) + e["tracking"] * e["size"]
    check.save(ROOT / "scripts/out/type-check.png")


if __name__ == "__main__":
    main()
