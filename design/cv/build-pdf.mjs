// Сборка PDF резюме из HTML: `node design/cv/build-pdf.mjs cv-ru [cv-en …]` → `design/cv/<имя>.pdf`.
// Затем жёлтая подложка на весь лист: `python3 design/cv/fill-bg.py design/cv/<имя>.pdf`.
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  const root = execSync('npm root -g').toString().trim();
  ({ chromium } = await import(pathToFileURL(`${root}/playwright/index.mjs`).href));
}

const dir = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
for (const name of process.argv.slice(2)) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve(dir, `${name}.html`)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Лист не должен переполняться: текст обязан поместиться на одну страницу A4.
  const over = await page.evaluate(() => {
    const el = document.querySelector('.exp');
    return el.scrollHeight - el.clientHeight;
  });
  if (over > 0) console.warn(`${name}: блок опыта не помещается на ${over}px`);
  await page.pdf({ path: resolve(dir, `${name}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`${name}.pdf`);
}
await browser.close();
