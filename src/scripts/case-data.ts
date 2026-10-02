/**
 * Интерактивные блоки кейсов с данными (Quantori): проявление при прокрутке и счётчики.
 * Разметка кейса вставляется в модалку готовым HTML, поэтому наблюдение за блоками запускает
 * CaseDrawer после вставки (`watchCaseData`).
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
