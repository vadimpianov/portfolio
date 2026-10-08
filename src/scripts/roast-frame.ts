/**
 * Общая часть кейсов «Прожарки» (харнес → roast.md): слайдер экранов со стрелками, переход от карточки проблемы
 * к её экрану, точки-подсказки «Проблема / Решение» на экранах телефона. Логику самих экранов пишет скрипт кейса.
 *
 * Разметка (см. `Skyway.astro`): в корне кейса — `[data-k=bar]` (обёртка ленты), `[data-k=track]` (лента экранов,
 * дети — `.sky-shot` с `.sky-phone` внутри), стрелки `[data-k=prev]` / `[data-k=next]`, карточки `[data-go=N]`.
 * Листаемые области внутри экрана помечаются `data-scroll` — точки в них видны только в видимой части.
 */
export type RoastPair = { no: string; problem: string; solution: string };

export type RoastFrame = {
  /** Подпись «Проблема · », «Решение · » — из copy кейса. */
  problem: string;
  solution: string;
  /** Пары проблема/решение по экранам. */
  screens: { pairs: RoastPair[] }[];
  /** Для каждого экрана — селекторы элементов, к которым ставим точки (по порядку пар). */
  hotspots: string[][];
};

// Текст подсказки: с заглавной буквы, без точки в конце.
const clean = (t: string) => {
  const x = t.trim().replace(/\.$/, '');
  const i = x.search(/\p{L}/u);
  return i < 0 ? x : x.slice(0, i) + x[i]!.toUpperCase() + x.slice(i + 1);
};

/** Подключает слайдер, карточки и точки. Возвращает `schedule` — пересчитать точки после перерисовки экрана. */
export function initRoastFrame(el: HTMLElement, f: RoastFrame) {
  const $ = <T extends HTMLElement = HTMLElement>(k: string) => el.querySelector<T>(`[data-k="${k}"]`)!;

  /* ---------- слайдер ---------- */
  const track = $('track');
  const shots = [...track.children] as HTMLElement[];
  const step = () => shots[1]!.offsetLeft - shots[0]!.offsetLeft;
  function updateSlider() {
    $<HTMLButtonElement>('prev').disabled = track.scrollLeft <= 2;
    $<HTMLButtonElement>('next').disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }
  $('prev').onclick = () => track.scrollBy({ left: -step() });
  $('next').onclick = () => track.scrollBy({ left: step() });
  track.addEventListener('scroll', () => requestAnimationFrame(updateSlider));
  new ResizeObserver(updateSlider).observe(track);

  // Карточка проблемы — к её экрану: панель к слайдеру, слайдер к экрану.
  el.querySelectorAll<HTMLElement>('[data-go]').forEach(
    (card) =>
      (card.onclick = () => {
        $('bar').scrollIntoView({ behavior: 'smooth', block: 'start' });
        const shot = shots[Number(card.dataset.go)];
        if (shot) track.scrollTo({ left: shot.offsetLeft - shots[0]!.offsetLeft });
      }),
  );

  /* ---------- точки на экранах: проблема и решение по наведению ---------- */
  const solutionLabel = f.solution.replace(/[\s·]+$/u, '');
  // Одна подсказка на весь кейс — в корне кейса, а не в ленте экранов (лента обрезает всё, что за её краем).
  const tip = document.createElement('div');
  tip.className = 'hs-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  el.append(tip);
  const dots: { shot: HTMLElement; phone: HTMLElement; sel: string; dot: HTMLElement }[] = [];
  shots.forEach((shot, i) => {
    const phone = shot.querySelector<HTMLElement>('.sky-phone')!;
    const layer = document.createElement('div');
    layer.className = 'hs';
    shot.append(layer);
    f.hotspots[i]!.forEach((sel, j) => {
      const pair = f.screens[i]!.pairs[j]!;
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'hs-dot';
      dot.setAttribute('aria-label', `${f.problem}${pair.no}`);
      const html = `<span class="hs-pb">${f.problem}${pair.no}</span><span class="hs-text">${clean(pair.problem)}</span><span class="hs-sl">${solutionLabel}</span><span class="hs-text">${clean(pair.solution)}</span>`;
      // Левый верхний угол подсказки — у правого верхнего угла точки. У последнего экрана (справа места нет) —
      // над точкой: правый нижний угол подсказки — у правого верхнего угла точки.
      const above = i === shots.length - 1;
      const show = () => {
        tip.innerHTML = html;
        tip.hidden = false;
        const d = dot.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        tip.style.left = `${Math.round(d.right - box.left - (above ? tip.offsetWidth : 0))}px`;
        tip.style.top = `${Math.round(d.top - box.top - (above ? tip.offsetHeight : 0))}px`;
      };
      const hide = () => (tip.hidden = true);
      dot.addEventListener('pointerenter', show);
      dot.addEventListener('pointerleave', hide);
      dot.addEventListener('focus', show);
      dot.addEventListener('blur', hide);
      layer.append(dot);
      dots.push({ shot, phone, sel, dot });
    });
  });
  track.addEventListener('scroll', () => (tip.hidden = true), { passive: true });

  // Точка — у правого верхнего угла своего элемента; если элемент сейчас не виден на экране телефона
  // (или в листаемой области `data-scroll`) — скрыта.
  function placeDots() {
    for (const { shot, phone, sel, dot } of dots) {
      const target = phone.querySelector<HTMLElement>(sel);
      const s = shot.getBoundingClientRect();
      const p = phone.getBoundingClientRect();
      const r = target?.getBoundingClientRect();
      const x = r ? r.right - 4 : 0;
      const y = r ? r.top + 4 : 0;
      const clip = target?.closest<HTMLElement>('[data-scroll]')?.getBoundingClientRect();
      const inside =
        !!r &&
        r.width > 0 &&
        x > p.left + 12 &&
        x < p.right - 12 &&
        y > p.top + 12 &&
        y < p.bottom - 12 &&
        (!clip || (y > clip.top + 4 && y < clip.bottom - 4));
      dot.hidden = !inside;
      if (!inside) continue;
      dot.style.left = `${Math.round(x - s.left)}px`;
      dot.style.top = `${Math.round(y - s.top)}px`;
    }
  }
  let placing = 0;
  const schedule = () => {
    cancelAnimationFrame(placing);
    placing = requestAnimationFrame(placeDots);
  };
  new MutationObserver(schedule).observe(track, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden'],
  });
  new ResizeObserver(schedule).observe(track);
  track.querySelectorAll<HTMLElement>('[data-scroll]').forEach((s) =>
    s.addEventListener(
      'scroll',
      () => {
        tip.hidden = true;
        schedule();
      },
      { passive: true },
    ),
  );
  document.fonts?.ready.then(schedule);
  updateSlider();
  schedule();
  return schedule;
}
