"""
Интерактивный отчёт по препарату (кейс Quantori) из макета пользователя drug-report.svg (1440 × 15766, плоский SVG без текста).

1. measure.mjs → els.json: координаты всех элементов верхнего уровня (Chromium).
2. Этот скрипт:
   - убирает из макета всё, что на сайте делается кодом: тултипы, курсоры, шевроны, вкладки, переключатели
     FDA/EMA и валют, чипсы, кнопку «наверх» → base.svg;
   - режет страницу на куски по раскрывающимся разделам → дерево `tree` (статичные куски, разделы, группы);
   - собирает интерактивные зоны: ссылки, строки таблиц, иконки, кнопки, точки графиков → `items`;
   - пишет src/components/case/quantori/drug-report.json.
3. render.mjs рендерит куски base.svg в 2x → PNG, этот же скрипт (`--webp`) жмёт их в WebP
   public/images/cases/quantori/report/s{N}.webp.

Запуск: node measure.mjs && python3 build.py && node render.mjs && python3 build.py --webp
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '../../../..'))
OUT_JSON = os.path.join(ROOT, 'src/components/case/quantori/drug-report.json')
OUT_IMG = os.path.join(ROOT, 'public/images/cases/quantori/report')
PNG_DIR = os.path.join(HERE, 'png')
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

if '--webp' in sys.argv:
    from PIL import Image

    os.makedirs(OUT_IMG, exist_ok=True)
    for f in os.listdir(OUT_IMG):
        os.remove(os.path.join(OUT_IMG, f))
    for f in sorted(os.listdir(PNG_DIR)):
        im = Image.open(os.path.join(PNG_DIR, f)).convert('RGB')
        im.save(os.path.join(OUT_IMG, f.replace('.png', '.webp')), 'WEBP', quality=86, method=6)
    print('webp:', len(os.listdir(OUT_IMG)))
    sys.exit()

els = json.load(open(os.path.join(HERE, 'els.json')))
tree = ET.parse(os.path.join(HERE, 'drug-report.svg'))
svg = tree.getroot()
children = list(svg)
assert len(children) == len(els)

BLUE = ('#0D69EB', '#0357CC', '#004FBE', '#0B6FD3')
DARK = '#383A3E'
H = 15766


def box(e):
    return (e['x'], e['y'], e['x'] + e['w'], e['y'] + e['h'])


def inside(e, x0, y0, x1, y1):
    if e['w'] is None or e['t'] == 'defs' or e['w'] >= 1440:
        return False
    a = box(e)
    return a[0] >= x0 and a[1] >= y0 and a[2] <= x1 and a[3] <= y1


def within(x0, y0, x1, y1):
    return [e for e in els if inside(e, x0, y0, x1, y1)]


def r1(v):
    return round(v, 1)


remove = set()

# --- Тултипы (тёмные плашки) — на сайте HTML ---
for k, e in enumerate(els):
    if e['t'] == 'rect' and e['f'] == DARK and e['w'] > 40:
        x0, y0, x1, y1 = box(e)
        grp = [k]
        j = k - 1
        if els[j]['f'] == DARK and els[j]['w'] <= 12.5 and els[j]['h'] <= 12.5:
            grp.append(j)
        j = k + 1
        while inside(els[j], x0 - 12, y0 - 12, x1 + 12, y1 + 12):
            grp.append(j)
            j += 1
        remove.update(grp)
remove.add(1159)  # стрелка тултипа без плашки

# --- Курсоры и руки ---
for k, e in enumerate(els):
    if e['f'] and e['f'].startswith('url(#pattern') and e['w'] < 18:
        remove.add(k)
    if e['f'] == 'white' and e['t'] == 'path' and e['w'] == 11 and e['h'] == 11 and els[k + 1]['f'] == DARK:
        remove.update((k, k + 1))

# --- Главные вкладки (9 полос) ---
tabbars = sorted({round(e['y'] - 0.5) for e in els if e['s'] == '#DFDDDF' and e['t'] == 'rect' and e['h'] == 51})
for y in tabbars:
    remove.update(e['i'] for e in within(118, y - 2, 1322, y + 54))

# --- Чипсы в шапке ---
remove.update(e['i'] for e in within(118, 326, 890, 366))

# --- Переключатели FDA/EMA и валют ---
segs = []
for e in els:
    if e['t'] == 'rect' and e['f'] == 'white' and e['h'] == 28 and e['w'] > 100:
        x0, y0, x1, y1 = box(e)
        remove.update(i['i'] for i in within(x0 - 1, y0 - 1, x1 + 1, y1 + 1))
        segs.append((x0, y0, e['w']))

# --- Строки вкладок с подчёркиванием (периоды, NDA/ANDA, мишени) ---
SUBTABS = {
    670: ['5D', '1M', '3M', '6M', 'YTD', '1Y', '2Y', '5Y', 'Max'],
    1926: ['New Drug Application (NDA)', 'Abbreviated New Drug Application (ANDA)'],
    9482: ['PTGS1', 'PTGS2', 'COX-3', 'SLC6A4'],
    9922: ['SLC6A2', 'HRH1', 'CHRM1', 'CHRM2'],
}
subtabs = []
for uy, labels in SUBTABS.items():
    row = within(115, uy - 26, 1000, uy + 3)
    texts = sorted([e for e in row if e['t'] == 'path'], key=lambda e: e['x'])
    assert len(texts) == len(labels), (uy, len(texts))
    remove.update(e['i'] for e in row)
    subtabs.append({'k': 'subtabs', 'y': uy - 30, 'h': 32, 'x': 120, 'w': 900,
                    'items': [{'x': r1(t['x'] - 1), 'label': l} for t, l in zip(texts, labels)]})

# --- Кнопка «Go to top» → своя, прилипает к низу рамки ---
remove.update(e['i'] for e in within(1200, 15676, 1270, 15745))

# --- Шевроны разделов и групп ---
chevrons = [e for e in els if e['t'] == 'path' and e['s'] in ('#383A3E', '#0357CC') and e['w'] == 14 and e['h'] < 7]
GROUP_CHEV = [e for e in els if e['f'] == DARK and e['w'] == 11 and e['h'] == 6 and e['x'] in (1304.5, 1288.5)
              and e['y'] in (1959, 2698, 11707, 12858)]
for e in chevrons + GROUP_CHEV:
    remove.add(e['i'])


def snippet(k, fill=None):
    """Разметка элемента для вставки в inline SVG (координаты исходника)."""
    el = children[k]
    s = ET.tostring(el, encoding='unicode')
    s = re.sub(r'\sxmlns(:\w+)?="[^"]+"', '', s)
    if fill:
        s = s.replace(f'fill="{els[k]["f"]}"', f'fill="{fill}"')
    return s


chev_big = snippet(chevrons[0]['i'])
chev_small = snippet(GROUP_CHEV[0]['i'])

# --- Дерево кусков ---
bars = sorted(e['y'] for e in els if e['f'] == '#F0F5FB' and e['h'] == 52)
bounds = sorted(bars + tabbars + [H])
GROUPS = [(1940, 1980, 2424), (2686, 2740, None), (11690, 11728, 12790), (12840, 12880, 13925)]

slices = []


def piece(y0, y1):
    slices.append([y0, y1])
    return {'s': len(slices) - 1, 'y0': y0, 'y1': y1}


# Панели вкладок: первая — липкая полоса (HTML, 12px белого сверху и снизу), остальные вырезаны вместе
# с отступом под ними (92px); на их месте — якоря разделов для прокрутки и подсветки вкладки.
NAV_PAD = 12
CUTS = [(tabbars[0] - NAV_PAD, tabbars[0] + 52 + NAV_PAD, 'nav', 0)] + \
       [(t, t + 92, 'anchor', n) for n, t in enumerate(tabbars) if n > 0]


def static(y0, y1):
    out = []
    for c0, c1, kind, n in CUTS:
        if y0 <= c0 < y1:
            assert c1 <= y1, (c0, c1, y1)
            if c0 > y0:
                out.append({'k': 'img', **piece(y0, c0)})
            if kind == 'nav':
                out.append({'k': 'nav', 'h': c1 - c0})
                out.append({'k': 'anchor', 'n': 0})
            else:
                out.append({'k': 'anchor', 'n': n})
            y0 = c1
    if y1 > y0:
        out.append({'k': 'img', **piece(y0, y1)})
    return out


nodes = []
cursor = 0
for b in bars:
    if b > cursor:
        nodes.extend(static(cursor, b))
    nxt = next(v for v in bounds if v > b)
    end = H - 24 if nxt == H else nxt - 32
    body = []
    c = b + 52
    for g0, g1, g2 in GROUPS:
        if b < g0 < end:
            if g0 > c:
                body.append({'k': 'img', **piece(c, g0)})
            gend = g2 or end
            body.append({'k': 'sec', 'grp': True, 'head': piece(g0, g1), 'body': [{'k': 'img', **piece(g1, gend)}]})
            c = gend
    if end > c:
        body.append({'k': 'img', **piece(c, end)})
    nodes.append({'k': 'sec', 'head': piece(b, b + 52), 'body': body})
    cursor = end
nodes.extend(static(cursor, H))

# --- Интерактивные зоны ---
items = []


def add(kind, x, y, w, h, **kw):
    items.append({'k': kind, 'x': r1(x), 'y': r1(y), 'w': r1(w), 'h': r1(h), **kw})


# Шевроны: в шапке раздела/группы
for e in chevrons:
    add('chev', e['x'] - 5, e['y'] - 8, 24, 22, svg='big')
for e in GROUP_CHEV:
    add('chev', e['x'] - 5, e['y'] - 8, 21, 22, svg='small')

# Вкладки
TABS = ['Events Timeline', 'Commercial', 'Clinical', 'Drug', 'Target', 'Variants', 'Financial', 'Trends', 'Safety']

# Чипсы в шапке
add('chips', 120, 328, 800, 36, labels=['BMS', 'COVID-19', 'Top 200 Pharmaceuticals by Retail Sales', 'Top Sellings Pharmaceuticals'])

# Переключатели
for x0, y0, w in segs:
    if w > 150:
        add('seg', x0, y0, w, 28, labels=['$', '€', '£', '₣'], tips=['USD', 'EUR', 'GBP', 'CHF'])
    else:
        add('seg', x0, y0, w, 28, labels=['FDA', 'EMA'])

items.extend(subtabs)

# Кнопки с обводкой
for e in els:
    if e['t'] == 'rect' and e['s'] in BLUE and e['h'] >= 30 and e['i'] not in remove:
        if e['y'] < 200:
            add('menu', e['x'], e['y'], e['w'], e['h'], menu='download', options=['CSV', 'JSON', 'XLSX', 'PPTX'], files=True)
        else:
            add('btn', e['x'], e['y'], e['w'], e['h'])
# «Events ▾»
add('menu', 1246, 646, 76, 24, menu='events', options=['Events', 'Approvals', 'Clinical trials', 'Patents'], text=True)

# Избранное, коллекция, оповещения — иконка заливается по нажатию
STAR = '<path fill="#0D69EB" d="M6 .6l1.62 3.47 3.78.47-2.78 2.6.72 3.75L6 9.05 2.66 10.9l.72-3.76L.6 4.54l3.78-.47z"/>'
BELL = '<path fill="#0D69EB" d="M6 0a1 1 0 0 1 1 1v.3A3.8 3.8 0 0 1 9.8 5v3.2l1.2 1.5V10.5H1v-.8l1.2-1.5V5A3.8 3.8 0 0 1 5 1.3V1a1 1 0 0 1 1-1zm-1.6 11.2h3.2a1.6 1.6 0 0 1-3.2 0z"/>'
# «Add to Collection»: звёздочка из макета заменена папкой (контур — всегда, залитая с галочкой — по нажатию)
FOLDER = 'M.8 2.6a.9.9 0 0 1 .9-.9h2.9l1.3 1.4h4.4a.9.9 0 0 1 .9.9v5.9a.9.9 0 0 1-.9.9H1.7a.9.9 0 0 1-.9-.9z'
FOLDER_LINE = f'<path d="{FOLDER}" fill="none" stroke="#0D69EB" stroke-width="1.2" stroke-linejoin="round"/>' \
              '<path d="M6 4.9v3.2M4.4 6.5h3.2" stroke="#0D69EB" stroke-width="1.2" stroke-linecap="round"/>'
FOLDER_FULL = f'<path d="{FOLDER}" fill="#0D69EB" stroke="#0D69EB" stroke-width="1.2" stroke-linejoin="round"/>' \
              '<path d="M4.3 6.6l1.2 1.2 2.3-2.4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'
remove.add(17)
for icon, label_end, shape, base in ((15, 249, STAR, None), (17, 393, FOLDER_FULL, FOLDER_LINE), (19, 491, BELL, None)):
    e = els[icon]
    add('fav', e['x'] - 2, 284, label_end - e['x'] + 4, 24, ix=r1(e['x']), iy=r1(e['y']), iw=r1(e['w']), ih=r1(e['h']),
        icon=shape, base=base)

# Копировать (иконка в строке Structure)
add('copy', 1290, 8828, 22, 24)

# Иконки «i»
INFO_TIPS = {
    1302.7: {'list': ['001: 500mg/50ml (10mg/ml) solution (intravenous, RLD, RS, RX)',
                      '002: 1gm/100ml (10mg/ml) solution (intravenous, RLD, RS, RX)'], 'pos': 'top', 'wide': True},
    1068.7: {'list': ['DP = Drug Product', 'DS = Drug Substance'], 'pos': 'top'},
    292.6: {'text': 'Company-reported sales, USD millions', 'pos': 'top'},
    377.6: {'text': 'Estimated from US claims data', 'pos': 'top'},
}
for e in els:
    if e['t'] == 'circle' and e['s'] and abs(e['w'] - 14.7) < 0.2:
        tip = INFO_TIPS.get(e['x'])
        add('info', e['x'] - 3, e['y'] - 3, 21, 21, tip=tip, color=e['s'])

# Ссылки (синий текст в одну строку)
TIP_NLM = {'text': 'National Library of Medicine', 'ext': True, 'pos': 'bottom'}
TIP_MESH = {'text': 'Show MeSH hierarchy', 'pos': 'bottom'}
TIP_EFO = {'text': 'Experimental Factor Ontology', 'ext': True, 'pos': 'bottom'}
TIP_ICD = {'text': 'WHO ICD-10 classification', 'ext': True, 'pos': 'bottom'}
LINK_TIPS = [  # (y0, y1, x, подсказка)
    (1352, 1556, 773, TIP_NLM), (1352, 1556, 201, TIP_MESH),
    (3588, 3990, 773, TIP_NLM), (3588, 3990, 200, TIP_MESH), (3588, 3990, 201, TIP_MESH),
    (3588, 3990, 487, TIP_EFO), (3588, 3990, 996, TIP_ICD), (3588, 3990, 997, TIP_ICD),
    (6430, 7900, 201, TIP_MESH), (6430, 7900, 487, TIP_NLM), (6430, 7900, 681, TIP_EFO),
    (6430, 7900, 833, TIP_ICD), (6430, 7900, 837, TIP_ICD),
]
button_boxes = [(i['x'], i['y'], i['x'] + i['w'], i['y'] + i['h']) for i in items if i['k'] in ('btn', 'menu')]
for e in els:
    if e['t'] != 'path' or e['f'] not in BLUE or e['i'] in remove or e['w'] < 14:
        continue
    x0, y0, x1, y1 = box(e)
    if any(b[0] <= x0 and b[1] <= y0 and x1 <= b[2] and y1 <= b[3] for b in button_boxes):
        continue
    if 9 < e['h'] < 17.5:
        tip = next((t for a, b, x, t in LINK_TIPS if a < e['y'] < b and round(e['x']) == x), None)
        add('a', x0, y0 - 2, e['w'], e['h'] + 6, tip=tip)
    elif 17.5 <= e['h'] < 60:
        add('a', x0, y0 - 2, e['w'], e['h'] + 4, multi=True)

# Строки таблиц: полосы зебры + белые строки между ними
zebra = sorted((e for e in els if e['f'] == '#F5F5F6' and e['t'] == 'rect' and e['w'] >= 500 and e['y'] > 400),
               key=lambda e: (e['x'], e['w'], e['y']))
textish = [e for e in els if e['t'] == 'path' and e['f'] in ('#262626', '#595959') + BLUE and e['h'] < 60]
rows = []
for k, e in enumerate(zebra):
    rows.append((e['x'], e['y'], e['w'], e['h']))
    nxt = zebra[k + 1] if k + 1 < len(zebra) else None
    bottom = e['y'] + e['h']
    if nxt and nxt['x'] == e['x'] and nxt['w'] == e['w'] and 0 < nxt['y'] - bottom <= 90:
        rows.append((e['x'], bottom, e['w'], nxt['y'] - bottom))
    elif not nxt or nxt['x'] != e['x'] or nxt['w'] != e['w'] or nxt['y'] - bottom > 90:
        # последняя белая строка, если под полосой есть текст
        gap = next((g for (gx, gy, gw, gh) in reversed(rows[:-1]) if gx == e['x'] and gw == e['w']
                    for g in [gh] if gy + gh == e['y']), None)
        if gap and any(t['y'] >= bottom and t['y'] + t['h'] <= bottom + gap and e['x'] <= t['x'] <= e['x'] + e['w']
                       for t in textish):
            rows.append((e['x'], bottom, e['w'], gap))
for x, y, w, h in rows:
    add('row', x, y, w, h)

# Точки на графиках (векторные): подсказка «год — значение»
grid = {}
for e in els:
    if e['t'] == 'rect' and e['f'] == '#DFDDDF' and e['h'] == 1 and e['w'] in (1048, 488):
        grid.setdefault((e['x'], e['w'], 0 if e['y'] < 12900 else 1), []).append(e['y'])
SCALE_80K = [i * 10000 for i in range(9)]
REFILL = [0, 3.23, 5.29, 7.11, 9.78, 11.12, 13.54, 15.21, 20.99]
CHARTS = {(249, 1048): ('usd_m', SCALE_80K), (249, 488): ('people', SCALE_80K), (821, 488): ('purchases', SCALE_80K),
          (256, 488): ('refill', REFILL), (832, 488): ('usd', SCALE_80K)}
pts = [e for e in els if e['f'] == DARK and e['t'] in ('rect', 'path') and 5 <= e['w'] <= 7 and 5 <= e['h'] <= 7
       and 11780 < e['y'] < 14000 and e['i'] not in remove]
npoints = 0
for (gx, gw, part), ys in grid.items():
    ys = sorted(ys, reverse=True)  # снизу вверх
    unit, labels = CHARTS[(gx, gw)]
    inn = sorted((p for p in pts if gx - 12 <= p['x'] <= gx + gw + 12 and ys[-1] - 12 <= p['y'] <= ys[0] + 12),
                 key=lambda p: p['x'])
    for n, p in enumerate(inn):
        cy = p['y'] + p['h'] / 2
        val = labels[0]
        for a in range(len(ys) - 1):
            if ys[a + 1] <= cy <= ys[a]:
                t = (ys[a] - cy) / (ys[a] - ys[a + 1])
                val = labels[a] + t * (labels[a + 1] - labels[a])
        val = max(0, val)
        add('pt', p['x'] + p['w'] / 2 - 12, cy - 12, 24, 24, tip={'title': str(2016 + n), 'value': round(val, 2), 'unit': unit, 'pos': 'top'})
        npoints += 1

# Подсказки на растровых графиках выручки (как в макете)
add('zone', 1254, 10951, 24, 24, tip={'title': '2019-Q1', 'rows': [['#000', 'Global Sales: ******* $']],
                                       'note': 'Subscribe at biometadata.com and start now with immediate access to the BioHarmony database',
                                       'pos': 'left'})
add('zone', 1186, 11306, 24, 24, tip={'title': '2020-Q1', 'rows': [['#000', 'Global Sales: $19,832.2 M'], ['#0077BB', 'US: $16,112.5 M'],
                                                                    ['#AAAAAA', 'Rest of World: $3,720.5 M']], 'pos': 'left'})

# Значок-ссылка у заголовка раздела: копирует ссылку на раздел
for e in els:
    if e['f'] == '#8A8D93' and round(e['w']) == 17 and round(e['h']) == 16:
        add('icon', e['x'] - 5, e['y'] - 4, e['w'] + 10, e['h'] + 8, tip={'text': 'Copy link to section', 'pos': 'top'},
            copied='Link copied')

# Легенда таймлайна (квадрат + подпись + ×) и события того же цвета
LEGEND = {'#DD4F4F': 'FDA approval date', '#5284CF': 'EMA approval date', '#72B123': 'FDA advisory meeting dates',
          '#DC915B': 'Patent expiration date', '#5FBC50': 'Study first post date', '#3867A0': 'Last update post date',
          '#9D56BF': 'Start date', '#C41D63': 'Primary completion date', '#8D6A79': 'Results first post date',
          '#6B5454': 'Competitor approved'}
for k, e in enumerate(els):
    if e['t'] == 'rect' and e['f'] in LEGEND and round(e['w']) == 12 and e['y'] < 760:
        cross = els[k + 2] if els[k + 2]['f'] == '#606165' else els[k + 3]
        items.append({'k': 'leg', 'x': r1(e['x'] - 4), 'y': r1(e['y'] - 4), 'w': r1(cross['x'] + cross['w'] - e['x'] + 8),
                      'h': 20, 'c': e['f'], 'xx': r1(cross['x'] - e['x'] + 4)})
    if e['t'] == 'rect' and e['f'] in LEGEND and round(e['w']) == 23:
        add('ev', e['x'], e['y'], e['w'], e['h'], c=e['f'], tip={'text': LEGEND[e['f']], 'pos': 'top'})
# Легенды графиков выручки (квадрат + подпись): включить/выключить серию
for k, e in enumerate(els):
    if e['t'] == 'path' and e['f'] in ('#265989', '#0A9E21', '#498ABA', '#C8C9E9', '#863875') and round(e['w']) == 12:
        lab = els[k + 1]
        add('leg', e['x'] - 4, e['y'] - 4, lab['x'] + lab['w'] - e['x'] + 8, 20, c=e['f'])
# Панель событий (по клику на квадрат таймлайна) — слева внутри рамки графика
add('evpanel', 121, 769, 360, 244)
# Прочие иконки
add('icon', 594, 8262, 28, 28, tip={'text': 'Classification differs between FDA and EMA', 'pos': 'top'})
for k in (734, 910, 968, 989):
    e = els[k]
    add('icon', e['x'] - 5, e['y'] - 5, e['w'] + 10, e['h'] + 10)

# Каждую зону — в кусок, где её верх
def leaf_of(y):
    for n, (a, b) in enumerate(slices):
        if a <= y < b:
            return n
    return len(slices) - 1


for it in items:
    s = leaf_of(it['y'] + (it['h'] / 2 if it['k'] == 'chev' else 0))
    it['s'] = s
    it['y'] = r1(it['y'] - slices[s][0])

data = {'width': 1440, 'slices': slices, 'nodes': nodes, 'items': items, 'tabs': TABS, 'navPad': NAV_PAD, 'chev': {'big': chev_big, 'small': chev_small,
                                     'bigBox': [chevrons[0]['x'], chevrons[0]['y'], chevrons[0]['w'], chevrons[0]['h']],
                                     'smallBox': [GROUP_CHEV[0]['x'], GROUP_CHEV[0]['y'], GROUP_CHEV[0]['w'], GROUP_CHEV[0]['h']]}}
json.dump(data, open(OUT_JSON, 'w'), ensure_ascii=False, separators=(',', ':'))

# Макет без убранных элементов → base.svg (для render.mjs)
for k in sorted(remove, reverse=True):
    svg.remove(children[k])
tree.write(os.path.join(HERE, 'base.svg'))
json.dump(slices, open(os.path.join(HERE, 'slices.json'), 'w'))
from collections import Counter
print('removed', len(remove), 'slices', len(slices), 'items', Counter(i['k'] for i in items), 'points', npoints)
