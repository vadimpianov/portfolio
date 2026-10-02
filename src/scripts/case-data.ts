/**
 * Интерактивные блоки кейсов с данными (Quantori): проявление при прокрутке, счётчики и сортировка
 * таблиц. Разметка кейса вставляется в модалку готовым HTML, поэтому клики ловим делегированием,
 * а наблюдение за блоками запускает CaseDrawer после вставки (`watchCaseData`).
 *
 * `data-reveal` — блок ждёт появления: `pending` (стили прячут столбики, линии, полоски) → `in`.
 * `data-count` — число досчитывает от `data-count-from` до `data-count` (`data-decimals` знаков).
 */

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const locale = () => (document.documentElement.lang === 'ru' ? 'ru-RU' : 'en-US');
const easeOut = (t: number) => 1 - (1 - t) ** 3;

function countUp(el: HTMLElement) {
  const to = Number(el.dataset.count);
  const from = Number(el.dataset.countFrom ?? 0);
  const decimals = Number(el.dataset.decimals ?? 0);
  const format = new Intl.NumberFormat(locale(), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const duration = 1400;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = format.format(from + (to - from) * easeOut(t));
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = format.format(from);
  requestAnimationFrame(tick);
}

const observer =
  typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const block = entry.target as HTMLElement;
            observer?.unobserve(block);
            block.dataset.reveal = 'in';
            block.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
          }),
        { threshold: 0.3 },
      );

/** Блоки внутри `root` проявятся, когда долистают до них. */
export function watchCaseData(root: ParentNode) {
  if (!observer || reducedMotion()) return;
  observer.disconnect();
  root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((block) => {
    if (block.dataset.reveal === 'in') return;
    block.dataset.reveal = 'pending';
    observer.observe(block);
  });
}

/** Сортировка по колонке; строки плавно переезжают на новые места (FLIP). */
function sort(button: HTMLButtonElement) {
  const table = button.closest('table');
  const th = button.closest('th');
  const tbody = table?.tBodies[0];
  if (!table || !th || !tbody) return;
  const col = Number(button.dataset.sortCol);
  const numeric = button.dataset.sortType === 'num';
  // Повторный клик — в обратную сторону; первый клик по числам — по убыванию, по тексту — по алфавиту.
  const current = th.getAttribute('aria-sort');
  const dir = current ? (current === 'descending' ? 'ascending' : 'descending') : numeric ? 'descending' : 'ascending';
  table.querySelectorAll('th[aria-sort]').forEach((h) => h.removeAttribute('aria-sort'));
  th.setAttribute('aria-sort', dir);

  const rows = [...tbody.rows];
  const before = new Map(rows.map((row) => [row, row.getBoundingClientRect().top]));
  const value = (row: HTMLTableRowElement) => row.cells[col]?.dataset.value ?? '';
  rows.sort((a, b) => {
    const diff = numeric
      ? Number(value(a)) - Number(value(b))
      : value(a).localeCompare(value(b), document.documentElement.lang);
    return dir === 'ascending' ? diff : -diff;
  });
  tbody.append(...rows);
  if (reducedMotion()) return;
  rows.forEach((row) => {
    const shift = Math.round((before.get(row) ?? 0) - row.getBoundingClientRect().top);
    if (!shift) return;
    row.animate([{ transform: `translateY(${shift}px)` }, { transform: 'none' }], {
      duration: 500,
      easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
    });
  });
}

let started = false;

export function initCaseData() {
  if (started) return;
  started = true;
  document.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('button[data-sort-col]');
    if (button) sort(button);
  });
}
