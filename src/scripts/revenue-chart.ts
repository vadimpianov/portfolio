/**
 * Рабочий график «Revenue by Drug» (кейс Quantori, `RevenueChart.astro`) — по макетам пользователя
 * (design/cases/quantori/revenue/*.svg): вкладки Quarterly / Annual, легенда Global / US / Rest of World (выключает
 * свои колонки), меню Drug / Year / Quarter с поиском и галочками, Clear All; на каждый период — колонки по регионам,
 * сложенные из скруглённых блоков по препаратам, сверху сумма; наведение на блок подсвечивает препарат во всех
 * колонках (над колонками — его значение и доля) и показывает подсказку; навигатор — окно по периодам.
 * Данные придуманы (детерминированно). Стили меню, поиска, ссылок — общие с графиком акций (`sc__…`).
 */

const W = 1120;
const MIN_W = 760;
const PAD = 40;
const IW = W - PAD * 2;
const VISIBLE = 9;

const REGIONS = [
  { name: 'Global', color: '#265a8c' },
  { name: 'US', color: '#4a8bbf' },
  { name: 'Rest of World', color: '#863875' },
];

const DRUGS = [
  ['Humira', '#5b8def'],
  ['Skyrizi', '#a9b4e8'],
  ['Rinvoq', '#c8dfa8'],
  ['Imbruvica', '#eea98a'],
  ['Venclexta', '#b394e0'],
  ['Botox Therapeutic', '#e077d8'],
  ['Botox Cosmetic', '#f2df9c'],
  ['Vraylar', '#9b5ab5'],
  ['Ubrelvy', '#e8c48e'],
  ['Qulipta', '#d0e0f6'],
  ['Mavyret', '#82c6a6'],
  ['Linzess', '#86aee6'],
  ['Creon', '#a6d08a'],
  ['Synthroid', '#8b8b8b'],
  ['Juvederm', '#ee8a86'],
  ['Lupron', '#c6c0e4'],
].map(([name, color]) => ({ name, color }));

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Кварталы 2013-Q1 … 2023-Q2; значения в млн $ по препарату и региону (Global ≈ US + RoW). */
const QUARTERS: { y: number; q: number }[] = [];
for (let y = 2013; y <= 2023; y++) for (let q = 1; q <= 4; q++) if (!(y === 2023 && q > 2)) QUARTERS.push({ y, q });
const VALUES: number[][][] = QUARTERS.map((_, qi) => {
  const r = rng(qi * 131 + 7);
  return DRUGS.map((_, d) => {
    const base = 2 + ((d * 7) % 11) * (0.6 + r() * 0.8) * (0.7 + Math.sin(qi / 6 + d) * 0.3);
    const us = Math.max(1, Math.round(base * (0.55 + r() * 0.3)));
    const row = Math.max(1, Math.round(base * (0.25 + r() * 0.3)));
    return [us + row, us, row];
  });
});

type Period = { label: string; values: number[][] }; // values[drug][region]

