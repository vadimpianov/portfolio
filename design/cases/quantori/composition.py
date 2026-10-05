"""Плитка на главной и обложка кейса Quantori — из композиций пользователя: плитка — `composition.pdf` (Group 28.pdf),
обложка — `cover.pdf` (Group 29.pdf); карточки экранов PharmaKB внахлёст, прозрачный фон с тенями. PyMuPDF с прозрачностью; поля обрезаются по видимым
карточкам (тень слабее порога не в счёт), поэтому верх композиции — y 0, вровень с картинками других плиток.
- quantori-tile-{600,1200}.webp — холст 1200 × 1632 (как у всех плиток), композиция во всю ширину, прижата к верху;
- quantori/cover-{600,1200}.webp — обложка кейса, та же композиция.
Запуск из корня репозитория: python3 design/cases/quantori/composition.py
"""
import pymupdf
from PIL import Image



def load(path):
    page = pymupdf.open(path)[0]
    z = 2400 / page.rect.width  # 2x от ширины плитки
    pix = page.get_pixmap(matrix=pymupdf.Matrix(z, z), alpha=True)
    im = Image.frombytes('RGBA', (pix.width, pix.height), pix.samples)
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 200 else 0).getbbox())


im = load('design/cases/quantori/composition.pdf')
cover = load('design/cases/quantori/cover.pdf')

W, H = 1200, 1632
comp = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
tile = Image.new('RGBA', (W, H), (0, 0, 0, 0))
tile.alpha_composite(comp.crop((0, 0, W, min(H, comp.height))), (0, 0))
for w in (600, 1200):
    tile.resize((w, round(H * w / W)), Image.LANCZOS).save(f'public/images/cases/quantori-tile-{w}.webp', quality=88, method=6)
    cover.resize((w, round(cover.height * w / cover.width)), Image.LANCZOS).save(
        f'public/images/cases/quantori/cover-{w}.webp', quality=88, method=6)
print('tile', comp.size, 'cover', cover.size)
