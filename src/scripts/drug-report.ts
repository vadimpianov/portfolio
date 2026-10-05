/**
 * Интерактивный отчёт по препарату (кейс Quantori, `DrugReport.astro`).
 * Разметка кейса вставляется в модалку готовым HTML, поэтому обработчики — общие, на документе
 * (ставятся один раз при загрузке модуля), а `initDrugReports` (из CaseDrawer) только подгоняет масштаб
 * и сбрасывает прокрутку окна.
 */

const PAGE_W = 1440;
const MIN_W = 960; // на телефоне страница не мельчит, а листается вбок

const zoomOf = (page: HTMLElement) => Number(page.style.zoom) || 1;

function fit(frame: HTMLElement) {
  const page = frame.querySelector<HTMLElement>('.dr__page');
  if (!page) return;
  page.style.zoom = String(Math.max(frame.clientWidth, MIN_W) / PAGE_W);
}

const resize =
  typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver((entries) => entries.forEach((e) => fit(e.target as HTMLElement)));

export function initDrugReports(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-drug-report]').forEach((frame) => {
    fit(frame);
    frame.scrollTop = 0;
    // На телефоне страница шире окна — сразу к контенту, без левого поля макета (120px).
    frame.scrollLeft = frame.clientWidth < MIN_W ? 108 * zoomOf(frame.querySelector('.dr__page')!) : 0;
    resize?.observe(frame);
    frame.addEventListener('scroll', () => {
      frame.parentElement?.querySelector('.dr__top')?.classList.toggle('is-shown', frame.scrollTop > 400);
      hideTip();
    });
  });
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
      const sec = toggle.closest('.dr-sec')!;
      const closed = sec.classList.toggle('is-closed');
      toggle.setAttribute('aria-expanded', String(!closed));
      hideTip();
      return;
    }

    // Вкладки разделов → прокрутка к разделу
    const go = target.closest<HTMLElement>('[data-dr-goto]');
    if (go) {
      const frame = go.closest<HTMLElement>('[data-drug-report]')!;
      const bars = frame.querySelectorAll<HTMLElement>('.dr-tabs');
      const bar = bars[Number(go.dataset.drGoto)];
      if (bar) {
        const top = frame.scrollTop + bar.getBoundingClientRect().top - frame.getBoundingClientRect().top;
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

    // Наверх
    const top = target.closest<HTMLElement>('[data-dr-top]');
    if (top) {
      top.parentElement?.querySelector('[data-drug-report]')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
