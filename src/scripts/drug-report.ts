/**
 * Интерактивный отчёт по препарату (кейс Quantori, `DrugReport.astro`).
 * Разметка кейса вставляется в модалку готовым HTML, поэтому обработчики — общие, на документе
 * (ставятся один раз при загрузке модуля), а `initDrugReports` (из CaseDrawer) только подгоняет масштаб
 * и сбрасывает прокрутку окна.
 */

const PAGE_W = 1440;
const MIN_W = 960;
// Бегунок по умолчанию — в левом поле страницы, до начала контента (поле 120px, линия на 76px — как на макете
// пользователя); на телефоне, где поле прокручено, — посередине видимого остатка поля.
const SPLIT_PAGE_X = 76;
const CONTENT_X = 120;

const zoomOf = (page: HTMLElement) => Number(page.style.zoom) || 1;

function fit(frame: HTMLElement) {
  const page = frame.querySelector<HTMLElement>('.dr__page');
  if (!page) return;
  page.style.zoom = String(Math.max(frame.clientWidth, MIN_W) / PAGE_W);
  setSplit(frame);
}

/* ---------- Бегунок «вайрфрейм ↔ дизайн» ---------- */

/** Положение бегунка (доля ширины окна) → линия и граница каркаса (`--split` в px страницы). */
function setSplit(frame: HTMLElement, pos?: number) {
  const win = frame.parentElement!;
  const page = frame.querySelector<HTMLElement>('.dr__page');
  const split = win.querySelector<HTMLElement>('[data-dr-split]');
  if (!page || !split) return;
  const wr = win.getBoundingClientRect();
  const pr = page.getBoundingClientRect();
  const z = zoomOf(page);
  let p: number;
  if (pos != null) {
    p = Math.min(1, Math.max(0, pos));
    win.dataset.split = String(p); // запоминаем только положение, выбранное пользователем
  } else if (win.dataset.split) {
    p = Number(win.dataset.split);
  } else {
    const left = (wr.left - pr.left) / z; // видимый левый край страницы
    const x = left < SPLIT_PAGE_X ? SPLIT_PAGE_X : (left + CONTENT_X) / 2;
    p = Math.min(1, Math.max(0, ((x - left) * z) / wr.width));
  }
  split.style.setProperty('--pos', `${p * 100}%`);
  split.querySelector('[data-dr-knob]')?.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  page.style.setProperty('--split', `${Math.round((wr.left + p * wr.width - pr.left) / z)}px`);
}

const resize =
  typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver((entries) => entries.forEach((e) => fit(e.target as HTMLElement)));

export function initDrugReports(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-drug-report]').forEach((frame) => {
    fit(frame);
    frame.scrollTop = 0;
    // Окно уже страницы (телефон) — тоже с левого края: в поле стоит бегунок «вайрфрейм ↔ дизайн».
    frame.scrollLeft = 0;
    setSplit(frame);
    resize?.observe(frame);
    frame.addEventListener('scroll', () => {
      frame.parentElement?.querySelector('.dr__top')?.classList.toggle('is-shown', frame.scrollTop > 400);
      hideTip();
      syncNav(frame);
      setSplit(frame);
    });
    syncNav(frame);
  });
}

/* ---------- Вкладки: одна липкая полоса, активна вкладка раздела под ней ---------- */

function syncNav(frame: HTMLElement) {
  const nav = frame.querySelector<HTMLElement>('[data-dr-nav]');
  if (!nav) return;
  const top = frame.getBoundingClientRect().top;
  const navBox = nav.getBoundingClientRect();
  nav.classList.toggle('is-stuck', navBox.top - top < 1 && frame.scrollTop > 0);
  let active = 0;
  frame.querySelectorAll<HTMLElement>('[data-dr-anchor]').forEach((a) => {
    if (a.getBoundingClientRect().top - top <= navBox.height + 24) active = Number(a.dataset.drAnchor);
  });
  nav.querySelectorAll<HTMLElement>('[data-dr-goto]').forEach((b, n) => {
    b.classList.toggle('is-active', n === active);
    b.setAttribute('aria-selected', String(n === active));
  });
}

