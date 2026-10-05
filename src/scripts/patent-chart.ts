/**
 * Рабочий график «Patents» (кейс Quantori, `PatentChart.astro`) — по макетам пользователя
 * (design/cases/quantori/patents/*.svg): Display Type By State / By Type, меню Date (даты публикации и истечения),
 * Type (DS, DP, DS DP, Other), Trade Name и Drug Name (поиск, галочки, страницы), Clear All; легенда выключает
 * состояния и типы (в By Type — и целую группу Active / Expired); слева от синей линии — история, справа — прогноз
 * (бледнее); наведение на блок — подсказка и подсветка строк таблицы, клик — таблица только по этому блоку;
 * навигатор — окно по кварталам; под графиком — таблица патентов. Данные придуманы (детерминированно).
 * Общие стили меню, поиска, подсказок — из графика акций (`sc__…`).
 */

const W = 1120;
const MIN_W = 760;
const PAD = 40;
const IW = W - PAD * 2;
const VISIBLE = 11;
const DIV = 64; // место под линию «Historical | Future»
const PLOT_H_TABS = 609; // во вкладках графиков — выше: виджет 857px, как Stock Price

type Type = 'DS' | 'DP' | 'DS, DP' | 'Other';
const TYPES: Type[] = ['DS', 'DP', 'DS, DP', 'Other'];
const STATES = [
  { name: 'New', color: '#6f9ffc' },
  { name: 'Active', color: '#27b04f' },
  { name: 'Expired', color: '#999999' },
];
const TYPE_COLORS: Record<'a' | 'e', Record<Type, string>> = {
  a: { DS: '#c4dd25', DP: '#f24e4e', 'DS, DP': '#9475bb', Other: '#5f8c76' },
  e: { DS: '#7f8f12', DP: '#a52322', 'DS, DP': '#4b3a63', Other: '#3e6853' },
};
const GROUP = { a: { name: 'Active', color: '#b3b3b3' }, e: { name: 'Expired', color: '#5b5b5b' } };

/** Кварталы 2018-Q1 … 2024-Q4; «сегодня» — 2020-Q2 (дальше — прогноз по датам истечения). */
const QUARTERS: { y: number; q: number }[] = [];
for (let y = 2018; y <= 2024; y++) for (let q = 1; q <= 4; q++) QUARTERS.push({ y, q });
const TODAY = QUARTERS.findIndex((p) => p.y === 2020 && p.q === 2);
const qEnd = (i: number) => {
  const { y, q } = QUARTERS[i];
  return `${y}-${String(q * 3).padStart(2, '0')}-31`;
};
const qStart = (i: number) => {
  const { y, q } = QUARTERS[i];
  return `${y}-${String(q * 3 - 2).padStart(2, '0')}-01`;
};

type Patent = { no: string; pub: string; exp: string; type: Type; trade: string; drug: string; fda: string };
const PATENTS: Patent[] = [
  ['10117836', '2019-01-17', '2020-05-12', 'DS, DP', 'Sigmapharm Labs LLC', 'Sprycel', 'U-1064; U-1893; U-1960; U-1961; U-1962; U-1963; U-1966'],
  ['9629847', '2019-02-05', '2020-08-23', 'Other', 'Aliskiren Hemifumarate', 'Methotrexate', '—'],
  ['9814720', '2019-02-21', '2020-11-04', 'DS', 'Albendazole', 'Calaspargase pegol', '—'],
  ['10251921', '2019-03-08', '2020-12-15', 'DS, DP', 'Calcium', 'Entrectinib', '—'],
  ['10034657', '2019-03-27', '2021-02-19', 'DP', 'Adderall', 'Blinatumomab', 'U-2114'],
  ['10398204', '2019-04-11', '2021-05-27', 'DP', 'Adzenys Xr-odt', 'Cyclophosphamide', '—'],
  ['10485331', '2019-05-02', '2021-07-08', 'DS', 'Entereg', 'Clofarabine', 'U-1587; U-1588'],
  ['10561748', '2019-05-30', '2021-08-30', 'DS, DP', 'Proleukin', 'Azedra', '—'],
  ['10617309', '2019-06-18', '2021-11-11', 'DP', 'Alecensa', 'Ipilimumab', 'U-2390'],
  ['10702865', '2019-08-06', '2022-03-23', 'DS', 'Lemtrada', 'Mercaptopurine', '—'],
  ['10786412', '2019-11-14', '2024-06-02', 'DS, DP', 'Abiraterone Acetate', 'Nilotinib', 'U-1912; U-1913'],
].map(([no, pub, exp, type, trade, drug, fda]) => ({ no, pub, exp, type: type as Type, trade, drug, fda }));

