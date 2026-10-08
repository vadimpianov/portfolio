// Проверка вёрстки в браузере — то, что пользователь чаще всего ловил глазами (харнес портфолио → SKILL.md → «Проверка»).
// Запуск: pnpm build && pnpm preview (порт 4321), затем pnpm check:layout. Падает (код 1), если есть ошибки.
// Страницы: главная и каждый кейс (прямой заход — кейс в открытой модалке), RU и EN, ширины 1728 / 1440 / 1024 / 390.
//
// Ошибки:
//  - горизонтальная прокрутка страницы или панели кейса (что-то вылезло за край);
//  - правая колонка двухколоночного текста (Flow, описание прожарки) начинается с 1–2 слов — хвоста абзаца или пункта;
//  - точка или «;» в конце заголовка, пункта списка, подписи, плашки;
//  - подпись столбика воронки (Metrics) длиннее 2 строк;
//  - дробный кегль или нечётный / дробный межстрочный интервал.
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Playwright — из проекта, а если его там нет — глобальный (в облачном окружении он установлен глобально).
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  const root = execSync('npm root -g').toString().trim();
  ({ chromium } = await import(pathToFileURL(`${root}/playwright/index.mjs`).href));
}

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const WIDTHS = [1728, 1440, 1024, 390];
const slugs = readdirSync('src/content/ru/cases').map((f) => f.replace(/\.mdx?$/, ''));
const pages = ['ru', 'en'].flatMap((l) => [`/${l}/`, ...slugs.map((s) => `/${l}/cases/${s}/`)]);

// Сокращения, после которых точка в конце законна.
// …и инициалы («Иван К.»).
const ABBR =
  /(?:(?:^|[\s ])[A-ZА-ЯЁ]|пасс|мин|мес|руб|тыс|млн|млрд|т\. ?д|т\. ?п|п\. ?п|ч|etc|pax|min|mo|vs)\.$/i;

