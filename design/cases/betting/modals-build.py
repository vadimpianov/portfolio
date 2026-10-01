"""Лента модальных окон из modals.pdf (экраны 375 × 812 pt в ряд).

Экраны находятся по прозрачности (столбцы без пикселей — промежутки), режутся по одному и собираются
заново с зазором GAP (в итоговых px, 2x): между экранами на сайте — GAP / 2 = 24px.
Высота — 2x от высоты ленты (--case-strip-h 502px на 1728).

Запуск: python modals-build.py modals.pdf modals.png  →  затем WebP (sharp).
"""
import sys

import pymupdf
from PIL import Image

H, GAP = 1004, 48
page = pymupdf.open(sys.argv[1])[0]

# Где экраны: столбцы страницы (1 px = 1 pt), где есть непрозрачные пиксели.
probe = page.get_pixmap(matrix=pymupdf.Matrix(1, 1), alpha=True)
alpha = Image.frombytes('RGBA', (probe.width, probe.height), probe.samples).getchannel('A')
row = alpha.crop((0, probe.height // 2, probe.width, probe.height // 2 + 1)).load()
spans, start = [], None
for x in range(probe.width + 1):
    solid = x < probe.width and row[x, 0] > 0
    if solid and start is None:
        start = x
    elif not solid and start is not None:
        spans.append((start, x))
        start = None

k = H / page.rect.height
shots = []
for x0, x1 in spans:
    clip = pymupdf.Rect(x0, 0, x1, page.rect.height)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(k * 2, k * 2), clip=clip, alpha=True)
    shot = Image.frombytes('RGBA', (pix.width, pix.height), pix.samples)
    shots.append(shot.resize((round((x1 - x0) * k), H), Image.LANCZOS))
out = Image.new('RGBA', (sum(s.width for s in shots) + GAP * (len(shots) - 1), H), (0, 0, 0, 0))
x = 0
for s in shots:
    out.paste(s, (x, 0))
    x += s.width + GAP
out.save(sys.argv[2])
print(len(shots), [b - a for a, b in spans], out.size)