/* ---------- События таймлайна ---------- */

type EventKind = { name: string; label: string; items: [string, string][] };
const EVENTS: Record<string, EventKind> = {
  '#DD4F4F': { name: 'FDA approval date', label: 'Products', items: [
    ['2017-04-28', 'TYMLOS (ABALOPARATIDE) INJECTION, RADIUS HEALTH INC'],
    ['2010-11-02', 'OFIRMEV (ACETAMINOPHEN) INJECTION, MALLINCKRODT HOSP'],
    ['1982-01-01', 'TYLENOL / ACETAMINOPHEN TABLETS, MCNEIL CONSUMER'],
  ] },
  '#5284CF': { name: 'EMA approval date', label: 'Products', items: [
    ['2022-12-12', 'ELADYNOS (ABALOPARATIDE), THERADEX B.V.'],
    ['2016-05-26', 'PARACETAMOL B. BRAUN 10 MG/ML, B. BRAUN MELSUNGEN'],
  ] },
  '#72B123': { name: 'FDA advisory meeting dates', label: 'Committee', items: [
    ['2016-12-20', 'Endocrinologic and Metabolic Drugs Advisory Committee'],
    ['2009-06-29', 'Drug Safety and Risk Management Advisory Committee'],
  ] },
  '#DC915B': { name: 'Patent expiration date', label: 'Products', items: [
    ['2016-05-26', 'ABACAVIR SULFATE / DOLUTEGRAVIR SODIUM / LAMIVUDINE, TRIUMEQ PD, VIIV HLTHCARE'],
    ['2016-05-26', 'ABACAVIR SULFATE / DOLUTEGRAVIR SODIUM / LAMIVUDINE, TRIUMEQ PD, VIIV HLTHCARE'],
    ['2016-05-26', 'ABACAVIR SULFATE / DOLUTEGRAVIR SODIUM / LAMIVUDINE, TRIUMEQ PD, VIIV HLTHCARE'],
  ] },
  '#5FBC50': { name: 'Study first post date', label: 'Trial', items: [
    ['2023-02-07', 'NCT05718505 — IV vs oral acetaminophen after hip arthroplasty'],
    ['2023-02-07', 'NCT05719012 — Abaloparatide in men with osteoporosis'],
  ] },
  '#3867A0': { name: 'Last update post date', label: 'Trial', items: [
    ['2023-02-08', 'NCT04123587 — Acetaminophen for fever in ICU patients'],
    ['2023-02-09', 'NCT03912688 — Abaloparatide transdermal system, phase 3'],
  ] },
  '#9D56BF': { name: 'Start date', label: 'Trial', items: [['2023-02-07', 'NCT05697367 — Paracetamol and opioid consumption after cesarean']] },
  '#C41D63': { name: 'Primary completion date', label: 'Trial', items: [
    ['2023-02-07', 'NCT04402411 — Acetaminophen dosing in children 2–12 years'],
    ['2023-02-08', 'NCT03512925 — Abaloparatide vs teriparatide, bone density'],
  ] },
  '#8D6A79': { name: 'Results first post date', label: 'Trial', items: [['2023-02-07', 'NCT02984969 — Abaloparatide-SC in postmenopausal women']] },
  '#6B5454': { name: 'Generic approved', label: 'Generic', items: [
    ['2023-02-07', 'ACETAMINOPHEN INJECTION 1 G/100 ML, FRESENIUS KABI'],
    ['2023-02-08', 'ACETAMINOPHEN INJECTION 1 G/100 ML, SANDOZ INC'],
  ] },
};

function openEvents(page: HTMLElement, color: string) {
  const panel = page.querySelector<HTMLElement>('[data-dr-evp]');
  const kind = EVENTS[color];
  if (!panel || !kind) return;
  panel.style.setProperty('--c', color);
  panel.querySelector('b')!.textContent = kind.name;
  panel.querySelector('.dr-evp__list')!.innerHTML = kind.items
    .map(
      ([date, text]) =>
        `<div class="dr-evp__item"><div class="dr-evp__date">${date}<a href="#" aria-label="Open source" data-dr-noop>${EXT}</a></div><strong>${kind.label}:</strong> ${esc(text)}</div>`,
    )
    .join('');
  panel.hidden = false;
  panel.querySelector<HTMLElement>('.dr-evp__list')!.scrollTop = 0;
}