const audit = (abbrSrc) => {
  const abbr = new RegExp(abbrSrc, 'i');
  const out = [];
  const drawer = document.querySelector('.case-drawer[open]');
  const scope = drawer ?? document;
  const visible = (el) => {
    if (!el.getClientRects().length) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.opacity !== '0';
  };
  const name = (el) => {
    const cls =
      typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/)[0]
        : '';
    const txt = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 50);
    return `${el.tagName.toLowerCase()}${cls} «${txt}»`;
  };

  // 1. Горизонтальная прокрутка.
  if (document.documentElement.scrollWidth > window.innerWidth + 1)
    out.push(`страница шире экрана: ${document.documentElement.scrollWidth} > ${window.innerWidth}`);
  const panel = document.querySelector('.case-drawer[open] .case-drawer__scroll');
  if (panel && panel.scrollWidth > panel.clientWidth + 1)
    out.push(`панель кейса листается вбок: ${panel.scrollWidth} > ${panel.clientWidth}`);

  // 2. Начало правой колонки.
  const multi = [...scope.querySelectorAll('*')].filter(
    (el) => visible(el) && getComputedStyle(el).columnCount === '2' && !el.closest('svg'),
  );
  for (const box of multi) {
    const mid = box.getBoundingClientRect().left + box.clientWidth / 2;
    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    const words = [];
    let n;
    while ((n = walker.nextNode())) {
      const re = /\S+/g;
      let m;
      while ((m = re.exec(n.data))) {
        const r = document.createRange();
        r.setStart(n, m.index);
        r.setEnd(n, m.index + m[0].length);
        const rect = [...r.getClientRects()].find((x) => x.width > 0);
        if (rect) words.push({ node: n, index: m.index, rect, text: m[0] });
      }
    }
    const first = words.findIndex((w) => w.rect.left > mid);
    if (first <= 0) continue;
    const w = words[first];
    // Начинается ли с этого слова новый абзац или пункт?
    const block = w.node.parentElement.closest('p, li, h1, h2, h3, div');
    const range = document.createRange();
    range.setStart(block, 0);
    range.setEnd(w.node, w.index);
    if (!range.toString().trim()) continue;
    const line = words.slice(first).filter((x) => Math.abs(x.rect.top - w.rect.top) < 2 && x.rect.left > mid);
    const lastOfBlock = words.slice(first).findIndex((x) => !block.contains(x.node));
    const tail = lastOfBlock === -1 ? words.length - first : lastOfBlock;
    if (tail <= 2 && line.length <= 2)
      out.push(`правая колонка начинается с хвоста «${line.map((x) => x.text).join(' ')}» — ${name(box)}`);
  }

  // 3. Точка или «;» в конце коротких элементов.
  const short = scope.querySelectorAll(
    'h1, h2, h3, h4, li, figcaption, button, .case__chip, .case-metrics__label, [class*="label"], [class*="chip"], [class*="tag"], [class*="title"]',
  );
  for (const el of short) {
    if (!visible(el) || el.closest('svg') || el.querySelector('p, li, h2, h3')) continue;
    const t = (el.textContent ?? '').trim();
    if (!t || t.length > 400) continue;
    if (/[.;]$/.test(t) && !/\.\.\.$|…$/.test(t) && !abbr.test(t)) out.push(`точка/«;» в конце: ${name(el)}`);
  }

  // 4. Подписи воронки — не длиннее 2 строк.
  for (const el of scope.querySelectorAll('.case-metrics__label')) {
    if (!visible(el)) continue;
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    const lines = Math.round(el.getBoundingClientRect().height / lh);
    if (lines > 2) out.push(`подпись воронки в ${lines} строки: ${name(el)}`);
  }

  // 5. Кегли и интервалы.
  const seen = new Set();
  for (const el of scope.querySelectorAll('*')) {
    if (!visible(el) || el.closest('svg')) continue;
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.data.trim())) continue;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const lh = parseFloat(cs.lineHeight);
    let msg = '';
    if (Math.abs(fs - Math.round(fs)) > 0.01) msg = `дробный кегль ${fs}px`;
    else if (!Number.isNaN(lh) && (Math.abs(lh - Math.round(lh)) > 0.01 || Math.round(lh) % 2))
      msg = `интервал ${lh}px (нужен чётный)`;
    if (msg && !seen.has(msg + el.className)) {
      seen.add(msg + el.className);
      out.push(`${msg}: ${name(el)}`);
    }
  }
  // 6. Отступы кратны 2px: padding, gap, вертикальные margin (горизонтальные могут быть auto — центровка).
  const seenGap = new Set();
  for (const el of scope.querySelectorAll('*')) {
    // Макеты чужих интерфейсов внутри кейсов ([data-mockup]: экраны телефона, отчёты, графики продукта)
    // повторяют отступы своего продукта — сетка 2px сайта к ним не применяется.
    if (!visible(el) || el.closest('svg') || el.closest('[data-mockup]')) continue;
    const cs = getComputedStyle(el);
    const props = [
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'marginTop',
      'marginBottom',
      'rowGap',
      'columnGap',
    ];
    for (const prop of props) {
      const v = parseFloat(cs[prop]);
      if (Number.isNaN(v) || v === 0) continue;
      if (Math.abs(v - Math.round(v)) > 0.01 || Math.round(v) % 2) {
        const key = prop + (el.className?.baseVal ?? el.className);
        if (seenGap.has(key)) continue;
        seenGap.add(key);
        out.push(`отступ ${prop} ${v}px (нужен кратный 2px): ${name(el)}`);
      }
    }
  }

  // 7. Ничего не выходит за поля. Намеренный выход в край — только внутри [data-edge]
  // (ленты, карусели, схемы, бегущая строка, фон). Видимая часть считается с учётом обрезки предками.
  const article = drawer?.querySelector('.case');
  let left, right;
  if (article) {
    const r = article.getBoundingClientRect();
    const cs = getComputedStyle(article);
    left = r.left + parseFloat(cs.paddingLeft);
    right = r.right - parseFloat(cs.paddingRight);
  } else {
    const g = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter'));
    left = g;
    right = document.documentElement.clientWidth - g;
  }
  const seenEdge = new Set();
  const leaves = scope.querySelectorAll(
    'img, svg, canvas, video, button, input, h1, h2, h3, p, li, span, a, figcaption, label',
  );
  for (const el of leaves) {
    if (!visible(el) || el.closest('[data-edge]') || el.parentElement?.closest('svg') || el.closest('header'))
      continue;
    if (el.matches('span, a, label') && !(el.textContent ?? '').trim()) continue;
    let r = el.getBoundingClientRect();
    let l = r.left;
    let rr = r.right;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const ox = getComputedStyle(a).overflowX;
      if (ox !== 'visible') {
        const ar = a.getBoundingClientRect();
        l = Math.max(l, ar.left);
        rr = Math.min(rr, ar.right);
      }
    }
    if (rr - l < 1) continue;
    if (l < left - 1 || rr > right + 1) {
      const key = el.tagName + (el.className?.baseVal ?? el.className);
      if (seenEdge.has(key)) continue;
      seenEdge.add(key);
      out.push(
        `за полями (${Math.round(l)}–${Math.round(rr)}, поля ${Math.round(left)}–${Math.round(right)}): ${name(el)}`,
      );
    }
  }
  return out;
};

const browser = await chromium.launch();

// --self-test: подсовываем заведомые ошибки — каждая проверка должна сработать.
if (process.argv.includes('--self-test')) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(BASE + '/ru/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const box = document.createElement('section');
    box.innerHTML = `<h2>Заголовок с точкой.</h2>
      <div style="columns:2;column-gap:20px;width:600px;font:16px/24px sans-serif">
        <p>${'слово '.repeat(10)}<span style="display:block;break-before:column">хвост</span></p><p>Следующий абзац начинается во второй колонке</p></div>
      <p style="font-size:15.5px">дробный кегль</p><p style="font-size:16px;line-height:23px">нечётный интервал</p><p style="padding-top:7px">нечётный отступ</p><p style="margin-left:-60px">текст за полем</p>
      <div style="width:4000px;height:2px"></div>`;
    document.body.append(box);
  });
  const found = await page.evaluate(audit, ABBR.source);
  console.log(found.join('\n'));
  const kinds = [
    'шире экрана',
    'правая колонка',
    'точка',
    'дробный кегль',
    'интервал',
    'отступ',
    'за полями',
  ];
  const missed = kinds.filter((k) => !found.some((f) => f.includes(k)));
  console.log(
    missed.length ? `\nНе сработали: ${missed.join(', ')}` : '\nСамопроверка: все проверки срабатывают',
  );
  await browser.close();
  process.exit(missed.length ? 1 : 0);
}

let total = 0;
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  for (const path of pages) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const problems = await page.evaluate(audit, ABBR.source);
    for (const p of problems) console.log(`${width} ${path}  ${p}`);
    total += problems.length;
  }
  await page.close();
}
await browser.close();
console.log(total ? `\nНайдено: ${total}` : 'Вёрстка: замечаний нет');
process.exit(total ? 1 : 0);
