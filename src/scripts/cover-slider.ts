/**
 * Обложка-слайдер кейса (`CoverSlider.astro`): стрелки и автопрокрутка.
 * Разметка кейса вставляется в модалку готовым HTML, поэтому клики ловим делегированием,
 * а автопрокрутку ведёт один общий таймер по всем слайдерам на странице.
 */

type Pos = 'prev' | 'current' | 'next' | 'hidden';

const moved = new WeakMap<HTMLElement, number>();

function interval() {
  return (
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--case-slide-interval')) * 1000 ||
    4000
  );
}

/** Сдвинуть слайдер на шаг: 1 — вперёд, -1 — назад. */
function step(slider: HTMLElement, dir: 1 | -1) {
  const slides = [...slider.querySelectorAll<HTMLElement>('.case-slider__slide')];
  const n = slides.length;
  const current = slides.findIndex((s) => s.dataset.pos === 'current');
  const next = (current + dir + n) % n;
  slides.forEach((slide, i) => {
    const d = (i - next + n) % n;
    const pos: Pos = d === 0 ? 'current' : d === 1 ? 'next' : d === n - 1 ? 'prev' : 'hidden';
    const from = slide.dataset.pos;
    // С одного края на другой — позади всех (иначе на полпути перекрывает соседа).
    if ((from === 'prev' && pos === 'next') || (from === 'next' && pos === 'prev')) {
      slide.dataset.wrap = '';
      const done = (e: TransitionEvent) => {
        // Только конец движения самого экрана (не z-index и не яркость картинки внутри).
        if (e.target !== slide || e.propertyName !== 'transform') return;
        slide.removeEventListener('transitionend', done);
        delete slide.dataset.wrap;
      };
      slide.addEventListener('transitionend', done);
    }
    slide.dataset.pos = pos;
  });
  moved.set(slider, performance.now());
}

let started = false;

export function initCoverSliders() {
  if (started) return;
  started = true;

  document.addEventListener('click', (event) => {
    // Клик по экрану: сосед слева — назад, остальные (текущий и сосед справа) — вперёд.
    const slide = (event.target as Element | null)?.closest<HTMLElement>('.case-slider__slide');
    const slider = slide?.closest<HTMLElement>('[data-slider]');
    if (!slide || !slider) return;
    step(slider, slide.dataset.pos === 'prev' ? -1 : 1);
  });

  // Автопрокрутка: не под курсором, не при фокусе внутри, только на видимой вкладке; без движения — не листаем.
  window.setInterval(() => {
    if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const now = performance.now();
    document.querySelectorAll<HTMLElement>('[data-slider]').forEach((slider) => {
      // Фокус — только с клавиатуры (:focus-visible): после клика мышью по стрелке прокрутка идёт дальше.
      if (
        !slider.getClientRects().length ||
        slider.matches(':hover') ||
        slider.querySelector(':focus-visible')
      ) {
        moved.set(slider, now);
        return;
      }
      const last = moved.get(slider);
      if (last === undefined) moved.set(slider, now);
      else if (now - last >= interval()) step(slider, 1);
    });
  }, 250);
}
