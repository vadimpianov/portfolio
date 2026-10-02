"""Картинки кейса Quantori (PharmaKB) из PDF пользователя (design/cases/quantori/screens/…).

- drug-report/r{ряд}c{колонка}.webp — отчёт по препарату целиком (1440 × 15900 pt, 2x), плитками 2048;
- screens.webp — лента экранов (1440 × 834 pt каждый, 1x = 2x от высоты ленты на сайте), зазор 64px, скругление 24px.
Запуск из корня репозитория: python3 design/cases/quantori/build.py
"""
import os, subprocess, sys
import pymupdf
from PIL import Image, ImageDraw

Image.MAX_IMAGE_PIXELS = None
SRC = 'design/cases/quantori/screens'
OUT = 'public/images/cases/quantori'
os.makedirs(OUT, exist_ok=True)


def render(path, scale, crop_h=None):
    page = pymupdf.open(os.path.join(SRC, path))[0]
    clip = page.rect if crop_h is None else pymupdf.Rect(0, 0, page.rect.width, crop_h)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), clip=clip, alpha=False)
    return Image.frombytes('RGB', (pix.width, pix.height), pix.samples)


def rounded(im, r):
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = im.convert('RGBA')
    out.putalpha(mask)
    return out


# Отчёт по препарату целиком — плитками.
drug = render('4-drug-report/Drug Report - Default.pdf', 2)
drug.save('/tmp/quantori-drug-report.png')
subprocess.run([sys.executable, 'design/cases/betting/scenarios-tiles.py', '/tmp/quantori-drug-report.png',
                f'{OUT}/drug-report'], check=True)

# Лента экранов.
SCREENS = [
    '2-search-reports/Search Reports - Searching-3.pdf',
    '5-disease-report/Disease Report - Default.pdf',
    '6-company-report/Company Reports - Comparison - 3.pdf',
    '4-drug-report/Clinical Trials - Further Information - Default.pdf',
    '4-drug-report/Estimated US medical usage - Tabular View.pdf',
    '7-favorites/Favourites-1.pdf',
    '4-drug-report/Drug Report - Collapsed Sections.pdf',
]
GAP, H = 64, 834
shots = [rounded(render(s, 1, H), 24) for s in SCREENS]
strip = Image.new('RGBA', (sum(s.width for s in shots) + GAP * (len(shots) - 1), H), (0, 0, 0, 0))
x = 0
for s in shots:
    strip.paste(s, (x, 0), s)
    x += s.width + GAP
strip.save(f'{OUT}/screens.webp', quality=86, method=6)
print('drug', drug.size, 'strip', strip.size)
