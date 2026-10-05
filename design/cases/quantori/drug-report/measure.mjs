// Координаты всех элементов верхнего уровня drug-report.svg (с учётом transform) → els.json
import { chromium } from 'playwright';
import fs from 'fs';
const dir = new URL('.', import.meta.url).pathname;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto('file://' + dir + 'drug-report.svg');
await p.waitForTimeout(1500);
const r = await p.evaluate(() => [...document.querySelector('svg').children].map((e, i) => {
  const bb = e.getBBox ? e.getBoundingClientRect() : null;
  return { i, t: e.tagName, f: e.getAttribute('fill'), s: e.getAttribute('stroke'),
    x: bb && +bb.x.toFixed(1), y: bb && +bb.y.toFixed(1), w: bb && +bb.width.toFixed(1), h: bb && +bb.height.toFixed(1) };
}));
fs.writeFileSync(dir + 'els.json', JSON.stringify(r));
await b.close();
