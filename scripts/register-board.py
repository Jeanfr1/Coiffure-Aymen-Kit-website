#!/usr/bin/env python3
"""Register the kit's plates against the approved board (SIFT + similarity transform).

Writes scripts/out/registration.json: per plate, the scale (board px per plate px),
rotation and the board position of the plate's top-left corner, plus a 50 % blend
overlay per plate in scripts/out/reg-<name>.jpg. The board is a generated study and
the masters were rendered from it, so read the overlays before trusting a number.

~/anaconda3/bin/python3 scripts/register-board.py
"""
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts/out"
BOARD = ROOT / "references/Modelo-3-Aprovado.png"

# plate file, board search band (y0, y1), crop of the plate (x0, y0, x1, y1) or None
PLATES = {
    "plate": ("images/master/hero-plate.png", (0, 621), None),
    "chair": ("images/master/hero-chair.png", (180, 621), None),
    "signature": ("images/master/signature-master.png", (40, 400), None),
    "montage": ("images/master/craft-montage.png", (621, 1021), None),
    "facade": ("images/originals/Fachada-Aymen-Original.png", (1021, 1440), (0, 110, 1342, 1000)),
    "contact": ("images/master/contact-campaign.png", (1680, 2103), None),
    "logo": ("brand/Logo-AYMEN-Ambre-Transparente.png", (0, 70), None),
}


def load_rgb(path, crop=None):
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if crop:
        x0, y0, x1, y1 = crop
        img = img[y0:y1, x0:x1]
    if img.ndim == 3 and img.shape[2] == 4:
        alpha = img[:, :, 3:4].astype(np.float32) / 255
        rgb = (img[:, :, :3].astype(np.float32) * alpha + 20 * (1 - alpha)).astype(np.uint8)
        return rgb, img[:, :, 3]
    return img[:, :, :3], None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    board, _ = load_rgb(BOARD)
    sift = cv2.SIFT_create(nfeatures=12000)
    result = {"board": {"width": board.shape[1], "height": board.shape[0]}}
    for name, (rel, (y0, y1), crop) in PLATES.items():
        plate, alpha = load_rgb(ROOT / rel, crop)
        band = np.zeros(board.shape[:2], np.uint8)
        band[y0:y1] = 255
        kb, db = sift.detectAndCompute(cv2.cvtColor(board, cv2.COLOR_BGR2GRAY), band)
        amask = None if alpha is None else (alpha > 128).astype(np.uint8) * 255
        kp, dp = sift.detectAndCompute(cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY), amask)
        matches = cv2.BFMatcher().knnMatch(dp, db, k=2)
        good = [m for m, n in matches if m.distance < 0.8 * n.distance]
        if len(good) < 8:
            result[name] = {"file": rel, "matches": len(good), "registered": False}
            print(f"{name}: only {len(good)} matches, not registered")
            continue
        src = np.float32([kp[m.queryIdx].pt for m in good])
        dst = np.float32([kb[m.trainIdx].pt for m in good])
        M, inliers = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=3)
        n_in = int(inliers.sum()) if inliers is not None else 0
        scale = float(np.hypot(M[0, 0], M[1, 0]))
        angle = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
        h, w = plate.shape[:2]
        result[name] = {
            "file": rel, "crop": crop, "plate_size": [w, h], "matches": len(good), "inliers": n_in,
            "scale": round(scale, 5), "angle_deg": round(angle, 3),
            "x": round(float(M[0, 2]), 2), "y": round(float(M[1, 2]), 2),
            "width_board": round(w * scale, 2), "height_board": round(h * scale, 2),
            "registered": n_in >= 12,
        }
        print(name, {k: v for k, v in result[name].items() if k not in ("file", "crop")})
        warped = cv2.warpAffine(plate, M, (board.shape[1], board.shape[0]))
        mask = cv2.warpAffine(alpha if alpha is not None else np.full((h, w), 255, np.uint8), M,
                              (board.shape[1], board.shape[0]))
        blend = board.copy()
        sel = mask > 128
        blend[sel] = (0.5 * board[sel] + 0.5 * warped[sel]).astype(np.uint8)
        ya, yb = max(0, y0 - 40), min(board.shape[0], y1 + 40)
        cv2.imwrite(str(OUT / f"reg-{name}.jpg"), np.hstack([board[ya:yb], blend[ya:yb]]))
    (OUT / "registration.json").write_text(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
