// ВРЕМЕННО: картинки кейса вырезаны из обзорного скриншота артборда Figma (1792:116644, ~0,45x) — лимит Figma MCP.
// Фон макета (тёмный #0f1f2a и фиолетовый #170925 за краем артборда) делается прозрачным.
// Заменить на SVG/PDF пользователя. Запуск: node overview-crops.mjs <overview.png> <sharp path>
const [, , overview, sharpPath] = process.argv;
const sharp = (await import(sharpPath)).default;
const K = 1640 / 3634; // масштаб обзорного скриншота
const EDGE = 1600; // правый край артборда: дальше фон фиолетовый
const TEAL = [0x0f, 0x1f, 0x2a];
const PURPLE = [0x17, 0x09, 0x25];
const OUT = 'public/images/cases/metr-kvadratny/';
// имя, x, y, ширина, высота (координаты артборда, 1x)
// erase — что стереть (координаты кропа, 1x): ['rect', x, y, w, h] — текст макета поверх карты,
// ['circle', cx, cy, r] — круглые стрелки навигации Figma поверх лент.
const crops = [
  ['mortgage', 140, 6573, 3141, 620, [['circle', 1294, 308, 30]]],
];
for (const [name, x, y, w, h, erase = []] of crops) {
  const r = { left: Math.round(x * K), top: Math.round(y * K), width: Math.round(w * K), height: Math.round(h * K) };
  const { data, info } = await sharp(overview).extract(r).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const edge = Math.round(EDGE * K) - r.left;
  for (let py = 0; py < info.height; py++)
    for (let px = 0; px < info.width; px++) {
      const i = (py * info.width + px) * 4;
      const bg = px >= edge ? PURPLE : TEAL;
      // за краем артборда — сдвиг цвета к тёмному фону кейса (карточки там полупрозрачные)
      // только тёмные пиксели: светлые экраны и иллюстрации не трогаем (иначе зеленели)
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const k = Math.max(0, 1 - lum / 90);
      if (px >= edge) for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, Math.round(data[i + c] + k * (TEAL[c] - PURPLE[c]))));
      const d = Math.hypot(...[0, 1, 2].map((c) => data[i + c] - TEAL[c]));
      data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, (d - 6) / 14)));
      void bg;
      const X = px / K, Y = py / K; // координаты 1x
      for (const e of erase) {
        if (e[0] === 'rect' && X >= e[1] && X < e[1] + e[3] && Y >= e[2] && Y < e[2] + e[4]) data[i + 3] = 0;
        if (e[0] === 'circle' && Math.hypot(X - e[1], Y - e[2]) < e[3]) data[i + 3] = 0;
      }
    }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(w, h, { kernel: 'lanczos3' })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`${OUT}${name}.webp`);
  console.log(name, w, h);
}
