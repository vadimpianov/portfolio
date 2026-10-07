"""Жёлтая подложка под весь лист PDF: Chromium оставляет белую полоску ~0,75pt по краям."""
import sys
import pymupdf

path = sys.argv[1]
doc = pymupdf.open(path)
for page in doc:
    # Лист Chromium — 595,92 × 842,88pt: дробный край просмотрщики рисуют светлой линией → ровно 595 × 842
    page.set_mediabox(pymupdf.Rect(0, 0, 595, 842))
    page.draw_rect(page.rect, color=None, fill=(0xf8 / 255, 0xe8 / 255, 0x4a / 255), overlay=False)
doc.save(path + '.tmp', garbage=3, deflate=True)
doc.close()
import os
os.replace(path + '.tmp', path)
