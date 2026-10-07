"""Экран «Search Diseases - Default-2» (поиск Chondromalacia) без шапки сайта (верх 56pt срезан) → public/images/cases/quantori/search-diseases.webp, 2x, скругление 32px (16px на сайте)."""
import io
import pathlib

import pymupdf
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[3]
SRC = ROOT / 'design/cases/quantori/screens/3-search/Search Diseases - Default-2.pdf'
OUT = ROOT / 'public/images/cases/quantori/search-diseases.webp'

page = pymupdf.open(SRC)[0]
clip = pymupdf.Rect(0, 56, page.rect.width, page.rect.height)  # шапка сайта (логотип, меню) — выше 56pt
pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False, clip=clip)
img = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGBA')
mask = Image.new('L', img.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius=32, fill=255)
img.putalpha(mask)
img.save(OUT, 'WEBP', quality=88, method=6)
print(OUT, img.size)
