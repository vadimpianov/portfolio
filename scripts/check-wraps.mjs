// Поиск ранних переносов: слово ушло на новую строку, хотя помещалось в предыдущую.
// Запуск: pnpm build && pnpm preview, затем node scripts/check-wraps.mjs (нужен пакет playwright; в облачном окружении он есть глобально — можно запустить копию из рабочей папки).
// Учитывает обтекание картинки (float); неразрывные цепочки (предлог + слово) считаются одним звеном.
import { chromium } from 'playwright';
// Ищет ранние переносы: первое неразрывное звено следующей строки поместилось бы в конец предыдущей.
const audit = () => {
  const out = [];
  const blocks = [
    ...document.querySelectorAll(
      'h1,h2,h3,p,li,figcaption,.hero__chip,.case__chip,.tiles__lead,.tiles__title,.about__text p',
    ),
  ].filter((el) => el.offsetParent !== null && !el.closest('svg') && !el.querySelector('p,div,li'));
  const floats = [...document.querySelectorAll('*')].filter(
    (f) => f.offsetParent !== null && getComputedStyle(f).float !== 'none',
  );
  for (const el of blocks) {
    const cs = getComputedStyle(el);
    const contentRight = el.getBoundingClientRect().right - parseFloat(cs.paddingRight);
    // собрать «звенья» (разделены обычным пробелом) с их прямоугольниками
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const chunks = [];
    let n;
    while ((n = walker.nextNode())) {
      const re = /[^ \n\t]+/g;
      let m;
      while ((m = re.exec(n.data))) {
        const r = document.createRange();
        r.setStart(n, m.index);
        r.setEnd(n, m.index + m[0].length);
        const rects = [...r.getClientRects()].filter((x) => x.width > 0);
        if (rects.length) chunks.push({ text: m[0], first: rects[0], last: rects[rects.length - 1], rects });
      }
    }
    const space = parseFloat(cs.fontSize) * 0.28;
    for (let i = 1; i < chunks.length; i++) {
      const a = chunks[i - 1],
        b = chunks[i];
      if (b.first.top > a.last.top + 2 && b.rects.length === 1) {
        // на какой правой границе реально заканчивается строка a — у обтекаемой картинки строка короче;
        // берём правую границу самой длинной строки блока на той же высоте не можем — используем ширину блока,
        // но пропускаем строки рядом с float (их правая граница < блока).
        let lineRight = contentRight;
        for (const f of floats) {
          const fr = f.getBoundingClientRect();
          if (a.last.bottom > fr.top && a.last.top < fr.bottom + parseFloat(getComputedStyle(f).marginBottom))
            lineRight = Math.min(lineRight, fr.left - parseFloat(getComputedStyle(f).marginLeft));
        }
        const need = b.first.width + space;
        const avail = lineRight - a.last.right;
        if (avail > need + 6)
          out.push(
            `${el.tagName}.${el.className || ''}: «…${a.text}» | «${b.text}…» свободно ${Math.round(avail)}px, нужно ${Math.round(need)}px`,
          );
      }
    }
  }
  return out;
};
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
for (const [w, h] of [
  [1728, 1117],
  [1440, 900],
  [1024, 768],
  [390, 844],
]) {
  for (const url of ['/ru/', '/en/', '/ru/cases/betting/', '/en/cases/betting/']) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('http://localhost:4321' + url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    const r = await p.evaluate(audit);
    if (r.length) console.log(`\n== ${w} ${url}\n` + r.slice(0, 15).join('\n'));
    await p.close();
  }
}
await b.close();
