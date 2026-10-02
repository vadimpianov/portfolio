"""Картинка плитки Quantori на главной: карточки экранов PharmaKB внахлёст (как в референсе пользователя).
1200 × 1632, прозрачный фон, карточки — белые, скругление 24px, мягкая тень.
Запуск из корня репозитория: python3 design/cases/quantori/tile.py
"""
import pymupdf
from PIL import Image, ImageDraw, ImageFilter

SRC = 'design/cases/quantori/screens/'
OUT = 'public/images/cases/'
W, H = 1200, 1632

# Файл, область в pt (x0, y0, x1, y1), ширина карточки в плитке, положение (x, y).
CARDS = [
    ('4-drug-report/Drug Report - Default.pdf', (80, 90, 1240, 830), 760, (40, 40)),
    ('6-company-report/Patents by State - Filters.pdf', (140, 124, 1290, 700), 760, (400, 330)),
    ('6-company-report/Company Reports - Comparison - 3.pdf', (100, 470, 1240, 1100), 760, (40, 700)),
    ('5-disease-report/Disease Report - Default.pdf', (90, 2080, 1240, 2900), 720, (440, 980)),
]


def card(path, clip, width):
    page = pymupdf.open(SRC + path)[0]
    z = width * 2 / (clip[2] - clip[0])  # 2x — с запасом, потом уменьшаем
    pix = page.get_pixmap(matrix=pymupdf.Matrix(z, z), clip=pymupdf.Rect(*clip), alpha=False)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS).convert('RGBA')
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), 24, fill=255)
    im.putalpha(mask)
    return im


tile = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for path, clip, width, (x, y) in CARDS:
    im = card(path, clip, width)
    # Тень: размытая подложка 0 20px 48px, чёрный 16%.
    pad = 96
    shadow = Image.new('RGBA', (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
    sm = Image.new('L', shadow.size, 0)
    ImageDraw.Draw(sm).rounded_rectangle((pad, pad, pad + im.width, pad + im.height), 24, fill=41)
    shadow.putalpha(sm.filter(ImageFilter.GaussianBlur(24)))
    tile.alpha_composite(shadow, (max(0, x - pad), max(0, y - pad + 20))) if x - pad >= 0 else None
    if x - pad < 0:
        layer = Image.new('RGBA', tile.size, (0, 0, 0, 0))
        layer.paste(shadow, (x - pad, y - pad + 20), shadow)
        tile = Image.alpha_composite(tile, layer)
    layer = Image.new('RGBA', tile.size, (0, 0, 0, 0))
    layer.paste(im, (x, y), im)
    tile = Image.alpha_composite(tile, layer)

for w in (600, 1200):
    tile.resize((w, round(H * w / W)), Image.LANCZOS).save(f'{OUT}quantori-tile-{w}.webp', quality=88, method=6)
print('ok')
