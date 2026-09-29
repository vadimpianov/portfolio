// Проверка после сборки: в тексте страниц нет висячих предлогов, союзов и частиц.
// После слов из 1–2 букв и служебных из 3 (как в src/i18n/typograph.ts) и перед тире
// должен стоять неразрывный пробел, а не обычный. Нашли обычный — сборка падает.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SHORT = [
  'для',
  'без',
  'над',
  'под',
  'при',
  'про',
  'или',
  'что',
  'как',
  'чем',
  'где',
  'это',
  'the',
  'and',
  'for',
  'but',
  'nor',
  'its',
  'our',
  'via',
];
const word = new RegExp(`(?<![\\p{L}\\d'’-])(\\p{L}{1,2}|${SHORT.join('|')}) (?=\\S)`, 'giu');
const dash = / [—–]/g;

const files = [];
const walk = (dir) =>
  readdirSync(dir).forEach((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) files.push(p);
  });
walk('dist');

const problems = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8')
    .replace(/<(script|style|svg|head)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;|&#160;/g, ' ');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    for (const m of [...t.matchAll(word), ...t.matchAll(dash)]) {
      problems.push(`${file}: …${t.slice(Math.max(0, m.index - 20), m.index + 20)}…`);
    }
  }
}
if (problems.length) {
  console.error(`Висячие предлоги/союзы (${problems.length}) — прогоните текст через typograph():`);
  console.error([...new Set(problems)].slice(0, 30).join('\n'));
  process.exit(1);
}
console.log(`Типографика: висячих предлогов нет (${files.length} страниц).`);