/** Показать или скрыть тип событий: легенда, квадраты на таймлайне, галочка в меню Events. */
function setEventKind(page: HTMLElement, color: string, on: boolean) {
  page.querySelectorAll<HTMLElement>(`[data-dr-leg="${color}"]`).forEach((l) => l.setAttribute('aria-pressed', String(on)));
  page.querySelectorAll<HTMLElement>(`[data-dr-ev="${color}"]`).forEach((e) => e.classList.toggle('is-off', !on));
  page.querySelectorAll<HTMLInputElement>(`[data-dr-ev-check="${color}"]`).forEach((c) => (c.checked = on));
  const panel = page.querySelector<HTMLElement>('[data-dr-evp]');
  if (!on && panel && panel.style.getPropertyValue('--c') === color) panel.hidden = true;
}

/* ---------- Тултип ---------- */

type Tip = {
  text?: string;
  ext?: boolean;
  list?: string[];
  title?: string;
  rows?: [string, string][];
  note?: string;
  value?: number;
  unit?: string;
  pos?: 'top' | 'bottom' | 'left';
  wide?: boolean;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const EXT =
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8.5 1.5h4v4M12.5 1.5 6.5 7.5M10.5 8.5v4h-9v-9h4"/></svg>';
const nf = (v: number, d: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const UNITS: Record<string, (v: number) => string> = {
  usd_m: (v) => `$${nf(v, 1)} M`,
  people: (v) => `${nf(Math.round(v), 0)} people`,
  purchases: (v) => `${nf(Math.round(v), 0)} purchases`,
  refill: (v) => `${nf(v, 2)} refills`,
  usd: (v) => `$${nf(Math.round(v), 0)}`,
};

function tipHtml(t: Tip) {
  if (t.list) return `<ul>${t.list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
  if (t.unit && t.value != null)
    return `<b>${esc(t.title ?? '')}</b><div class="dr-tip__row"><i class="dr-tip__dot"></i>${UNITS[t.unit](t.value)}</div>`;
  if (t.rows)
    return (
      `<b>${esc(t.title ?? '')}</b>` +
      t.rows
        .map(([c, l]) => `<div class="dr-tip__row"><i class="dr-tip__sq" style="background:${c}"></i>${esc(l)}</div>`)
        .join('') +
      (t.note ? `<div class="dr-tip__note">${esc(t.note)}</div>` : '')
    );
  return esc(t.text ?? '') + (t.ext ? EXT : '');
}

let tipAnchor: HTMLElement | null = null;
let tipTimer = 0;

function hideTip() {
  tipAnchor = null;
  document.querySelectorAll<HTMLElement>('.dr__tip').forEach((t) => (t.hidden = true));
}

function showTip(anchor: HTMLElement, t: Tip) {
  const page = anchor.closest<HTMLElement>('.dr__page');
  const tip = page?.querySelector<HTMLElement>('.dr__tip');
  if (!page || !tip) return;
  tipAnchor = anchor;
  const z = zoomOf(page);
  const pr = page.getBoundingClientRect();
  const ar = anchor.getBoundingClientRect();
  // В координатах страницы (до масштаба)
  const a = {
    l: (ar.left - pr.left) / z,
    t: (ar.top - pr.top) / z,
    w: ar.width / z,
    h: ar.height / z,
  };
  const pos = t.pos ?? 'top';
  tip.innerHTML = tipHtml(t);
  tip.dataset.pos = pos;
  tip.style.maxWidth = t.wide ? '384px' : '';
  tip.hidden = false;
  const w = tip.offsetWidth;
  const h = tip.offsetHeight;
  const cx = a.l + a.w / 2;
  if (pos === 'left') {
    tip.style.left = `${a.l - w - 8}px`;
    tip.style.top = `${a.t + a.h / 2 - h / 2}px`;
    tip.style.removeProperty('--ax');
    return;
  }
  const left = Math.min(Math.max(cx - w / 2, 8), PAGE_W - w - 8);
  tip.style.left = `${left}px`;
  tip.style.top = pos === 'top' ? `${a.t - h - 8}px` : `${a.t + a.h + 8}px`;
  tip.style.setProperty('--ax', `${cx - left}px`);
}

/* ---------- Обработчики ---------- */

if (typeof document !== 'undefined') {
  document.addEventListener('pointerover', (e) => {
    const el = (e.target as Element).closest?.<HTMLElement>('.dr__page [data-tip]');
    if (el === tipAnchor) return;
    if (!el) {
      if (tipAnchor) hideTip();
      return;
    }
    if (el.dataset.dragTip) return;
    showTip(el, JSON.parse(el.dataset.tip!));
  });

  document.addEventListener('focusin', (e) => {
    const el = (e.target as Element).closest?.<HTMLElement>('.dr__page [data-tip]');
    if (el) showTip(el, JSON.parse(el.dataset.tip!));
  });

  document.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (!target.closest?.('.dr')) {
      closeMenus();
      return;
    }

    const page = target.closest<HTMLElement>('.dr__page');

    // Внутри меню Events: галочки и «Select All» — меню не закрывается
    if (target.closest('.dr-ev-menu')) {
      const all = target.closest('[data-dr-ev-all]');
      if (all && page) Object.keys(EVENTS).forEach((c) => setEventKind(page, c, true));
      return;
    }

    if (target.closest('[data-dr-noop]')) {
      e.preventDefault();
      return;
    }

    // Меню
    const menuBtn = target.closest<HTMLButtonElement>('[data-dr-menu]');
    const menuItem = target.closest<HTMLButtonElement>('.dr-menu__list button');
    if (menuBtn) {
      const list = menuBtn.nextElementSibling as HTMLElement;
      const open = list.hidden;
      closeMenus();
      list.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      return;
    }
    if (menuItem) {
      menuItem
        .closest('ul')
        ?.querySelectorAll('button')
        .forEach((b) => b.classList.toggle('is-active', b === menuItem && !!b.closest('.dr-menu--events')));
      closeMenus();
      return;
    }
    closeMenus();

    // Раздел / группа
    const toggle = target.closest<HTMLButtonElement>('[data-dr-toggle]');
    if (toggle) {
      const sec = toggle.closest<HTMLElement>('.dr-sec')!;
      // Пока раздел едет — содержимое обрезается; раскрытый раздел не обрезает меню и тултипы.
      sec.classList.add('is-anim');
      window.clearTimeout(Number(sec.dataset.animTimer));
      sec.dataset.animTimer = String(window.setTimeout(() => sec.classList.remove('is-anim'), 500));
      const closed = sec.classList.toggle('is-closed');
      toggle.setAttribute('aria-expanded', String(!closed));
      hideTip();
      return;
    }

    // Вкладки разделов → прокрутка к разделу
    const go = target.closest<HTMLElement>('[data-dr-goto]');
    if (go) {
      const frame = go.closest<HTMLElement>('[data-drug-report]')!;
      const bar = frame.querySelector<HTMLElement>(`[data-dr-anchor="${go.dataset.drGoto}"]`);
      const nav = frame.querySelector<HTMLElement>('[data-dr-nav]');
      if (bar && nav) {
        const top =
          frame.scrollTop + bar.getBoundingClientRect().top - frame.getBoundingClientRect().top - nav.getBoundingClientRect().height - 16 * zoomOf(nav.closest<HTMLElement>('.dr__page')!);
        frame.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      return;
    }

    // Переключатели и подвкладки
    const seg = target.closest<HTMLElement>('[data-dr-seg], [data-dr-sub]');
    if (seg) {
      const attr = seg.hasAttribute('data-dr-seg') ? 'aria-checked' : 'aria-selected';
      seg.parentElement!.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('is-active', b === seg);
        b.setAttribute(attr, String(b === seg));
      });
      return;
    }

    // Избранное
    const fav = target.closest<HTMLElement>('[data-dr-fav]');
    if (fav) {
      fav.setAttribute('aria-pressed', String(fav.getAttribute('aria-pressed') !== 'true'));
      return;
    }

    // Копировать
    const copy = target.closest<HTMLElement>('[data-dr-copy]');
    if (copy) {
      showTip(copy, { text: 'Copied ✓', pos: 'bottom' });
      copy.dataset.dragTip = '1';
      window.clearTimeout(tipTimer);
      tipTimer = window.setTimeout(() => {
        delete copy.dataset.dragTip;
        if (tipAnchor === copy) hideTip();
      }, 1500);
      return;
    }

    // Легенда таймлайна и графиков
    const leg = target.closest<HTMLElement>('[data-dr-leg]');
    if (leg && page) {
      const on = leg.getAttribute('aria-pressed') !== 'true';
      if (EVENTS[leg.dataset.drLeg!]) setEventKind(page, leg.dataset.drLeg!, on);
      else leg.setAttribute('aria-pressed', String(on));
      return;
    }

    // Квадрат события → панель со списком
    const ev = target.closest<HTMLElement>('[data-dr-ev]');
    if (ev && page) {
      hideTip();
      openEvents(page, ev.dataset.drEv!);
      return;
    }
    if (target.closest('[data-dr-evp-close]')) {
      target.closest<HTMLElement>('[data-dr-evp]')!.hidden = true;
      return;
    }

    // Иконка-ссылка на раздел
    const icon = target.closest<HTMLElement>('[data-dr-copied]');
    if (icon) {
      showTip(icon, { text: `${icon.dataset.drCopied} ✓`, pos: 'top' });
      icon.dataset.dragTip = '1';
      window.clearTimeout(tipTimer);
      tipTimer = window.setTimeout(() => {
        delete icon.dataset.dragTip;
        if (tipAnchor === icon) hideTip();
      }, 1500);
      return;
    }

    // Наверх
    const top = target.closest<HTMLElement>('[data-dr-top]');
    if (top) {
      top.parentElement?.querySelector('[data-drug-report]')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  document.addEventListener('pointerdown', (e) => {
    const split = (e.target as Element).closest?.<HTMLElement>('[data-dr-split]');
    if (!split) return;
    e.preventDefault();
    const win = split.parentElement!;
    const frame = win.querySelector<HTMLElement>('[data-drug-report]')!;
    const move = (ev: PointerEvent) => {
      const r = win.getBoundingClientRect();
      setSplit(frame, (ev.clientX - r.left) / r.width);
    };
    split.classList.add('is-dragging');
    split.setPointerCapture(e.pointerId);
    move(e);
    split.addEventListener('pointermove', move);
    split.addEventListener(
      'lostpointercapture',
      () => {
        split.classList.remove('is-dragging');
        split.removeEventListener('pointermove', move);
      },
      { once: true },
    );
  });

  document.addEventListener('keydown', (e) => {
    const knob = (e.target as Element).closest?.<HTMLElement>('[data-dr-knob]');
    if (!knob || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    const win = knob.closest<HTMLElement>('.dr__window')!;
    const step = e.key === 'ArrowLeft' ? -0.05 : 0.05;
    const frame = win.querySelector<HTMLElement>('[data-drug-report]')!;
    const now = parseFloat(win.querySelector<HTMLElement>('[data-dr-split]')!.style.getPropertyValue('--pos')) / 100;
    setSplit(frame, now + step);
  });

  document.addEventListener('change', (e) => {
    const box = (e.target as Element).closest?.<HTMLInputElement>('[data-dr-ev-check]');
    const page = box?.closest<HTMLElement>('.dr__page');
    if (box && page) setEventKind(page, box.dataset.drEvCheck!, box.checked);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.querySelector('.dr-menu__list:not([hidden])')) {
      closeMenus();
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}

function closeMenus() {
  document.querySelectorAll<HTMLElement>('.dr-menu__list:not([hidden])').forEach((l) => {
    l.hidden = true;
    l.previousElementSibling?.setAttribute('aria-expanded', 'false');
  });
}
