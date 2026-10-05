// Рендер кусков SVG (по умолчанию base.svg; slices.json: [y0, y1] в px макета) в 2x → <папка>/s{N}.png
// node render.mjs [svg] [папка]
import { chromium } from 'playwright';
import fs from 'fs';
const dir = new URL('.', import.meta.url).pathname;
const slices = JSON.parse(fs.readFileSync(dir + 'slices.json'));
const [src = 'base.svg', out = 'png'] = process.argv.slice(2);
fs.rmSync(dir + out, { recursive: true, force: true });
fs.mkdirSync(dir + out);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
await p.goto('file://' + dir + src);
await p.waitForTimeout(2000);
for (const [n, [y0, y1]] of slices.entries()) {
  await p.evaluate(([y0, y1]) => {
    const s = document.querySelector('svg');
    s.setAttribute('viewBox', `0 ${y0} 1440 ${y1 - y0}`);
    s.setAttribute('height', y1 - y0);
  }, [y0, y1]);
  await (await p.$('svg')).screenshot({ path: `${dir}${out}/s${String(n).padStart(2, '0')}.png`, timeout: 120000 });
}
await b.close();
