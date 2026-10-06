"""
Вайрфрейм отчёта о компании — из того же макета company-report.svg (копия ../drug-report/wireframe.py) (тот же размер и раскладка, что у base.svg):
текст → скруглённые серые полоски (абзацы — по строкам), картинки и графики-растры → рамка с крестом,
кнопки и активные вкладки → серые плашки, цветные квадраты и линии → оттенки серого.
Тултипы, курсоры и шевроны убраны, как в base.svg (список — из build.py: removed.json).

Запуск (после build.py): python3 wireframe.py && node render.mjs wf.svg png-wf && python3 build.py --webp-wf
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')


def live():
    """Каркас живых графиков: снимки без текста (png-live/live{N}.png, 2x) → серые фигуры, надписи (live{N}.json) →
    скруглённые полоски тех же цветов, что у статичной части → public/images/cases/quantori/company/wf/live{N}.webp."""
    import numpy as np
    from PIL import Image, ImageDraw

    hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)
    out_dir = os.path.join(HERE, '../../../../public/images/cases/quantori/company/wf')
    n = 0
    while os.path.exists(os.path.join(HERE, f'png-live/live{n}.png')):
        a = np.asarray(Image.open(os.path.join(HERE, f'png-live/live{n}.png')).convert('RGB')).astype(float)
        lum = a.mean(axis=2)
        ink = np.clip((255 - lum) / 60, 0, 1)[..., None]  # мягкий край (сглаживание)
        target = np.where((lum > 236)[..., None], hexrgb(C_BG), np.where((lum > 200)[..., None], hexrgb(C_LINE), hexrgb(C_SHAPE)))
        light = (lum > 236)[..., None]
        res = np.where(light, np.where((lum < 252)[..., None], hexrgb(C_BG), 255), 255 * (1 - ink) + target * ink)
        im = Image.fromarray(res.astype('uint8'))
        d = ImageDraw.Draw(im)
        for t in json.load(open(os.path.join(HERE, f'png-live/live{n}.json'))):
            m = re.findall(r'\d+', t['color'])
            r, g, b = (int(v) for v in m[:3]) if len(m) >= 3 else (38, 38, 38)
            blue = b > 150 and r < 120
            if r > 240 and g > 240 and b > 240:
                color = '#FFFFFF'
            elif blue:
                color = C_LINK
            elif t['size'] >= 24:
                color = C_HEAD
            elif (r + g + b) / 3 > 120:
                color = C_MUTED
            else:
                color = C_TEXT
            if t['h'] > t['w'] * 1.5 and t['h'] > 30:  # повёрнутая подпись (ось, Historical / Future) — вертикальная полоска
                bw = min(max(t['w'] * 0.62, 7), 30)
                x, y = (t['x'] + (t['w'] - bw) / 2) * 2, t['y'] * 2
                d.rounded_rectangle([x, y, x + bw * 2, y + t['h'] * 2], radius=bw, fill=color)
                continue
            bh = min(max(t['h'] * 0.62, 7), 30)
            x, y, w = t['x'] * 2, (t['y'] + (t['h'] - bh) / 2) * 2, t['w'] * 2
            h2 = bh * 2
            d.rounded_rectangle([x, y, x + max(w, h2), y + h2], radius=h2 / 2, fill=color)
        im.save(os.path.join(out_dir, f'live{n}.webp'), 'WEBP', quality=86, method=6)
        print('live', n, im.size)
        n += 1


if '--live' in sys.argv:
    C_BG, C_LINE, C_TEXT, C_HEAD, C_MUTED, C_LINK, C_SOLID, C_SHAPE = (
        '#F3F4F6', '#D9DCE1', '#C4C9D0', '#A9AFB8', '#D6D9DE', '#B7C3D6', '#9FA6B0', '#C9CDD3')
    live()
    sys.exit()

els = json.load(open(os.path.join(HERE, 'els.json')))
removed = set(json.load(open(os.path.join(HERE, 'removed.json'))))
tree = ET.parse(os.path.join(HERE, 'company-report.svg'))
svg = tree.getroot()
children = list(svg)

BLUE = {'#0D69EB', '#0357CC', '#004FBE', '#0B6FD3', '#1E9AF1'}
DARK = {'#262626', '#383A3E', 'black'}
MID = {'#595959', '#989BA2', '#8A8D93', '#B6B8BB', '#606165', '#8B8B8B', '#8E8E8E', '#AAAAAA'}
LIGHT = {'#F5F5F6', '#F0F5FB', '#F8FBFE'}
LINE = {'#DFDDDF', '#E7E6E7'}

C_BG = '#F3F4F6'
C_LINE = '#D9DCE1'
C_TEXT = '#C4C9D0'
C_HEAD = '#A9AFB8'
C_MUTED = '#D6D9DE'
C_LINK = '#B7C3D6'
C_SOLID = '#9FA6B0'
C_SHAPE = '#C9CDD3'


def recolor(c):
    if c in (None, 'none') or c.startswith('url('):
        return c
    if c == 'white':
        return c
    if c in LIGHT:
        return C_BG
    if c in LINE:
        return C_LINE
    if c in BLUE:
        return C_SOLID
    if c in DARK:
        return C_TEXT
    return C_SHAPE


def bar(x, y, w, h, color):
    h = max(4, round(h))
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{max(w, h):.1f}" height="{h}" rx="{h / 2:.1f}" fill="{color}"/>'


out = []
for k, (e, node) in enumerate(zip(els, children)):
    tag = node.tag.split('}')[1]
    if tag == 'defs':
        out.append(ET.tostring(node, encoding='unicode'))
        continue
    if k in removed or e['w'] is None or tag == 'mask':
        if tag == 'mask':
            out.append(ET.tostring(node, encoding='unicode'))
        continue
    x, y, w, h = e['x'], e['y'], e['w'], e['h']
    fill, stroke = e['f'], e['s']
    if k == 0:  # фон страницы
        out.append(ET.tostring(node, encoding='unicode'))
        continue
    # Картинка (график-растр, структура белка) → рамка с крестом
    if fill and fill.startswith('url(') and w > 30:
        out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{C_BG}" stroke="{C_LINE}"/>'
                   f'<path d="M{x} {y}L{x + w} {y + h}M{x + w} {y}L{x} {y + h}" stroke="{C_LINE}"/>')
        continue
    if fill and fill.startswith('url('):
        continue
    is_text = (tag == 'path' and fill and fill not in LIGHT and fill not in LINE and not stroke
               and not (w <= 18 and h <= 18 and abs(w - h) < 3) and not (w <= 14 and h <= 8)
               and w > 4 and (h < 70 or w > 150))
    if is_text and fill in BLUE and h >= 20 and w < 150:
        is_text = False  # синяя плашка (активный сегмент), не текст
    if is_text:
        color = (C_HEAD if (fill in DARK and h >= 17 and w < 400) else
                 'white' if fill == 'white' else
                 C_LINK if fill in BLUE else
                 C_MUTED if fill in MID else C_TEXT)
        if h > 22 and w > 150 and k not in (17, 18):  # абзац (17, 18 — название компании, одна строка): полоска на строку (интервал ~24px)
            lines = max(2, round((h + 6) / 24))
            step = (h - 10) / (lines - 1)
            for n in range(lines):
                lw = w * (0.62 if n == lines - 1 else 1)
                out.append(bar(x, y + n * step + 1, lw, 9, color))
        else:
            bh = min(max(h * 0.62, 7), 26)
            out.append(bar(x, y + (h - bh) / 2, w, bh, color))
        continue
    # Остальное — та же фигура, в сером
    s = ET.tostring(node, encoding='unicode')
    for attr in ('fill', 'stroke'):
        s = re.sub(rf'{attr}="([^"]+)"', lambda m: f'{attr}="{recolor(m.group(1))}"', s)
    out.append(s)

head = re.match(r'<svg[^>]*>', open(os.path.join(HERE, 'company-report.svg')).read(2000)).group(0)
body = '\n'.join(re.sub(r'\sxmlns(:\w+)?="[^"]+"', '', s) for s in out)
open(os.path.join(HERE, 'wf.svg'), 'w').write(head + '\n' + body + '\n</svg>\n')
print('wf.svg', len(out))