function mount(root: HTMLElement) {
  const st = {
    mode: 'q' as 'q' | 'y',
    regions: new Set([0, 1, 2]),
    drugs: new Set(DRUGS.map((_, i) => i)),
    years: new Set(QUARTERS.map((p) => p.y)),
    quarters: new Set([1, 2, 3, 4]),
    start: 0,
    hover: null as { d: number } | null,
  };
  const years = [...new Set(QUARTERS.map((p) => p.y))].sort((a, b) => b - a);
  const caret = '<svg width="8" height="5" viewBox="0 0 8 5"><path d="M0 0h8L4 5z" fill="currentColor"/></svg>';
  const search =
    '<label class="sc__search"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8a8d93" stroke-width="1.4"><circle cx="6" cy="6" r="4.5"/><path d="m9.5 9.5 3 3"/></svg><input type="text" placeholder="Start typing" data-rc-search /></label>';

  root.innerHTML = `
    <div class="sc__page rc">
      <div class="rc__top">
        <div class="rc__modes" role="tablist">
          <button type="button" role="tab" data-mode="q">Quarterly</button>
          <button type="button" role="tab" data-mode="y">Annual</button>
        </div>
        <span class="rc__unit" data-unit></span>
      </div>
      <div class="rc__bar">
        <div class="rc__legend">${REGIONS.map((r, i) => `<button type="button" data-region="${i}" aria-pressed="true"><i style="background:${r.color}"></i>${r.name}</button>`).join('')}</div>
        <div class="sc__right">
          <div class="sc__dd"><button type="button" class="sc__plain" data-open>Drug ${caret}</button>
            <div class="sc__menu rc__menu" hidden>${search}
              <div class="rc__list">${DRUGS.map((d, i) => `<label data-name="${d.name.toLowerCase()}"><i style="background:${d.color}"></i><span>${d.name}</span><input type="checkbox" data-drug="${i}" /></label>`).join('')}</div>
              <button type="button" class="sc__link sc__all" data-all="drugs"></button>
            </div>
          </div>
          <div class="sc__dd"><button type="button" class="sc__plain" data-open>Year ${caret}</button>
            <div class="sc__menu rc__menu rc__menu--year" hidden>${search}
              <div class="rc__list">${years.map((y) => `<label data-name="${y}"><span>${y}</span><input type="checkbox" data-year="${y}" /></label>`).join('')}</div>
              <button type="button" class="sc__link sc__all" data-all="years"></button>
            </div>
          </div>
          <div class="sc__dd"><button type="button" class="sc__plain" data-open>Quarter ${caret}</button>
            <div class="sc__menu rc__menu rc__menu--q" hidden>
              <div class="rc__list">${[1, 2, 3, 4].map((q) => `<label><span>Q${q}</span><input type="checkbox" data-quarter="${q}" /></label>`).join('')}</div>
              <button type="button" class="sc__link sc__all" data-all="quarters"></button>
            </div>
          </div>
          <button type="button" class="sc__link rc__clear" data-clear>Clear All</button>
        </div>
      </div>
      <div class="rc__plot"><svg class="sc__svg" data-svg></svg><div class="sc__tip" data-tip hidden></div><div class="sc__qtip" data-rtip hidden></div></div>
    </div>`;

  const svg = root.querySelector<SVGSVGElement>('[data-svg]')!;
  const tip = root.querySelector<HTMLElement>('[data-tip]')!;
  const rtip = root.querySelector<HTMLElement>('[data-rtip]')!;
  const fmt = (v: number, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  function periods(): Period[] {
    const qs = QUARTERS.map((p, i) => ({ ...p, i })).filter((p) => st.years.has(p.y) && st.quarters.has(p.q));
    if (st.mode === 'q') return qs.map((p) => ({ label: `${p.y} - Q${p.q}`, values: VALUES[p.i] }));
    const by = new Map<number, number[][]>();
    for (const p of qs) {
      const acc = by.get(p.y) ?? DRUGS.map(() => [0, 0, 0]);
      VALUES[p.i].forEach((v, d) => v.forEach((x, r) => (acc[d][r] += x)));
      by.set(p.y, acc);
    }
    return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([y, values]) => ({ label: String(y), values }));
  }

  let ctx: { segs: { x: number; y: number; w: number; h: number; d: number; r: number; p: Period; v: number }[] } = { segs: [] };

  function render() {
    const all = periods();
    const n = Math.min(VISIBLE, all.length);
    st.start = Math.max(0, Math.min(st.start, all.length - n));
    const list = all.slice(st.start, st.start + n);
    const regs = [...st.regions].sort();
    const drugs = DRUGS.map((_, i) => i).filter((i) => st.drugs.has(i));
    const top = 48;
    const plotH = 400;
    const base = top + plotH;
    const labY = base + 40;
    const navY = labY + 24;
    const height = navY + 40;
    svg.setAttribute('viewBox', `0 0 ${IW} ${height}`);
    svg.setAttribute('width', String(IW));
    svg.setAttribute('height', String(height));
    let max = 1;
    for (const p of list) for (const r of regs) max = Math.max(max, drugs.reduce((a, d) => a + p.values[d][r], 0));
    const k = plotH / max;
    const groupW = IW / Math.max(1, n);
    const gap = 6;
    const colW = Math.min(56, (groupW - 28 - gap * (regs.length - 1)) / Math.max(1, regs.length));
    let s = '';
    ctx = { segs: [] };
    list.forEach((p, gi) => {
      const gx = gi * groupW + (groupW - (colW * regs.length + gap * (regs.length - 1))) / 2;
      regs.forEach((r, ci) => {
        const x = gx + ci * (colW + gap);
        let y = base;
        const total = drugs.reduce((a, d) => a + p.values[d][r], 0);
        for (const d of drugs) {
          const v = p.values[d][r];
          const h = Math.max(2, v * k);
          const hl = st.hover?.d === d;
          const dim = st.hover && !hl;
          s += `<rect x="${x}" y="${y - h + 1}" width="${colW}" height="${h - 2}" rx="${Math.min(6, (h - 2) / 2)}" fill="${hl ? '#3a82d0' : DRUGS[d].color}" opacity="${dim ? 0.28 : 1}" data-seg="${ctx.segs.length}"/>`;
          ctx.segs.push({ x, y: y - h + 1, w: colW, h: h - 2, d, r, p, v });
          y -= h;
        }
        // Сумма над колонкой; при наведении — значение препарата и его доля
        const label = st.hover
          ? `<tspan x="${x + colW / 2}">${fmt(p.values[st.hover.d][r])}</tspan><tspan x="${x + colW / 2}" dy="16">(${fmt((p.values[st.hover.d][r] / (total || 1)) * 100)}%)</tspan>`
          : fmt(total);
        s += `<text x="${x + colW / 2}" y="${y - (st.hover ? 26 : 8)}" text-anchor="middle" class="rc__total">${label}</text>`;
        s += `<rect x="${x}" y="${base + 6}" width="${colW}" height="14" fill="${REGIONS[r].color}" data-region-bar="${r}"/>`;
      });
      s += `<text x="${gi * groupW + groupW / 2}" y="${labY}" text-anchor="middle" class="sc__ax rc__lab">${p.label}</text>`;
    });
    if (!list.length) s += `<text x="${IW / 2}" y="${top + plotH / 2}" text-anchor="middle" class="sc__ax">Nothing selected — choose drugs, years and quarters</text>`;
    // Навигатор: окно по всем периодам
    const navW = IW;
    s += `<rect x="0" y="${navY}" width="${navW}" height="22" rx="3" fill="#f5f7fa" stroke="#dfdddf"/>`;
    if (all.length > n) {
      const wx = (st.start / all.length) * navW;
      const ww = Math.max(24, (n / all.length) * navW);
      s += `<rect class="sc__nav-win" data-nav x="${wx}" y="${navY}" width="${ww}" height="22" rx="3" fill="rgb(13 105 235 / 0.12)" stroke="#0d69eb"/>`;
    }
    svg.innerHTML = s;
    Object.assign(ctx, { all, n, navY });

    // Состояние элементов управления
    root.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) => b.classList.toggle('is-active', b.dataset.mode === st.mode));
    root.querySelector('[data-unit]')!.textContent = st.mode === 'q' ? 'Quarterly sales USD (in millions)' : 'Annual sales USD (in millions)';
    root.querySelectorAll<HTMLElement>('[data-region]').forEach((b) => {
      const on = st.regions.has(Number(b.dataset.region));
      b.setAttribute('aria-pressed', String(on));
    });
    root.querySelectorAll<HTMLInputElement>('[data-drug]').forEach((c) => (c.checked = st.drugs.has(Number(c.dataset.drug))));
    root.querySelectorAll<HTMLInputElement>('[data-year]').forEach((c) => (c.checked = st.years.has(Number(c.dataset.year))));
    root.querySelectorAll<HTMLInputElement>('[data-quarter]').forEach((c) => (c.checked = st.quarters.has(Number(c.dataset.quarter))));
    const full = { drugs: st.drugs.size === DRUGS.length, years: st.years.size === years.length, quarters: st.quarters.size === 4 };
    root.querySelectorAll<HTMLElement>('[data-all]').forEach((b) => {
      const k = b.dataset.all as keyof typeof full;
      b.textContent = full[k] ? 'Deselect all' : 'Select all';
    });
    const dirty = !full.drugs || !full.years || !full.quarters || st.regions.size < 3;
    root.querySelector('[data-clear]')!.classList.toggle('is-off', !dirty);
    root.querySelectorAll<HTMLElement>('[data-open]').forEach((b, i) => b.classList.toggle('is-on', [!full.drugs, !full.years, !full.quarters][i]));
  }

  /* ---------- Мышь ---------- */
  const zoom = () => Number(root.querySelector<HTMLElement>('.sc__page')!.style.zoom) || 1;
  const local = (e: PointerEvent) => {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) / zoom(), y: (e.clientY - r.top) / zoom() };
  };
  svg.addEventListener('pointermove', (e) => {
    if (drag) return;
    const t = (e.target as Element).closest<SVGElement>('[data-seg]');
    const rb = (e.target as Element).closest<SVGElement>('[data-region-bar]');
    rtip.hidden = !rb;
    if (rb) {
      const p = local(e);
      rtip.textContent = REGIONS[Number(rb.dataset.regionBar)].name;
      rtip.style.left = `${p.x - rtip.offsetWidth / 2}px`;
      rtip.style.top = `${Number(rb.getAttribute('y')) + 26}px`;
    }
    if (!t) {
      if (st.hover) {
        st.hover = null;
        tip.hidden = true;
        render();
      }
      return;
    }
    const seg = ctx.segs[Number(t.dataset.seg)];
    if (st.hover?.d !== seg.d) {
      st.hover = { d: seg.d };
      render();
    }
    // Обводка у блока под курсором и подсказка над ним
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    Object.entries({ x: seg.x - 1, y: seg.y - 1, width: seg.w + 2, height: seg.h + 2, rx: 6, fill: 'none', stroke: '#0d69eb', 'stroke-width': 2 }).forEach(([k, v]) =>
      ring.setAttribute(k, String(v)),
    );
    svg.querySelector('[data-ring]')?.remove();
    ring.setAttribute('data-ring', '');
    ring.style.pointerEvents = 'none';
    svg.append(ring);
    tip.innerHTML = `<b>${seg.p.label}</b><span>${REGIONS[seg.r].name}</span><b>${DRUGS[seg.d].name}</b><span class="sc__tip-row"><i style="background:${DRUGS[seg.d].color}"></i>$${fmt(seg.v, 1)} M</span>`;
    tip.hidden = false;
    tip.style.left = `${seg.x + seg.w / 2 - tip.offsetWidth / 2}px`;
    tip.style.top = `${seg.y - tip.offsetHeight - 10}px`;
  });
  svg.addEventListener('pointerleave', () => {
    tip.hidden = true;
    rtip.hidden = true;
    if (st.hover) {
      st.hover = null;
      render();
    }
  });

  let drag: { x: number; start: number } | null = null;
  svg.addEventListener('pointerdown', (e) => {
    if (!(e.target as Element).closest('[data-nav]')) return;
    e.preventDefault();
    drag = { x: local(e).x, start: st.start };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const all = (ctx as any).all.length as number;
    st.start = Math.round(drag.start + ((local(e).x - drag.x) / IW) * all);
    render();
  });
  svg.addEventListener('lostpointercapture', () => (drag = null));

  /* ---------- Клики ---------- */
  const closeMenus = (except?: Element | null) => root.querySelectorAll<HTMLElement>('.sc__menu').forEach((m) => m !== except && (m.hidden = true));
  root.addEventListener('click', (e) => {
    const el = e.target as Element;
    const open = el.closest<HTMLElement>('[data-open]');
    if (open) {
      const menu = open.parentElement!.querySelector<HTMLElement>('.sc__menu')!;
      closeMenus(menu);
      menu.hidden = !menu.hidden;
      return;
    }
    const mode = el.closest<HTMLElement>('[data-mode]');
    if (mode) {
      st.mode = mode.dataset.mode as 'q' | 'y';
      st.start = 1e9; // к последним периодам
      render();
      return;
    }
    const reg = el.closest<HTMLElement>('[data-region]');
    if (reg) {
      const i = Number(reg.dataset.region);
      if (st.regions.has(i)) st.regions.delete(i);
      else st.regions.add(i);
      render();
      return;
    }
    const all = el.closest<HTMLElement>('[data-all]');
    if (all) {
      const k = all.dataset.all!;
      const set = k === 'drugs' ? st.drugs : k === 'years' ? st.years : st.quarters;
      const items = k === 'drugs' ? DRUGS.map((_, i) => i) : k === 'years' ? years : [1, 2, 3, 4];
      if (set.size === items.length) set.clear();
      else items.forEach((v) => set.add(v));
      render();
      return;
    }
    if (el.closest('[data-clear]')) {
      DRUGS.forEach((_, i) => st.drugs.add(i));
      years.forEach((y) => st.years.add(y));
      [1, 2, 3, 4].forEach((q) => st.quarters.add(q));
      [0, 1, 2].forEach((r) => st.regions.add(r));
      closeMenus();
      render();
      return;
    }
    if (!el.closest('.sc__menu')) closeMenus();
  });
  root.addEventListener('change', (e) => {
    const c = e.target as HTMLInputElement;
    const set = c.dataset.drug ? st.drugs : c.dataset.year ? st.years : c.dataset.quarter ? st.quarters : null;
    if (!set) return;
    const v = Number(c.dataset.drug ?? c.dataset.year ?? c.dataset.quarter);
    if (c.checked) set.add(v);
    else set.delete(v);
    render();
  });
  root.addEventListener('input', (e) => {
    const c = e.target as HTMLInputElement;
    if (!c.matches('[data-rc-search]')) return;
    const v = c.value.trim().toLowerCase();
    c.closest('.sc__menu')!.querySelectorAll<HTMLElement>('[data-name]').forEach((l) => (l.hidden = !!v && !l.dataset.name!.includes(v)));
  });

  st.start = 1e9; // по умолчанию — последние кварталы
  render();
}

function fit(root: HTMLElement) {
  const page = root.querySelector<HTMLElement>('.sc__page');
  if (page) page.style.zoom = String(Math.max(root.clientWidth, MIN_W) / W);
}

const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((es) => es.forEach((e) => fit(e.target as HTMLElement)));

export function initRevenueCharts(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-revenue-chart]').forEach((el) => {
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    mount(el);
    fit(el);
    resize?.observe(el);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest?.('[data-revenue-chart]')) return;
    document.querySelectorAll<HTMLElement>('[data-revenue-chart] .sc__menu').forEach((m) => (m.hidden = true));
  });
}
