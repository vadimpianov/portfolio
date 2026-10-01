"""Карта сценариев — плитками: одна картинка 12838 × 6342 весит в памяти ~325 МБ, браузер выгружает её
и заново декодирует при прокрутке (на быстрой прокрутке — пустые места). Плитки декодируются по одной,
только видимые.

Плитка — TILE × TILE px (2x) + OVER px нахлёста справа и снизу (без щелей между плитками на дробных px).
Запуск: python scenarios-tiles.py <карта.png (после scenarios-edit.py)> <папка>  →  r{ряд}c{колонка}.webp
"""
import os
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
TILE, OVER = 2048, 2
im = Image.open(sys.argv[1]).convert('RGBA')
out = sys.argv[2]
os.makedirs(out, exist_ok=True)
for name in os.listdir(out):
    os.remove(os.path.join(out, name))
cols, rows = -(-im.width // TILE), -(-im.height // TILE)
for r in range(rows):
    for c in range(cols):
        box = (c * TILE, r * TILE, min(im.width, (c + 1) * TILE + OVER), min(im.height, (r + 1) * TILE + OVER))
        im.crop(box).save(os.path.join(out, f'r{r}c{c}.webp'), quality=82, method=5)
print(im.size, cols, rows)
