// Каркас живых графиков отчёта о компании: снимок каждого графика (Stock Price, Revenue by Drug, Patents)
// в состоянии по умолчанию, в масштабе страницы 1, 2x → png-live/live{N}.png; затем wireframe.py --live
// переводит снимки в серые плашки → public/images/cases/quantori/company/wf/live{N}.webp.
// Нужен запущенный `pnpm preview` (порт 4321). Запуск: node live-wireframe.mjs && python3 wireframe.py --live
import { chromium } from 'playwright';
import fs from 'fs';
const dir = new URL('.', import.meta.url).pathname;
fs.rmSync(dir + 'png-live', { recursive: true, force: true });
fs.mkdirSync(dir + 'png-live');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 2600, height: 2000 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:4321/ru/cases/quantori/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const frame = (await p.$$('[data-drug-report]'))[1];
await frame.evaluate((f) => {
  f.style.height = '9000px'; // постоянная высота: иначе смена масштаба меняет размер окна и ResizeObserver возвращает свой масштаб
  f.style.overflow = 'visible';
  const page = f.querySelector('.dr__page');
  page.style.zoom = '1';
  page.style.setProperty('--split', '0px'); // каркас скрыт — снимаем сами графики
});
await p.waitForTimeout(800);
// ResizeObserver отчёта после смены высоты окна снова ставит свой масштаб — возвращаем 1
await frame.evaluate((f) => (f.querySelector('.dr__page').style.zoom = '1'));
await p.waitForTimeout(500);
const lives = await frame.$$('.dr-live');
for (const [n, el] of lives.entries()) {
  await el.scrollIntoViewIfNeeded();
  await p.mouse.move(1, 1);
  await frame.evaluate((f) => (f.querySelector('.dr__page').style.zoom = '1'));
  await p.waitForTimeout(400);
  console.log('live', n);
  // Надписи → полоски (координаты, цвет, кегль), затем снимок без текста — фигуры переводятся в серое
  const texts = await el.evaluate((root) => {
    const r0 = root.getBoundingClientRect();
    const out = [];
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = walk.nextNode(); t; t = walk.nextNode()) {
      if (!t.textContent.trim()) continue;
      const host = t.parentElement;
      if (host.closest('[hidden], .dr-wf')) continue;
      const cs = getComputedStyle(host);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      const range = document.createRange();
      range.selectNodeContents(t);
      for (const b of range.getClientRects()) {
        if (b.width < 2 || b.height < 2) continue;
        const color = host.closest('svg') ? cs.fill : cs.color;
        out.push({ x: b.left - r0.left, y: b.top - r0.top, w: b.width, h: b.height, color, size: parseFloat(cs.fontSize) });
      }
    }
    return out;
  });
  fs.writeFileSync(`${dir}png-live/live${n}.json`, JSON.stringify(texts));
  const style = await p.addStyleTag({ content: '.dr-live *, .dr-live svg text, .dr-live tspan { color: transparent !important; fill-opacity: 1; } .dr-live svg text, .dr-live svg tspan { fill: transparent !important; }' });
  await p.waitForTimeout(200);
  await el.screenshot({ path: `${dir}png-live/live${n}.png` });
  await style.evaluate((s) => s.remove());
}
await b.close();