const TRADES = [...new Set(PATENTS.map((p) => p.trade))];
const DRUGS = [...new Set(PATENTS.map((p) => p.drug))];
const PER_PAGE = 8;

type Seg = { x: number; y: number; w: number; h: number; i: number; key: string; label: string; color: string; ids: number[] };

function mount(root: HTMLElement) {
  const hasTable = !!root.dataset.table;
  const st = {
    view: 'state' as 'state' | 'type',
    states: new Set([0, 1, 2]),
    act: new Set<Type>(TYPES),
    exp: new Set<Type>(TYPES),
    types: new Set<Type>(TYPES),
    trades: new Set(TRADES),
    drugs: new Set(DRUGS),
    pubFrom: '2013-10-14',
    pubTo: '2020-11-27',
    expFrom: '2011-09-21',
    expTo: '2025-04-13',
    page: { trades: 0, drugs: 0 },
    start: Math.max(0, TODAY - 5),
    hover: null as string | null,
    pick: null as { key: string; label: string; ids: number[] } | null,
  };
  const DEF = { pubFrom: st.pubFrom, pubTo: st.pubTo, expFrom: st.expFrom, expTo: st.expTo };
  const caret = '<svg width="8" height="5" viewBox="0 0 8 5"><path d="M0 0h8L4 5z" fill="currentColor"/></svg>';
  const search = (k: string) =>
    `<label class="sc__search"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8a8d93" stroke-width="1.4"><circle cx="6" cy="6" r="4.5"/><path d="m9.5 9.5 3 3"/></svg><input type="text" placeholder="Start typing" data-pc-search="${k}" /></label>`;
  const nameMenu = (k: 'trades' | 'drugs', cls: string) => `
    <div class="sc__menu pc__menu ${cls}" hidden>
      <div class="pc__menu-top">${search(k)}<button type="button" class="sc__link" data-all="${k}"></button></div>
      <div class="pc__list" data-list="${k}"></div>
      <div class="pc__pages" data-pages="${k}"></div>
    </div>`;
  const info =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#0d69eb" stroke-width="1.2"><circle cx="8" cy="8" r="6.5"/><path d="M8 7v4.5M8 4.6v.1" stroke-linecap="round"/></svg>';

  root.innerHTML = `
    <div class="sc__page pc">
      <div class="pc__bar">
        <div class="sc__dd"><button type="button" class="sc__plain pc__view" data-open>Display Type <span class="pc__blue" data-view-name></span> ${caret}</button>
          <div class="sc__menu sc__menu--type pc__menu-view" hidden>
            <button type="button" data-view="state">By State</button><button type="button" data-view="type">By Type</button>
          </div>
        </div>
        <div class="sc__dd"><button type="button" class="sc__plain" data-open data-key="date">Date ${caret}</button>
          <div class="sc__menu pc__menu-date" hidden>
            <label><span>Published Date</span><input type="date" data-date="pubFrom" /><input type="date" data-date="pubTo" /></label>
            <label><span>Expiration Date</span><input type="date" data-date="expFrom" /><input type="date" data-date="expTo" /></label>
          </div>
        </div>
        <div class="sc__dd"><button type="button" class="sc__plain" data-open data-key="types">Type ${caret}</button>
          <div class="sc__menu pc__menu-type" hidden>
            <div class="pc__list">${TYPES.map((t) => `<label><span>${t}</span><input type="checkbox" data-type="${t}" /></label>`).join('')}</div>
            <button type="button" class="sc__link sc__all" data-all="types"></button>
          </div>
        </div>
        <div class="sc__dd"><button type="button" class="sc__plain" data-open data-key="trades">Trade Name ${caret}</button>${nameMenu('trades', 'pc__menu--right')}</div>
        <div class="sc__dd"><button type="button" class="sc__plain" data-open data-key="drugs">Drug Name ${caret}</button>${nameMenu('drugs', '')}</div>
        <button type="button" class="sc__link pc__clear" data-clear>Clear All</button>
        <div class="pc__legend" data-legend-state>${STATES.map((s, i) => `<button type="button" data-state="${i}"><i style="background:${s.color}"></i>${s.name}</button>`).join('')}</div>
      </div>
      <div class="pc__legend2" data-legend-type>
        ${(['a', 'e'] as const)
          .map(
            (g) =>
              `<div class="pc__legend"><button type="button" data-group="${g}"><i style="background:${GROUP[g].color}"></i>${GROUP[g].name}</button>${TYPES.map(
                (t) => `<button type="button" data-gtype="${g}:${t}"><i style="background:${TYPE_COLORS[g][t]}"></i>${t}</button>`,
              ).join('')}</div>`,
          )
          .join('')}
      </div>
      <div class="pc__plot"><svg class="sc__svg" data-svg></svg><div class="sc__tip" data-tip hidden></div></div>
      <div class="pc__pick" data-pick hidden></div>
      <div class="pc__table" role="table"${root.dataset.table ? '' : ' hidden'}>
        <div class="pc__row pc__row--head" role="row">
          <span>Patent</span><span>Published</span><span>Expiration</span>
          <span class="pc__type-h">Type <button type="button" class="pc__info" aria-label="Patent types">${info}</button><span class="sc__qtip pc__info-tip">DS — Drug Substance<br/>DP — Drug Product</span></span>
          <span>Trade Name</span><span>Drug Name</span><span>FDA Information</span>
        </div>
        <div data-rows></div>
      </div>
    </div>`;

  const svg = root.querySelector<SVGSVGElement>('[data-svg]')!;
  const tip = root.querySelector<HTMLElement>('[data-tip]')!;
  let segs: Seg[] = [];
  let total = QUARTERS.length;

  const filtered = () =>
    PATENTS.map((p, i) => ({ p, i })).filter(
      ({ p }) =>
        st.types.has(p.type) &&
        st.trades.has(p.trade) &&
        st.drugs.has(p.drug) &&
        p.pub >= st.pubFrom &&
        p.pub <= st.pubTo &&
        p.exp >= st.expFrom &&
        p.exp <= st.expTo,
    );

  /** Состояние патента на конец квартала: 0 — новый (опубликован в квартале), 1 — действует, 2 — истёк, −1 — ещё нет. */
  const stateAt = (p: Patent, qi: number) => {
    if (p.pub > qEnd(qi)) return -1;
    if (p.exp <= qEnd(qi)) return 2;
    return p.pub >= qStart(qi) ? 0 : 1;
  };

  function render() {
    const list = filtered();
    const n = Math.min(VISIBLE, QUARTERS.length);
    st.start = Math.max(0, Math.min(st.start, QUARTERS.length - n));
    const vis = Array.from({ length: n }, (_, k) => st.start + k);
    const split = vis.findIndex((qi) => qi > TODAY); // первый квартал прогноза
    const hasDiv = split > 0;
    const groupW = (IW - (hasDiv ? DIV : 0)) / n;
    const gx = (k: number) => k * groupW + (hasDiv && k >= split ? DIV : 0);
    const top = 40;
    const plotH = hasTable ? 400 : PLOT_H_TABS;
    const base = top + plotH;
    const byType = st.view === 'type';
    const groups = (['a', 'e'] as const).filter((g) => (g === 'a' ? st.act.size : st.exp.size));
    const labY = base + (byType ? 44 : 26);
    const navY = labY + 26;
    const height = navY + 32;
    svg.setAttribute('viewBox', `0 0 ${IW} ${height}`);
    svg.setAttribute('width', String(IW));
    svg.setAttribute('height', String(height));

    // Столбики: по каждому кварталу — блоки (ключ, подпись, цвет, патенты)
    type Block = { key: string; label: string; color: string; ids: number[] };
    const cols = vis.map((qi) => {
      if (!byType) {
        const blocks: Block[] = [2, 1, 0]
          .filter((s) => st.states.has(s))
          .map((s) => ({ key: `s${s}`, label: STATES[s].name, color: STATES[s].color, ids: list.filter(({ p }) => stateAt(p, qi) === s).map(({ i }) => i) }));
        return [blocks];
      }
      return groups.map((g) =>
        TYPES.filter((t) => (g === 'a' ? st.act : st.exp).has(t)).map((t) => ({
          key: `${g}:${t}`,
          label: `${GROUP[g].name} · ${t}`,
          color: TYPE_COLORS[g][t],
          ids: list.filter(({ p }) => p.type === t && (g === 'a' ? [0, 1].includes(stateAt(p, qi)) : stateAt(p, qi) === 2)).map(({ i }) => i),
        })),
      );
    });
    let max = 1;
    for (const c of cols) for (const col of c) max = Math.max(max, col.reduce((a, b) => a + b.ids.length, 0));
    const k = (plotH - 8) / max;

    let s = '';
    segs = [];
    vis.forEach((qi, vi) => {
      const future = qi > TODAY;
      const cs = cols[vi];
      const colGap = 8;
      const colW = byType ? (cs.length > 1 ? 32 : 72) : 72;
      const wAll = colW * cs.length + colGap * (cs.length - 1);
      const x0 = gx(vi) + (groupW - wAll) / 2;
      let sum = 0;
      cs.forEach((blocks, ci) => {
        const x = x0 + ci * (colW + colGap);
        let y = base;
        for (const b of blocks) {
          if (!b.ids.length) continue;
          const h = b.ids.length * k;
          const dim = (st.hover && st.hover !== `${qi}|${b.key}`) || (st.pick && st.pick.key !== `${qi}|${b.key}`);
          s += `<rect x="${x}" y="${y - h + 4}" width="${colW}" height="${h - 4}" rx="${Math.min(8, (h - 4) / 2)}" fill="${b.color}" opacity="${(future ? 0.6 : 1) * (dim ? 0.35 : 1)}" data-seg="${segs.length}"/>`;
          segs.push({ x, y: y - h + 4, w: colW, h: h - 4, i: qi, key: b.key, label: b.label, color: b.color, ids: b.ids });
          y -= h;
          sum += b.ids.length;
        }
        if (byType) {
          const g = groups[ci];
          s += `<rect x="${x}" y="${base + 8}" width="${colW}" height="14" fill="${GROUP[g].color}" opacity="${future ? 0.7 : 1}"/>`;
        }
      });
      s += `<text x="${gx(vi) + groupW / 2}" y="${top - 16}" text-anchor="middle" class="pc__total">${sum}</text>`;
      s += `<text x="${gx(vi) + groupW / 2}" y="${labY}" text-anchor="middle" class="sc__ax pc__lab">${QUARTERS[qi].y} - Q${QUARTERS[qi].q}</text>`;
    });
    if (hasDiv) {
      const lx = gx(split) - DIV / 2;
      s += `<line x1="${lx + 0.5}" x2="${lx + 0.5}" y1="${top - 34}" y2="${labY + 8}" stroke="#4a90e2" stroke-width="2"/>`;
      const my = top + plotH / 2;
      s += `<text transform="translate(${lx - 10} ${my}) rotate(-90)" text-anchor="middle" class="pc__era">Historical</text>`;
      s += `<text transform="translate(${lx + 20} ${my}) rotate(-90)" text-anchor="middle" class="pc__era">Future</text>`;
    }
    if (!list.length) s += `<text x="${IW / 2}" y="${top + plotH / 2}" text-anchor="middle" class="sc__ax">No patents match the filters</text>`;
    // Навигатор
    s += `<rect x="0.5" y="${navY + 0.5}" width="${IW - 1}" height="28" rx="4" fill="#fff" stroke="#dfdddf"/>`;
    const wx = (st.start / total) * IW;
    const ww = (n / total) * IW;
    s += `<rect class="sc__nav-win" data-nav x="${wx + 0.5}" y="${navY + 0.5}" width="${ww - 1}" height="28" rx="4" fill="rgb(13 105 235 / 0.1)" stroke="#9cbcf2"/>`;
    s += `<rect x="${wx - 3}" y="${navY + 7}" width="6" height="16" rx="2" fill="#fff" stroke="#9cbcf2" pointer-events="none"/><rect x="${wx + ww - 3}" y="${navY + 7}" width="6" height="16" rx="2" fill="#fff" stroke="#9cbcf2" pointer-events="none"/>`;
    svg.innerHTML = s;

    // Таблица
    const pick = st.pick ? new Set(st.pick.ids) : null;
    const hoverIds = st.hover ? new Set(segs.find((g) => `${g.i}|${g.key}` === st.hover)?.ids ?? []) : null;
    const rows = list.filter(({ i }) => !pick || pick.has(i));
    root.querySelector('[data-rows]')!.innerHTML =
      rows
        .map(
          ({ p, i }) =>
            `<div class="pc__row${hoverIds?.has(i) ? ' is-hl' : ''}" role="row"><span><button type="button" class="sc__link">${p.no}</button></span><span>${p.pub}</span><span>${p.exp}</span><span>${p.type === 'Other' ? '—' : p.type}</span><span>${p.trade}</span><span><button type="button" class="sc__link">${p.drug}</button></span><span>${p.fda}</span></div>`,
        )
        .join('') || '<div class="pc__row pc__row--empty">No patents</div>';
    const pk = root.querySelector<HTMLElement>('[data-pick]')!;
    pk.hidden = !st.pick;
    if (st.pick) pk.innerHTML = `${st.pick.label} — ${st.pick.ids.length} patent${st.pick.ids.length === 1 ? '' : 's'} <button type="button" class="sc__link" data-unpick>Show all</button>`;

    // Элементы управления
    root.querySelector('[data-view-name]')!.textContent = byType ? 'By Type' : 'By State';
    root.querySelectorAll<HTMLElement>('[data-view]').forEach((b) => b.classList.toggle('is-active', b.dataset.view === st.view));
    root.querySelector<HTMLElement>('[data-legend-state]')!.hidden = byType;
    root.querySelector<HTMLElement>('[data-legend-type]')!.hidden = !byType;
    root.querySelectorAll<HTMLElement>('[data-state]').forEach((b) => b.setAttribute('aria-pressed', String(st.states.has(Number(b.dataset.state)))));
    root.querySelectorAll<HTMLElement>('[data-group]').forEach((b) => {
      const g = b.dataset.group as 'a' | 'e';
      b.setAttribute('aria-pressed', String((g === 'a' ? st.act : st.exp).size > 0));
    });
    root.querySelectorAll<HTMLElement>('[data-gtype]').forEach((b) => {
      const [g, t] = b.dataset.gtype!.split(':') as ['a' | 'e', Type];
      b.setAttribute('aria-pressed', String((g === 'a' ? st.act : st.exp).has(t)));
    });
    root.querySelectorAll<HTMLInputElement>('[data-type]').forEach((c) => (c.checked = st.types.has(c.dataset.type as Type)));
    root.querySelectorAll<HTMLInputElement>('[data-date]').forEach((c) => (c.value = st[c.dataset.date as keyof typeof DEF]));
    for (const key of ['trades', 'drugs'] as const) renderNames(key);
    const full = {
      types: st.types.size === TYPES.length,
      trades: st.trades.size === TRADES.length,
      drugs: st.drugs.size === DRUGS.length,
      date: (Object.keys(DEF) as (keyof typeof DEF)[]).every((k) => st[k] === DEF[k]),
    };
    root.querySelectorAll<HTMLElement>('[data-all]').forEach((b) => {
      const key = b.dataset.all as 'types' | 'trades' | 'drugs';
      b.textContent = full[key] ? (key === 'types' ? 'Deselect All' : 'Deselect all') : key === 'types' ? 'Select All' : 'Select all';
    });
    root.querySelectorAll<HTMLElement>('[data-key]').forEach((b) => b.classList.toggle('is-on', !full[b.dataset.key as keyof typeof full]));
    const dirty = !full.types || !full.trades || !full.drugs || !full.date || st.states.size < 3 || st.act.size < 4 || st.exp.size < 4 || !!st.pick;
    root.querySelector('[data-clear]')!.classList.toggle('is-off', !dirty);
  }

  function renderNames(key: 'trades' | 'drugs') {
    const all = key === 'trades' ? TRADES : DRUGS;
    const set = key === 'trades' ? st.trades : st.drugs;
    const q = root.querySelector<HTMLInputElement>(`[data-pc-search="${key}"]`)!.value.trim().toLowerCase();
    const items = all.filter((v) => !q || v.toLowerCase().includes(q));
    const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    st.page[key] = Math.min(st.page[key], pages - 1);
    const cur = st.page[key];
    root.querySelector(`[data-list="${key}"]`)!.innerHTML = items
      .slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE)
      .map((v) => `<label><span>${v}</span><input type="checkbox" data-name="${key}" value="${v}"${set.has(v) ? ' checked' : ''} /></label>`)
      .join('');
    const arrow = (d: number, path: string, off: boolean) =>
      `<button type="button" data-page="${key}:${cur + d}"${off ? ' disabled' : ''} aria-label="${d < 0 ? 'Previous' : 'Next'} page"><svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="${path}"/></svg></button>`;
    root.querySelector(`[data-pages="${key}"]`)!.innerHTML =
      arrow(-1, 'M7 1 1 7l6 6', cur === 0) +
      Array.from({ length: pages }, (_, p) => `<button type="button" data-page="${key}:${p}"${p === cur ? ' class="is-cur"' : ''}>${p + 1}</button>`).join('') +
      arrow(1, 'm1 1 6 6-6 6', cur === pages - 1);
  }

  /* ---------- Мышь ---------- */
  // Итоговый масштаб (свой zoom × zoom страниц-родителей, напр. отчёта о компании)
  const zoom = () => root.querySelector<HTMLElement>('.sc__page')!.getBoundingClientRect().width / W || 1;
  const localX = (e: PointerEvent) => (e.clientX - svg.getBoundingClientRect().left) / zoom();
  svg.addEventListener('pointermove', (e) => {
    if (drag) return;
    const t = (e.target as Element).closest<SVGElement>('[data-seg]');
    if (!t) {
      if (st.hover) {
        st.hover = null;
        tip.hidden = true;
        render();
      }
      return;
    }
    const g = segs[Number(t.dataset.seg)];
    const id = `${g.i}|${g.key}`;
    if (st.hover !== id) {
      st.hover = id;
      render();
    }
    const { y, q } = QUARTERS[g.i];
    tip.innerHTML = `<b>${y} - Q${q}${g.i > TODAY ? ' (forecast)' : ''}</b><span class="sc__tip-row"><i style="background:${g.color}"></i>${g.label}: ${g.ids.length} patent${g.ids.length === 1 ? '' : 's'}</span>${hasTable ? '<span>Click to filter the table</span>' : ''}`;
    tip.hidden = false;
    tip.style.left = `${Math.max(0, Math.min(IW - tip.offsetWidth, g.x + g.w / 2 - tip.offsetWidth / 2))}px`;
    tip.style.top = `${Math.max(0, g.y - tip.offsetHeight - 10)}px`;
  });
  svg.addEventListener('pointerleave', () => {
    tip.hidden = true;
    if (st.hover) {
      st.hover = null;
      render();
    }
  });
  svg.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<SVGElement>('[data-seg]');
    if (!t || !hasTable) return;
    const g = segs[Number(t.dataset.seg)];
    const key = `${g.i}|${g.key}`;
    const { y, q } = QUARTERS[g.i];
    st.pick = st.pick?.key === key ? null : { key, label: `${y} - Q${q} · ${g.label}`, ids: g.ids };
    render();
  });

  let drag: { x: number; start: number } | null = null;
  svg.addEventListener('pointerdown', (e) => {
    if (!(e.target as Element).closest('[data-nav]')) return;
    e.preventDefault();
    drag = { x: localX(e), start: st.start };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    st.start = Math.round(drag.start + ((localX(e) - drag.x) / IW) * total);
    render();
  });
  svg.addEventListener('lostpointercapture', () => (drag = null));

  /* ---------- Клики ---------- */
  const closeMenus = (except?: Element | null) => root.querySelectorAll<HTMLElement>('.sc__menu').forEach((m) => m !== except && (m.hidden = true));
  const toggle = <T>(set: Set<T>, v: T) => (set.has(v) ? set.delete(v) : set.add(v));
  root.addEventListener('click', (e) => {
    const el = e.target as Element;
    const open = el.closest<HTMLElement>('[data-open]');
    if (open) {
      const menu = open.parentElement!.querySelector<HTMLElement>('.sc__menu')!;
      closeMenus(menu);
      menu.hidden = !menu.hidden;
      return;
    }
    const view = el.closest<HTMLElement>('[data-view]');
    if (view) {
      st.view = view.dataset.view as 'state' | 'type';
      st.pick = null;
      closeMenus();
      render();
      return;
    }
    const sb = el.closest<HTMLElement>('[data-state]');
    if (sb) return toggle(st.states, Number(sb.dataset.state)), (st.pick = null), render();
    const gb = el.closest<HTMLElement>('[data-group]');
    if (gb) {
      const set = gb.dataset.group === 'a' ? st.act : st.exp;
      if (set.size) set.clear();
      else TYPES.forEach((t) => set.add(t));
      st.pick = null;
      return render();
    }
    const tb = el.closest<HTMLElement>('[data-gtype]');
    if (tb) {
      const [g, t] = tb.dataset.gtype!.split(':') as ['a' | 'e', Type];
      toggle(g === 'a' ? st.act : st.exp, t);
      st.pick = null;
      return render();
    }
    const all = el.closest<HTMLElement>('[data-all]');
    if (all) {
      const key = all.dataset.all as 'types' | 'trades' | 'drugs';
      const [set, items] = (key === 'types' ? [st.types, TYPES] : key === 'trades' ? [st.trades, TRADES] : [st.drugs, DRUGS]) as [Set<string>, string[]];
      if (set.size === items.length) set.clear();
      else items.forEach((v) => set.add(v));
      st.pick = null;
      return render();
    }
    const pg = el.closest<HTMLElement>('[data-page]');
    if (pg) {
      const [key, p] = pg.dataset.page!.split(':') as ['trades' | 'drugs', string];
      st.page[key] = Number(p);
      return renderNames(key);
    }
    if (el.closest('[data-unpick]')) return (st.pick = null), render();
    if (el.closest('[data-clear]')) {
      st.types = new Set(TYPES);
      st.trades = new Set(TRADES);
      st.drugs = new Set(DRUGS);
      st.states = new Set([0, 1, 2]);
      st.act = new Set(TYPES);
      st.exp = new Set(TYPES);
      Object.assign(st, DEF);
      st.pick = null;
      root.querySelectorAll<HTMLInputElement>('[data-pc-search]').forEach((i) => (i.value = ''));
      closeMenus();
      return render();
    }
    if (!el.closest('.sc__menu')) closeMenus();
  });
  root.addEventListener('change', (e) => {
    const c = e.target as HTMLInputElement;
    if (c.dataset.type) toggle(st.types, c.dataset.type as Type);
    else if (c.dataset.name) toggle(c.dataset.name === 'trades' ? st.trades : st.drugs, c.value);
    else if (c.dataset.date && c.value) st[c.dataset.date as keyof typeof DEF] = c.value;
    else return;
    st.pick = null;
    render();
  });
  root.addEventListener('input', (e) => {
    const c = e.target as HTMLInputElement;
    if (!c.dataset.pcSearch) return;
    const key = c.dataset.pcSearch as 'trades' | 'drugs';
    st.page[key] = 0;
    renderNames(key);
  });

  total = QUARTERS.length;
  render();
}

function fit(root: HTMLElement) {
  const page = root.querySelector<HTMLElement>('.sc__page');
  if (page) page.style.zoom = String(Math.max(root.clientWidth, MIN_W) / W);
}

const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((es) => es.forEach((e) => fit(e.target as HTMLElement)));

export function initPatentCharts(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-patent-chart]').forEach((el) => {
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    mount(el);
    fit(el);
    resize?.observe(el);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest?.('[data-patent-chart]')) return;
    document.querySelectorAll<HTMLElement>('[data-patent-chart] .sc__menu').forEach((m) => (m.hidden = true));
  });
}
