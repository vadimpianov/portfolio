"""Лента модальных окон из modals.pdf (11 экранов 375 × 812 pt, шаг 395 pt).

Экраны режутся по одному и собираются заново с зазором GAP (в итоговых px, 2x): между экранами на сайте —
GAP / 2 = 24px. Высота — 2x от высоты ленты (--case-strip-h 502px на 1728).

Запуск: python modals-build.py modals.pdf modals.png  →  затем WebP (sharp).
"""
import sys

import pymupdf
from PIL import Image

H, GAP, N, STEP, W = 1004, 48, 11, 395, 375
page = pymupdf.open(sys.argv[1])[0]
k = H / page.rect.height
sw = round(W * k)
out = Image.new('RGBA', (N * sw + (N - 1) * GAP, H), (0, 0, 0, 0))
for i in range(N):
    clip = pymupdf.Rect(i * STEP, 0, i * STEP + W, page.rect.height)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(k * 2, k * 2), clip=clip, alpha=True)
    shot = Image.frombytes('RGBA', (pix.width, pix.height), pix.samples).resize((sw, H), Image.LANCZOS)
    out.paste(shot, (i * (sw + GAP), 0))
out.save(sys.argv[2])
print(out.size)
