"""Фрагменты экранов PharmaKB для кейса (графики и таблицы крупно), 2x от ширины на сайте.
Область — в pt исходного PDF (x0, y0, x1, y1); картинка шириной 2440px, скругление 24px.
Запуск из корня репозитория: python3 design/cases/quantori/crops.py
"""
import pymupdf
from PIL import Image, ImageDraw

SRC = 'design/cases/quantori/screens/'
OUT = 'public/images/cases/quantori/'
CO = '6-company-report/Company Reports - Default.pdf'
DR = '4-drug-report/Drug Report - Default.pdf'
DI = '5-disease-report/Disease Report - Default.pdf'
CROPS = {
    'stock': ('6-company-report/Company Reports - Comparison - 3.pdf', (100, 470, 1250, 1420)),
    'company-revenue': (CO, (110, 1600, 1330, 2300)),
    'revenue-by-drug': (CO, (110, 2320, 1330, 3570)),
    'patents': (CO, (110, 4550, 1330, 5410)),
    'trials-stream': (DR, (110, 6045, 1330, 6420)),
    'drug-revenue': (DR, (110, 10760, 1340, 11650)),
    'medical-usage': (DR, (110, 11670, 1340, 12860)),
    'trends': (DR, (110, 14350, 1340, 14900)),
    'adverse': (DR, (110, 15020, 1340, 15810)),
    'landscape': (DI, (100, 600, 1330, 1070)),
    'success-rate': (DI, (100, 3090, 1330, 3290)),
    'commercial': (DI, (100, 1965, 1330, 2900)),
}
W = 2440

if __name__ == '__main__':
    import sys
    names = sys.argv[1:] or CROPS
    for name in names:
        path, clip = CROPS[name]
        page = pymupdf.open(SRC + path)[0]
        z = W / (clip[2] - clip[0])
        pix = page.get_pixmap(matrix=pymupdf.Matrix(z, z), clip=pymupdf.Rect(*clip), alpha=False)
        im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples).convert('RGBA')
        mask = Image.new('L', im.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), 24, fill=255)
        im.putalpha(mask)
        im.save(f'{OUT}{name}.webp', quality=86, method=6)
        print(name, im.size)
