"""
Ленты экранов для историй «Поиск», «Мои отчёты», «Коллекции», «Оповещения» (кейс Quantori)
из PDF пользователя (screens/…): каждый экран — верх кадра 1440 × 834, рендер PyMuPDF 1x (на сайте лента
~400px — это 2x), скругление 16px, зазор 48px, прозрачный фон → public/images/cases/quantori/<имя>.webp.
Запуск: python3 stories.py
"""
import os
import pymupdf
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '../../../public/images/cases/quantori')
S = os.path.join(HERE, 'screens')
STRIPS = {
    'search': ['2-search-reports/Search Reports - Searching-2.pdf', '2-search-reports/Search Reports - Searching-4.pdf',
               '2-search-reports/Search Reports - Searching-5.pdf', '2-search-reports/Search Reports - Searching-1.pdf',
               '2-search-reports/Search Reports - 001.2 Download report - Dropdown.pdf',
               '2-search-reports/Search Reports - 001.3 Download report - Downloading.pdf'],
    'favorites': ['7-favorites/Favourites-1.pdf', '7-favorites/Favourites-2.pdf', '7-favorites/Adding to Favorites-10.pdf',
                  '7-favorites/Favourites-6.pdf', '7-favorites/Favourites-5.pdf'],
    'collections': ['3-search/Search Companies - Default-1.pdf', '7-favorites/Favourites-4.pdf', '7-favorites/Favourites.pdf',
                    '7-favorites/Adding to Favorites-11.pdf'],
    'alerts': ['7-favorites/Adding to Favorites-1.pdf', '7-favorites/Adding to Favorites-3.pdf',
               '7-favorites/Adding to Favorites-13.pdf', '7-favorites/Favourites-3.pdf'],
}
H, R, GAP = 834, 16, 48

for name, files in STRIPS.items():
    shots = []
    for f in files:
        page = pymupdf.open(os.path.join(S, f))[0]
        pix = page.get_pixmap(clip=pymupdf.Rect(0, 0, 1440, H), alpha=False)
        im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples).convert('RGBA')
        mask = Image.new('L', im.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=R, fill=255)
        im.putalpha(mask)
        shots.append(im)
    W = sum(i.width for i in shots) + GAP * (len(shots) - 1)
    strip = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    x = 0
    for im in shots:
        strip.paste(im, (x, 0), im)
        x += im.width + GAP
    strip.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', quality=88, method=6)
    print(name, strip.size)
