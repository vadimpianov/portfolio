"""
Интерактивный отчёт по компании (кейс Quantori) из макета пользователя company-report.svg (1440 × 6615, плоский SVG без текста).
Та же схема, что у отчёта по препарату (../drug-report/build.py), но три графика — живые компоненты кейса
(Stock Price, Revenue by Drug, Patents — узлы `live` 0, 1, 2; DrugReport вставляет их из слотов `l0…l2`).

1. measure.mjs → els.json: координаты всех элементов верхнего уровня (Chromium).
2. Этот скрипт: убирает из макета тултипы, курсоры, шевроны, вкладки, подвкладки, кнопку «наверх» → base.svg;
   режет страницу на куски (разделы сворачиваются), собирает зоны → src/components/case/quantori/company-report.json.
3. render.mjs рендерит куски base.svg в 2x → PNG, `--webp` жмёт их в public/images/cases/quantori/company/s{N}.webp.

Запуск: node measure.mjs && python3 build.py && node render.mjs && python3 build.py --webp
Каркас: python3 wireframe.py && node render.mjs wf.svg png-wf && python3 build.py --webp-wf;
каркас живых графиков — node live-wireframe.mjs (при запущенном pnpm preview).
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '../../../..'))
OUT_JSON = os.path.join(ROOT, 'src/components/case/quantori/company-report.json')
OUT_IMG = os.path.join(ROOT, 'public/images/cases/quantori/company')
PNG_DIR = os.path.join(HERE, 'png')
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

if '--webp' in sys.argv or '--webp-wf' in sys.argv:
    from PIL import Image

    wf = '--webp-wf' in sys.argv  # каркас (wireframe.py) → company/wf/ (live*.webp — от live-wireframe.mjs, не трогаем)
    src, dst = (os.path.join(HERE, 'png-wf'), os.path.join(OUT_IMG, 'wf')) if wf else (PNG_DIR, OUT_IMG)
    os.makedirs(dst, exist_ok=True)
    for f in os.listdir(dst):
        if f.endswith('.webp') and f.startswith('s'):
            os.remove(os.path.join(dst, f))
    for f in sorted(os.listdir(src)):
        im = Image.open(os.path.join(src, f)).convert('RGB')
        im.save(os.path.join(dst, f.replace('.png', '.webp')), 'WEBP', quality=86, method=6)
    print('webp:', len(os.listdir(dst)))
    sys.exit()

els = json.load(open(os.path.join(HERE, 'els.json')))
tree = ET.parse(os.path.join(HERE, 'company-report.svg'))
svg = tree.getroot()
children = list(svg)
assert len(children) == len(els)

BLUE = ('#0D69EB', '#0357CC')
DARK = '#383A3E'
H = 6615


def box(e):
    return (e['x'], e['y'], e['x'] + e['w'], e['y'] + e['h'])


def inside(e, x0, y0, x1, y1):
    if e['w'] is None or e['t'] in ('defs', 'mask') or e['w'] >= 1440:
        return False
    a = box(e)
    return a[0] >= x0 and a[1] >= y0 and a[2] <= x1 and a[3] <= y1


def within(x0, y0, x1, y1):
    return [e for e in els if inside(e, x0, y0, x1, y1)]


def r1(v):
    return round(v, 1)


remove = set()

# --- Тултипы (тёмные плашки + стрелки) ---
for k, e in enumerate(els):
    if e['t'] == 'rect' and e['f'] == DARK and e['w'] > 40:
        x0, y0, x1, y1 = box(e)
        remove.add(k)
        j = k + 1
        while j < len(els) and inside(els[j], x0 - 1, y0 - 1, x1 + 1, y1 + 1):
            remove.add(j)
            j += 1
    if e['t'] == 'path' and e['f'] == DARK and e['w'] == 12 and abs(e['h'] - 7.3) < 0.2:
        remove.add(k)

# --- Курсоры-руки ---
for k, e in enumerate(els):
    if e['f'] == 'white' and e['t'] == 'path' and e['w'] == 11 and e['h'] == 11 and els[k + 1]['f'] == DARK:
        remove.update((k, k + 1))

# --- Вкладки разделов (3 полосы) ---
tabbars = [398, 3581, 5430]
for y in tabbars:
    remove.update(e['i'] for e in within(118, y - 2, 1322, y + 54))

# --- Кнопка «Go to top» → своя ---
remove.update(e['i'] for e in within(1200, 6520, 1270, 6595))

# --- Шевроны разделов ---
chevrons = [e for e in els if e['t'] == 'path' and e['s'] in (DARK,) + BLUE and e['w'] == 14 and e['h'] < 7]
for e in chevrons:
    remove.add(e['i'])

# --- Подвкладки Quarterly / Annual у выручки компании ---
ui = {e['i'] for e in within(195, 1660, 350, 1696)}  # в каркасе остаются (на сайте — HTML)
remove.update(ui)


def snippet(k):
    s = ET.tostring(children[k], encoding='unicode')
    return re.sub(r'\sxmlns(:\w+)?="[^"]+"', '', s)


chev_big = snippet(chevrons[0]['i'])

# --- Дерево кусков ---
slices = []


def piece(y0, y1):
    slices.append([y0, y1])
    return {'s': len(slices) - 1, 'y0': y0, 'y1': y1}


NAV_PAD = 12


def img(y0, y1):
    return {'k': 'img', **piece(y0, y1)}


def sec(head_y, body):
    return {'k': 'sec', 'head': piece(head_y, head_y + 52), 'body': body}


nodes = [
    img(72, tabbars[0] - NAV_PAD),  # шапка сайта (0…62) убрана по просьбе пользователя
    {'k': 'nav', 'h': 52 + NAV_PAD * 2},
    {'k': 'anchor', 'n': 0},
    img(tabbars[0] + 52 + NAV_PAD, 562),
    sec(562, [{'k': 'live', 'n': 0}]),
    sec(1590, [img(1642, 2272)]),
    sec(2304, [{'k': 'live', 'n': 1}]),  # малые графики по препаратам (3017…3549) убраны по просьбе пользователя
    {'k': 'anchor', 'n': 1},
    img(3581 + 92, 3745),
    sec(3745, [img(3797, 4537)]),  # до шапки Patents — отступ под пагинацией 40px (было 8)
    sec(4537, [{'k': 'live', 'n': 2}]),
    {'k': 'anchor', 'n': 2},
    img(5430 + 92, H),
]

# --- Интерактивные зоны ---
items = []


def add(kind, x, y, w, h, **kw):
    items.append({'k': kind, 'x': r1(x), 'y': r1(y), 'w': r1(w), 'h': r1(h), **kw})


for e in chevrons:
    add('chev', e['x'] - 5, e['y'] - 8, 24, 22, svg='big')

TABS = ['Financial', 'Commercial', 'Clinical Trials']

# Шапка: ссылки меню сайта, кнопка About
for k in (5, 6, 7, 8, 9):
    e = els[k]
    add('a', e['x'], e['y'] - 4, e['w'], e['h'] + 8, plain=True)
add('btn', 1307, 11, 93, 32)
add('a', 120, 119, 96, 16, plain=True)  # хлебные крошки «Company Reports»
# Download Report
add('menu', 1108.5, 200.5, 207, 43, menu='download', options=['CSV', 'JSON', 'XLSX', 'PPTX'], files=True)
# Избранное и оповещения
STAR = '<path fill="#0D69EB" d="M6 .6l1.62 3.47 3.78.47-2.78 2.6.72 3.75L6 9.05 2.66 10.9l.72-3.76L.6 4.54l3.78-.47z"/>'
BELL = '<path fill="#0D69EB" d="M6 0a1 1 0 0 1 1 1v.3A3.8 3.8 0 0 1 9.8 5v3.2l1.2 1.5V10.5H1v-.8l1.2-1.5V5A3.8 3.8 0 0 1 5 1.3V1a1 1 0 0 1 1-1zm-1.6 11.2h3.2a1.6 1.6 0 0 1-3.2 0z"/>'
for icon, label, shape in ((25, 26, STAR), (27, 28, BELL)):
    e, lab = els[icon], els[label]
    add('fav', e['x'] - 2, 322, lab['x'] + lab['w'] - e['x'] + 4, 24, ix=r1(e['x']), iy=r1(e['y']), iw=r1(e['w']), ih=r1(e['h']),
        icon=shape, base=None)

# «?» у заголовка Financial и значки-ссылки у заголовков вкладок
add('icon', 232, 510, 24, 24, tip={'text': 'Data: SEC filings, company reports and exchange quotes', 'pos': 'top'})
for e in els:
    if e['f'] == '#8A8D93' and e['t'] == 'path' and round(e['w']) == 17 and round(e['h']) in (15, 16):
        add('icon', e['x'] - 5, e['y'] - 4, e['w'] + 10, e['h'] + 8, tip={'text': 'Copy link to section', 'pos': 'top'},
            copied='Link copied')

# Иконки «i» в шапках разделов
INFO = {
    249.6: 'Daily share price, trading volume and company events',
    300.6: 'Total annual and quarterly revenue data for the company based on filings or investor materials',
}
for e in els:
    if e['t'] == 'circle' and e['s'] and abs(e['w'] - 14.7) < 0.2:
        text = INFO.get(e['x'], 'Annual and quarterly revenue data for the indicated brand name drug only (generics or biosimilars '
                                'excluded) based on company filings or investor materials')
        add('info', e['x'] - 3, e['y'] - 3, 21, 21, tip={'text': text, 'pos': 'top', 'wide': True}, color=e['s'])

# Выручка компании: Quarterly / Annual, Projections, точки графика
items.append({'k': 'subtabs', 'y': 1664, 'h': 32, 'x': 196, 'w': 200, 'big': True,
              'items': [{'x': 200, 'label': 'Quarterly'}, {'x': 292, 'label': 'Annual'}]})
add('menu', 950, 1668, 104, 26, menu='plain', options=['Consensus', 'Low estimate', 'High estimate'])
REV_PTS = [('2016 - Q3', '$6,437.8 M'), ('2017 - Q4', '$7,739.0 M'), ('2018 - Q1', '$10,425.0 M'), ('2019 - Q2', '$11,316.0 M')]
for k, (title, val) in zip((939, 940, 941, 942), REV_PTS):
    e = els[k]
    add('pt', e['x'] - 6, e['y'] - 6, 24, 24, tip={'title': title, 'rows': [['#8E8E8E', val]], 'pos': 'top'})

# Малые графики по препаратам: легенды
for k, e in enumerate(els):
    if e['t'] == 'path' and e['f'] in ('#265989', '#0A9E21', '#498ABA', '#C8C9E9', '#863875') and round(e['w']) == 12 and e['y'] > 3000:
        lab = els[k + 1]
        add('leg', e['x'] - 4, e['y'] - 4, lab['x'] + lab['w'] - e['x'] + 8, 20, c=e['f'])

# Фильтры таблиц (синее «All ▾» / «Phases ▾»)
AREAS = ['All', 'Oncology', 'Immunology', 'Neuroscience', 'Virology']
CLASSES = ['All', 'Small molecule', 'Biologic', 'Biosimilar']
for x, y, w, opts in ((338, 3822, 44, AREAS), (506, 3822, 44, CLASSES), (338, 5663, 44, AREAS), (506, 5663, 44, CLASSES),
                      (640, 5663, 44, ['All', 'FDA', 'EMA']), (757, 5663, 44, ['All', 'Recruiting', 'Active', 'Completed']),
                      (821, 5663, 76, ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'])):
    add('menu', x, y, w, 22, menu='plain', options=opts)
add('icon', 698, 3823, 20, 20, tip={'text': 'Include generics', 'pos': 'top'})

# Строки таблиц (зебра + белые строки между полосами)
zebra = sorted((e for e in els if e['f'] == '#F5F5F6' and e['t'] == 'rect' and e['w'] == 1120), key=lambda e: e['y'])
for k, e in enumerate(zebra):
    add('row', e['x'], e['y'] - 4, e['w'], e['h'] + 8)
    nxt = zebra[k + 1] if k + 1 < len(zebra) else None
    if nxt and 0 < nxt['y'] - (e['y'] + e['h']) <= 60:
        add('row', e['x'], e['y'] + e['h'] + 4, e['w'], nxt['y'] - e['y'] - e['h'] - 8)

# Ссылки (синий текст); у показаний — подсказка с историей успеха, как в макете
def success(n):
    p = [(19, 22), (20, 22), (15, 21)]
    p = [(a - n % 4, b) for a, b in p]
    return {'list': [f'Phase {i + 1} → {a}/{b} → {round(a / b * 100)}%' for i, (a, b) in enumerate(p)],
            'pre': [f'{22 - n % 5} of companies', f'{18 - n % 3} of all drugs'], 'title': 'Historical Success Rate',
            'post': [f'Approved: {15 - n % 4}', f'Overall success rate: {67 - n % 9}%'], 'pos': 'top'}


n_ind = 0
for e in els:
    if e['t'] != 'path' or e['f'] not in BLUE or e['i'] in remove or e['w'] < 14 or not 9 < e['h'] < 17.5:
        continue
    if e['y'] < 3880 or e['y'] > 6440 or 4537 < e['y'] < 5700:
        continue
    tip = None
    if e['x'] > 800:
        tip = success(n_ind)
        n_ind += 1
    add('a', e['x'], e['y'] - 2, e['w'], e['h'] + 6, tip=tip)

# Разворот строк таблицы испытаний (шевроны справа)
for e in els:
    if e['t'] == 'path' and e['f'] == DARK and e['w'] == 11 and e['h'] == 6 and e['x'] == 1304.5:
        add('icon', e['x'] - 6, e['y'] - 8, 23, 22, tip={'text': 'Show all indications', 'pos': 'left'})

# Пагинация (стрелки и страницы)
for y in (4461.5, 6451.5):
    for x, w in ((648, 56), (740, 36), (776, 36), (812, 60)):
        add('btn', x, y + 1, w, 33)

# Каждую зону — в кусок, где её верх
def leaf_of(y):
    for n, (a, b) in enumerate(slices):
        if a <= y < b:
            return n
    raise ValueError(y)


kept = []
for it in items:
    try:
        s = leaf_of(it['y'] + (it['h'] / 2 if it['k'] == 'chev' else 0))
    except ValueError:
        continue  # зона попала в вырезанную полосу вкладок или в живой график
    it['s'] = s
    it['y'] = r1(it['y'] - slices[s][0])
    kept.append(it)
items = kept

cb = [chevrons[0]['x'], chevrons[0]['y'], chevrons[0]['w'], chevrons[0]['h']]
data = {'width': 1440, 'slices': slices, 'nodes': nodes, 'items': items, 'tabs': TABS, 'navPad': NAV_PAD,
        'chev': {'big': chev_big, 'small': chev_big, 'bigBox': cb, 'smallBox': cb}}
json.dump(data, open(OUT_JSON, 'w'), ensure_ascii=False, separators=(',', ':'))

for k in sorted(remove, reverse=True):
    svg.remove(children[k])
tree.write(os.path.join(HERE, 'base.svg'))
json.dump(slices, open(os.path.join(HERE, 'slices.json'), 'w'))
json.dump(sorted(remove - ui), open(os.path.join(HERE, 'removed.json'), 'w'))
from collections import Counter
print('removed', len(remove), 'slices', len(slices), 'items', Counter(i['k'] for i in items))
