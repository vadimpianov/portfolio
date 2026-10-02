"""Картинка плитки Quantori на главной — один в один по референсу пользователя (2000 × 1353):
четыре карточки экранов PharmaKB внахлёст — шапка отчёта по препарату, патенты по типам, акции, коммерческая таблица.
Собирается в координатах референса, затем уменьшается до ширины плитки 1200; верх первой карточки — y 0
(вровень с картинками других плиток). Холст 1200 × 1632, прозрачный фон.
Запуск из корня репозитория: python3 design/cases/quantori/tile.py
"""
import pymupdf
from PIL import Image, ImageDraw, ImageFilter

SRC = 'design/cases/quantori/screens/'
OUT = 'public/images/cases/'
REF_W, TOP = 2000, 25  # ширина референса; верх первой карточки в референсе
W, H = 1200, 1632
RADIUS, SS = 16, 2  # скругление в px референса; рендер карточек с запасом ×2

# Файл, карточка в px референса (x0, y0, x1, y1), левый верхний угол карточки в pt, масштаб px/pt.
CARDS = [
    ('4-drug-report/Drug Report - Default.pdf', (15, 25, 1055, 858), (-11, 47), 0.717),
    ('6-company-report/Patents by State - Filters-1.pdf', (937, 78, 1980, 720), (27, 102), 0.79),
    ('6-company-report/Company Reports - Comparison - 3.pdf', (140, 672, 1055, 1325), (0, 629), 0.641),
    ('5-disease-report/Disease Report - Default.pdf', (985, 585, 1828, 1117), (-75, 2039), 0.6),
]


def card(path, box, origin, s):
    w, h = box[2] - box[0], box[3] - box[1]
    page = pymupdf.open(SRC + path)[0]
    z = s * SS
    clip = pymupdf.Rect(origin[0], origin[1], origin[0] + w / s, origin[1] + h / s) & page.rect
    pix = page.get_pixmap(matrix=pymupdf.Matrix(z, z), clip=clip, alpha=False)
    shot = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    im = Image.new('RGB', (w * SS, h * SS), 'white')
    im.paste(shot, (round((clip.x0 - origin[0]) * z), round((clip.y0 - origin[1]) * z)))
    # Кнопка «Go to top» поверх графика акций — в референсе её нет.
    if 'Comparison' in path:
        cx, cy, r = (1232 - origin[0]) * z, (1531 - origin[1]) * z, 36 * z
        ImageDraw.Draw(im).ellipse((cx - r, cy - r, cx + r, cy + r), fill='white')
    im = im.convert('RGBA')
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), RADIUS * SS, fill=255)
    im.putalpha(mask)
    return im


k = W / REF_W
tile = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for path, box, origin, s in CARDS:
    im = card(path, box, origin, s)
    w, h = round((box[2] - box[0]) * k), round((box[3] - box[1]) * k)
    x, y = round(box[0] * k), round((box[1] - TOP) * k)
    im = im.resize((w, h), Image.LANCZOS)
    # Мягкая тень, как в референсе: 0 12px 40px, чёрный 10%.
    pad = 60
    sh = Image.new('L', (w + pad * 2, h + pad * 2), 0)
    ImageDraw.Draw(sh).rounded_rectangle((pad, pad, pad + w, pad + h), round(RADIUS * k), fill=26)
    sh = sh.filter(ImageFilter.GaussianBlur(20))
    layer = Image.new('RGBA', tile.size, (0, 0, 0, 0))
    black = Image.new('RGBA', sh.size, (0, 0, 0, 255))
    black.putalpha(sh)
    layer.paste(black, (x - pad, y - pad + 8), black)
    layer.paste(im, (x, y), im)
    tile = Image.alpha_composite(tile, layer)

for w in (600, 1200):
    tile.resize((w, round(H * w / W)), Image.LANCZOS).save(f'{OUT}quantori-tile-{w}.webp', quality=88, method=6)
print('ok')
