/**
 * Рабочий график курса акций (кейс Quantori, `StockChart.astro`) — по макетам пользователя
 * (design/cases/quantori/stock/*.svg): шапка тикера, тип графика, периоды 5D…Max, меню Revenue / Events / Tickers,
 * сравнение с индексами в процентах, события под графиком с панелью по клику, перекрестье с подсказкой,
 * объёмы и навигатор с перетаскиваемым окном. Данные придуманы (детерминированно, по зерну).
 * Разметка строится скриптом; `initStockCharts` вызывает CaseDrawer после вставки кейса.
 */

type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
type Ticker = { sym: string; name: string; color: string; start: number; drift: number; vol: number };
type Drug = { name: string; color: string; base: number; growth: number };
type EventKind = { key: string; name: string; group: string; color: string; label: string; text: string[] };

const W = 1120; // ширина макета виджета (масштабируется под окно)
const MIN_W = 760;
const PAD = 40;
const IW = W - PAD * 2;
const AXIS_R = 64;
const AXIS_L = 64;
const DAY = 86400000;
const END = Date.UTC(2023, 7, 23);
const START = Date.UTC(2013, 0, 11);

/* ---------- Данные ---------- */

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

const MAIN: Ticker = { sym: 'ABBV', name: 'AbbVie Inc.', color: '#0d69eb', start: 35, drift: 0.00055, vol: 0.016 };
const QUICK: Ticker[] = [
  { sym: 'SPY', name: 'SPDR S&P 500 ETF Trust', color: '#5a5a5a', start: 146, drift: 0.0004, vol: 0.009 },
  { sym: 'QQQ', name: 'Invesco QQQ Trust', color: '#3db24b', start: 66, drift: 0.0006, vol: 0.012 },
  { sym: 'QQQE', name: 'Nasdaq equal weighted', color: '#9cc3f0', start: 32, drift: 0.0004, vol: 0.011 },
  { sym: 'XBI', name: 'SPDR S&P Biotech ETF', color: '#f15b5b', start: 30, drift: 0.0003, vol: 0.02 },
  { sym: 'XLV', name: 'Health Care Select Sector SPDR', color: '#f2a33a', start: 41, drift: 0.0004, vol: 0.009 },
  { sym: 'XPH', name: 'SPDR S&P Pharmaceuticals ETF', color: '#e9c23f', start: 47, drift: 0.0001, vol: 0.013 },
  { sym: 'VHT', name: 'Vanguard Health Care ETF', color: '#8fc35a', start: 77, drift: 0.0004, vol: 0.009 },
];
const COMPANIES: Ticker[] = [
  ['A', 'Agilent Technologies Inc.', '#7b61ff'],
  ['AADI', 'Aadi Bioscience Inc.', '#00a3a3'],
  ['ABCL', 'AbCellera Biologics Inc.', '#c2185b'],
  ['ABEO', 'Abeona Therapeutics Inc.', '#8d6e63'],
  ['ABIO', 'ARCA biopharma Inc.', '#5c6bc0'],
  ['AMGN', 'Amgen Inc.', '#26a69a'],
  ['AZN', 'AstraZeneca PLC', '#ab47bc'],
  ['BMY', 'Bristol-Myers Squibb Co.', '#ef6c00'],
  ['GILD', 'Gilead Sciences Inc.', '#d81b60'],
  ['JNJ', 'Johnson & Johnson', '#43a047'],
  ['LLY', 'Eli Lilly and Co.', '#e53935'],
  ['MRK', 'Merck & Co. Inc.', '#00897b'],
  ['PFE', 'Pfizer Inc.', '#1e88e5'],
  ['REGN', 'Regeneron Pharmaceuticals Inc.', '#6d4c41'],
  ['VRTX', 'Vertex Pharmaceuticals Inc.', '#3949ab'],
].map(([sym, name, color], i) => ({ sym, name, color, start: 20 + i * 9, drift: 0.0002 + (i % 5) * 0.0001, vol: 0.012 + (i % 4) * 0.003 }));
const ALL = [MAIN, ...QUICK, ...COMPANIES];

/** Торговые дни Max и 5 дней внутри дня (по 5 минут). */
const days: number[] = [];
for (let t = START; t <= END; t += DAY) {
  const wd = new Date(t).getUTCDay();
  if (wd !== 0 && wd !== 6) days.push(t);
}
const intraday: number[] = [];
for (const d of days.slice(-5)) for (let m = 0; m < 78; m++) intraday.push(d + (14.5 * 60 + m * 5) * 60000);

function series(tk: Ticker, times: number[], seed: number, endPrice?: number): Bar[] {
  const r = rng(seed);
  let p = tk.start;
  const out: Bar[] = [];
  for (const t of times) {
    const ret = tk.drift + (r() - 0.5) * 2 * tk.vol + (r() < 0.01 ? (r() - 0.5) * tk.vol * 8 : 0);
    const o = p;
    p = Math.max(1, p * (1 + ret));
    const h = Math.max(o, p) * (1 + r() * tk.vol * 0.6);
    const l = Math.min(o, p) * (1 - r() * tk.vol * 0.6);
    out.push({ t, o, h, l, c: p, v: (0.6 + r() * 1.2 + (r() < 0.03 ? r() * 3 : 0)) * 1e6 });
  }
  if (endPrice) {
    const k = endPrice / out[out.length - 1].c;
    for (const b of out) {
      b.o *= k;
      b.h *= k;
      b.l *= k;
      b.c *= k;
    }
  }
  return out;
}

const cache = new Map<string, Bar[]>();
function data(tk: Ticker, intra: boolean) {
  const key = tk.sym + (intra ? ':5d' : '');
  let d = cache.get(key);
  if (!d) {
    const seed = [...tk.sym].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) + (intra ? 999 : 0);
    if (intra) {
      const lastDaily = data(tk, false);
      const close = lastDaily[lastDaily.length - 1].c;
      d = series({ ...tk, start: close, drift: 0, vol: tk.vol / 6 }, intraday, seed, tk === MAIN ? 152.83 : close);
    } else {
      d = series(tk, days, seed, tk === MAIN ? 153.6 : undefined);
    }
    cache.set(key, d);
  }
  return d;
}

const DRUGS: Drug[] = [
  ['Humira', '#1565c0', 3200, 0.04],
  ['Skyrizi', '#c6d82f', 300, 0.16],
  ['Rinvoq', '#e53935', 200, 0.17],
  ['Imbruvica', '#8e5bc8', 900, 0.05],
  ['Venclexta', '#f2a33a', 150, 0.1],
  ['Botox Therapeutic', '#26a69a', 600, 0.05],
  ['Vraylar', '#ec407a', 250, 0.11],
  ['Ubrelvy', '#8d6e63', 60, 0.13],
  ['Qulipta', '#5c6bc0', 40, 0.14],
  ['Mavyret', '#00897b', 500, 0.02],
  ['Linzess', '#fbc02d', 180, 0.04],
  ['Creon', '#6d4c41', 250, 0.04],
].map(([name, color, base, growth]) => ({ name, color, base, growth }) as Drug);
const REGIONS = ['Global', 'US', 'Rest of World'] as const;
const REGION_K = [1, 0.68, 0.32];
const REGION_DASH = ['', '6 4', '1 4'];

/** Квартальная выручка препарата по региону, млн $ (точки — середина квартала). */
function revenue(drug: number, region: number) {
  const d = DRUGS[drug];
  const r = rng(drug * 97 + region * 13 + 5);
  const out: { t: number; q: string; v: number }[] = [];
  for (let y = 2013; y <= 2023; y++) {
    for (let q = 0; q < 4; q++) {
      const t = Date.UTC(y, q * 3 + 1, 15);
      if (t > END) break;
      const n = (y - 2013) * 4 + q;
      let v = d.base * Math.pow(1 + d.growth / 4, n) * (0.9 + r() * 0.2);
      if (d.name === 'Humira' && y >= 2023) v *= 0.62;
      out.push({ t, q: `${y} - Q${q + 1}`, v: v * REGION_K[region] });
    }
  }
  return out;
}

const EVENT_KINDS: EventKind[] = [
  ['fda', 'FDA approval date', 'ABBV events', '#dd4f4f', 'Products', ['RINVOQ (UPADACITINIB) EXTENDED-RELEASE TABLETS', 'SKYRIZI (RISANKIZUMAB-RZAA) INJECTION']],
  ['ema', 'EMA approval date', 'ABBV events', '#5284cf', 'Products', ['RINVOQ 15 MG PROLONGED-RELEASE TABLETS', 'SKYRIZI 150 MG SOLUTION FOR INJECTION']],
  ['adv', 'FDA advisory meeting dates', 'ABBV events', '#72b123', 'Committee', ['Arthritis Advisory Committee', 'Oncologic Drugs Advisory Committee']],
  ['pat', 'Patent expiration date', 'ABBV events', '#dc915b', 'Products', ['HUMIRA (ADALIMUMAB) INJECTION, ABBVIE INC', 'ABACAVIR SULFATE / DOLUTEGRAVIR SODIUM / LAMIVUDINE, TRIUMEQ PD']],
  ['sfp', 'Study first post date', 'Clinical trials', '#5fbc50', 'Trial', ['NCT05720221 — Upadacitinib in giant cell arteritis', 'NCT05673512 — Risankizumab in ulcerative colitis']],
  ['lup', 'Last update post date', 'Clinical trials', '#3867a0', 'Trial', ['NCT04161898 — Navitoclax in myelofibrosis', 'NCT03104374 — Venetoclax in multiple myeloma']],
  ['sd', 'Start date', 'Clinical trials', '#9d56bf', 'Trial', ['NCT05582785 — Telisotuzumab vedotin, phase 3', 'NCT05430425 — Lutikizumab in hidradenitis']],
  ['pcd', 'Primary completion date', 'Clinical trials', '#c41d63', 'Trial', ['NCT04169373 — Upadacitinib in atopic dermatitis', 'NCT03398135 — Risankizumab in Crohn’s disease']],
  ['rfp', 'Results first post date', 'Clinical trials', '#8d6a79', 'Trial', ['NCT02675426 — Upadacitinib in rheumatoid arthritis', 'NCT03105128 — Risankizumab in psoriatic arthritis']],
  ['gen', 'Generic approved', 'Competitor events', '#6b5454', 'Generic', ['ADALIMUMAB-ADAZ (HYRIMOZ), SANDOZ INC', 'ADALIMUMAB-ATTO (AMJEVITA), AMGEN INC']],
].map(([key, name, group, color, label, text]) => ({ key, name, group, color, label, text }) as EventKind);

/** События: на дневных данных — разбросаны по годам, на 5D — по дням. */
function events(intra: boolean) {
  const r = rng(intra ? 41 : 17);
  const times = intra ? intraday : days;
  const list: { t: number; kind: EventKind; i: number }[] = [];
  const n = intra ? 40 : 160;
  for (let k = 0; k < n; k++) {
    const kind = EVENT_KINDS[Math.floor(r() * EVENT_KINDS.length)];
    const i = Math.floor(r() * times.length);
    list.push({ t: times[i], kind, i });
  }
  return list.sort((a, b) => a.t - b.t);
}

/* ---------- Состояние ---------- */

const PERIODS = ['5D', '1M', '3M', '6M', 'YTD', '1Y', '2Y', '5Y', 'Max'] as const;
type Period = (typeof PERIODS)[number];
type State = {
  period: Period | null;
  range: [number, number]; // индексы дневных данных (для 5D — внутридневных)
  type: 'Line' | 'Area' | 'Candles';
  tickers: string[];
  events: Set<string>;
  revenue: Set<string>; // "drug:region"
  hover: number | null;
  tall: boolean;
  panel: { kind: EventKind; items: { t: number }[] } | null;
};

function periodRange(p: Period): [number, number] {
  const n = days.length;
  if (p === '5D') return [0, intraday.length - 1];
  if (p === 'YTD') return [days.findIndex((t) => t >= Date.UTC(2023, 0, 1)), n - 1];
  const len = { '1M': 21, '3M': 63, '6M': 126, '1Y': 252, '2Y': 504, '5Y': 1260, Max: n } as Record<string, number>;
  return [Math.max(0, n - len[p]), n - 1];
}

/* ---------- Отрисовка ---------- */

const NS = 'http://www.w3.org/2000/svg';
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const fmt = (v: number, d = 2) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const dd = (t: number, intra = false) => {
  const d = new Date(t);
  const s = `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCFullYear()).slice(2)}`;
  return intra ? s : s;
};
const caret = '<svg width="8" height="5" viewBox="0 0 8 5"><path d="M0 0h8L4 5z" fill="currentColor"/></svg>';
const EXT =
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8.5 1.5h4v4M12.5 1.5 6.5 7.5M10.5 8.5v4h-9v-9h4"/></svg>';

function niceTicks(min: number, max: number, count = 6) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(6));
  return { ticks: out, step };
}

function mount(root: HTMLElement) {
  const st: State = {
    period: 'Max',
    range: periodRange('Max'),
    type: 'Line',
    tickers: ['SPY', 'XBI'],
    events: new Set(),
    revenue: new Set(),
    hover: null,
    tall: false,
    panel: null,
  };
  const last = data(MAIN, true);
  const close = last[last.length - 1].c; // 152.83, изменение за день — как в макете

  root.innerHTML = `
    <div class="sc__page">
      <div class="sc__head">
        <b class="sc__sym">ABBV</b>
        <div class="sc__quote">
          <div><b>${fmt(close)}</b> <span class="sc__neg">-0.77 (-0.50%)</span></div>
          <div class="sc__muted">At close: 04:03PM EST</div>
        </div>
        <span class="sc__cur">*Currency in USD</span>
      </div>
      <div class="sc__controls">
        <div class="sc__dd" data-dd="type"><span class="sc__muted-dark">Graph Type</span>
          <button type="button" class="sc__link" data-open="type"><span data-type-label>Line</span> ${caret}</button>
          <div class="sc__menu sc__menu--type" hidden>
            ${['Line', 'Area', 'Candles'].map((t) => `<button type="button" data-type="${t}">${t}</button>`).join('')}
          </div>
        </div>
        <div class="sc__periods" role="tablist">
          ${PERIODS.map((p) => `<button type="button" role="tab" data-period="${p}">${p}</button>`).join('')}
        </div>
        <div class="sc__right">
          <div class="sc__dd" data-dd="revenue">
            <button type="button" class="sc__plain" data-open="revenue">Revenue ${caret}</button>
            <div class="sc__menu sc__menu--revenue" hidden>
              <label class="sc__search"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8a8d93" stroke-width="1.4"><circle cx="6" cy="6" r="4.5"/><path d="m9.5 9.5 3 3"/></svg><input type="text" placeholder="Start typing" data-rev-search /></label>
              <div class="sc__rev-head"><span></span>${REGIONS.map((r) => `<span>${r}</span>`).join('')}</div>
              <div class="sc__rev-list">
                <div class="sc__rev-row sc__rev-row--all"><span>Select All</span>${REGIONS.map((_, j) => `<input type="checkbox" data-rev-all="${j}" />`).join('')}</div>
                ${DRUGS.map((d, i) => `<div class="sc__rev-row" data-rev-name="${esc(d.name.toLowerCase())}"><span><i style="background:${d.color}"></i>${esc(d.name)}</span>${REGIONS.map((_, j) => `<input type="checkbox" data-rev="${i}:${j}" aria-label="${esc(d.name)} ${REGIONS[j]}" />`).join('')}</div>`).join('')}
              </div>
            </div>
          </div>
          <div class="sc__dd" data-dd="events">
            <button type="button" class="sc__plain" data-open="events">Events ${caret}</button>
            <div class="sc__menu sc__menu--events" hidden>
              ${['ABBV events', 'Clinical trials', 'Competitor events']
                .map(
                  (g) =>
                    `<b>${g}</b>` +
                    EVENT_KINDS.filter((k) => k.group === g)
                      .map(
                        (k) =>
                          `<label><i style="background:${k.color}"></i><span>${k.name}</span><input type="checkbox" data-ev="${k.key}" /></label>`,
                      )
                      .join(''),
                )
                .join('')}
              <button type="button" class="sc__link sc__all" data-ev-all>Select All</button>
            </div>
          </div>
          <div class="sc__dd" data-dd="tickers">
            <button type="button" class="sc__plain" data-open="tickers">Tickers ${caret}</button>
            <div class="sc__menu sc__menu--tickers" hidden>
              <div class="sc__tk-top">
                <label class="sc__search"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8a8d93" stroke-width="1.4"><circle cx="6" cy="6" r="4.5"/><path d="m9.5 9.5 3 3"/></svg><input type="text" placeholder="Start typing" data-tk-search /></label>
                <button type="button" class="sc__link" data-tk-clear>Deselect all</button>
              </div>
              <div class="sc__quick">${QUICK.map((q) => `<button type="button" data-tk="${q.sym}" data-tip="${esc(q.name)}">+ ${q.sym}</button>`).join('')}</div>
              <div class="sc__tk-list">
                ${COMPANIES.concat([MAIN])
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(
                    (c) =>
                      `<label data-tk-name="${esc((c.name + ' ' + c.sym).toLowerCase())}" class="${c === MAIN ? 'is-main' : ''}"><span>${esc(c.name)}</span><span>${c.sym}</span><input type="checkbox" ${c === MAIN ? 'checked disabled' : `data-tk="${c.sym}"`} /></label>`,
                  )
                  .join('')}
              </div>
            </div>
          </div>
          <button type="button" class="sc__link" data-clear>Clear All</button>
        </div>
      </div>
      <div class="sc__chips" data-chips></div>
      <div class="sc__ev-legend" data-ev-legend></div>
      <div class="sc__plot-wrap">
        <svg class="sc__svg" data-svg></svg>
        <button type="button" class="sc__expand" data-expand aria-label="Expand chart">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#595959" stroke-width="1.3" stroke-linecap="round"><path d="M8.5 1.5h4v4M12.5 1.5 8 6M5.5 12.5h-4v-4M1.5 12.5 6 8"/></svg>
        </button>
        <div class="sc__ohlc" data-ohlc hidden></div>
        <div class="sc__tip" data-tip-box hidden></div>
        <div class="sc__panel" data-panel hidden></div>
      </div>
    </div>`;

  const svg = root.querySelector<SVGSVGElement>('[data-svg]')!;
  const q = <T extends Element>(s: string) => root.querySelector<T>(s)!;

  // Геометрия по состоянию
  const geom = () => {
    const hasRev = st.revenue.size > 0;
    const hasEv = st.events.size > 0;
    const x0 = hasRev ? AXIS_L : 0;
    const x1 = IW - AXIS_R;
    const plotH = st.tall ? 520 : 360;
    const top = 16;
    const xLab = top + plotH + 8;
    const evTop = xLab + 32;
    const evH = hasEv ? 50 : 0;
    const volTop = evTop + evH;
    const volH = 72;
    const navTop = volTop + volH + 12;
    const navH = 36;
    return { x0, x1, top, plotH, xLab, evTop, evH, volTop, volH, navTop, navH, height: navTop + navH + 4, hasRev, hasEv };
  };

  const isIntra = () => st.period === '5D';

  function visible() {
    const intra = isIntra();
    const [a, b] = st.range;
    const main = data(MAIN, intra).slice(a, b + 1);
    const others = st.tickers.map((s) => ALL.find((t) => t.sym === s)!).map((tk) => ({ tk, bars: data(tk, intra).slice(a, b + 1) }));
    return { intra, main, others };
  }

  function render() {
    const g = geom();
    const { intra, main, others } = visible();
    const compare = others.length > 0;
    const n = main.length;
    svg.setAttribute('viewBox', `0 0 ${IW} ${g.height}`);
    svg.setAttribute('width', String(IW));
    svg.setAttribute('height', String(g.height));
    const X = (i: number) => g.x0 + (n <= 1 ? 0 : (i / (n - 1)) * (g.x1 - g.x0));

    // Значения линий: цена или % от начала периода
    const val = (bars: Bar[]) => (compare ? bars.map((b) => ((b.c - bars[0].c) / bars[0].c) * 100) : bars.map((b) => b.c));
    const lines = [{ tk: MAIN, v: val(main), bars: main }, ...others.map((o) => ({ tk: o.tk, v: val(o.bars), bars: o.bars }))];
    let lo = Infinity;
    let hi = -Infinity;
    for (const l of lines) for (const v of l.v) (lo = Math.min(lo, v)), (hi = Math.max(hi, v));
    if (st.type === 'Candles' && !compare) for (const b of main) (lo = Math.min(lo, b.l)), (hi = Math.max(hi, b.h));
    const padY = (hi - lo) * 0.08 || 1;
    lo -= padY;
    hi += padY;
    const { ticks } = niceTicks(lo, hi, 7);
    const Y = (v: number) => g.top + g.plotH - ((v - lo) / (hi - lo)) * g.plotH;

    let s = '';
    // Полосы-фон по датам (через одну) и подписи оси X
    const labelsN = 8;
    for (let k = 0; k < labelsN; k++) {
      const i0 = Math.round((k / labelsN) * (n - 1));
      const i1 = Math.round(((k + 1) / labelsN) * (n - 1));
      if (k % 2 === 1) s += `<rect x="${X(i0)}" y="${g.top}" width="${X(i1) - X(i0)}" height="${g.plotH}" fill="#f8fbfe"/>`;
    }
    // Подписи оси X: на 5D — по одной на день (начало торгов), иначе — равномерно
    const marks = intra
      ? main.map((b, i) => i).filter((i) => i === 0 || new Date(main[i].t).getUTCDate() !== new Date(main[i - 1].t).getUTCDate())
      : Array.from({ length: labelsN + 1 }, (_, k) => Math.round((k / labelsN) * (n - 1)));
    marks.forEach((i, k) => {
      const anchor = k === 0 ? 'start' : !intra && k === marks.length - 1 ? 'end' : intra ? 'start' : 'middle';
      s += `<line x1="${X(i)}" x2="${X(i)}" y1="${g.top + g.plotH}" y2="${g.top + g.plotH + 5}" stroke="#b6b8bb"/>`;
      s += `<text x="${X(i) + (intra ? 4 : 0)}" y="${g.xLab + 14}" text-anchor="${anchor}" class="sc__ax">${dd(main[i].t)}</text>`;
    });
    // Сетка и правая ось
    for (const t of ticks) {
      const y = Y(t);
      s += `<line x1="${g.x0}" x2="${g.x1}" y1="${y}" y2="${y}" stroke="#ececee"/>`;
      s += `<text x="${g.x1 + 10}" y="${y + 4}" class="sc__ax">${compare ? `${fmt(t, 1)} %` : fmt(t)}</text>`;
    }
    s += `<line x1="${g.x0}" x2="${g.x1}" y1="${g.top + g.plotH}" y2="${g.top + g.plotH}" stroke="#b6b8bb"/>`;

    // Выручка (левая ось)
    const revLines: { label: string; region: string; color: string; pts: { x: number; y: number; q: string; v: number }[] }[] = [];
    if (g.hasRev) {
      const t0 = main[0].t;
      const t1 = main[n - 1].t;
      const sets = [...st.revenue].map((k) => k.split(':').map(Number)).map(([d, r]) => ({ d, r, pts: revenue(d, r).filter((p) => p.t >= t0 && p.t <= t1) }));
      let rmax = 0;
      for (const set of sets) for (const p of set.pts) rmax = Math.max(rmax, p.v);
      const rt = niceTicks(0, rmax * 1.1 || 1000, 6).ticks;
      const rtop = rt[rt.length - 1] || 1;
      const RY = (v: number) => g.top + g.plotH - (v / rtop) * g.plotH;
      const tx = (t: number) => g.x0 + ((t - t0) / (t1 - t0 || 1)) * (g.x1 - g.x0);
      if (rmax > 0) {
        for (const t of rt) s += `<text x="${g.x0 - 10}" y="${RY(t) + 4}" text-anchor="end" class="sc__ax">${fmt(t, 0)}</text>`;
        s += `<text transform="translate(14 ${g.top + g.plotH / 2}) rotate(-90)" text-anchor="middle" class="sc__ax sc__ax--small">Quarterly sales USD (in millions)</text>`;
      }
      for (const set of sets) {
        const drug = DRUGS[set.d];
        const pts = set.pts.map((p) => ({ x: tx(p.t), y: RY(p.v), q: p.q, v: p.v }));
        revLines.push({ label: drug.name, region: REGIONS[set.r], color: drug.color, pts });
        if (pts.length > 1)
          s += `<polyline points="${pts.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${drug.color}" stroke-width="1.6" stroke-dasharray="${REGION_DASH[set.r]}" opacity="0.9"/>`;
        for (const p of pts) s += `<rect x="${p.x - 3}" y="${p.y - 3}" width="6" height="6" fill="${drug.color}"/>`;
      }
      if (!sets.some((x) => x.pts.length))
        s += `<text x="${(g.x0 + g.x1) / 2}" y="${g.top + 24}" text-anchor="middle" class="sc__ax">No quarterly revenue in this period — choose a longer one</text>`;
    }

    // Линии цены
    const path = (v: number[]) => v.map((y, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(y).toFixed(1)}`).join('');
    if (st.type === 'Candles' && !compare) {
      const step = Math.max(1, Math.ceil(n / 120));
      const w = Math.max(1, ((g.x1 - g.x0) / Math.ceil(n / step)) * 0.6);
      for (let i = 0; i < n; i += step) {
        const chunk = main.slice(i, i + step);
        const o = chunk[0].o;
        const c = chunk[chunk.length - 1].c;
        const h = Math.max(...chunk.map((b) => b.h));
        const l = Math.min(...chunk.map((b) => b.l));
        const x = X(Math.min(n - 1, i + (chunk.length - 1) / 2));
        const col = c >= o ? '#3db24b' : '#f15b5b';
        s += `<line x1="${x}" x2="${x}" y1="${Y(h)}" y2="${Y(l)}" stroke="${col}"/><rect x="${x - w / 2}" y="${Math.min(Y(o), Y(c))}" width="${w}" height="${Math.max(1, Math.abs(Y(o) - Y(c)))}" fill="${col}"/>`;
      }
    } else {
      for (const l of [...lines].reverse()) {
        if (st.type === 'Area' && l.tk === MAIN)
          s += `<path d="${path(l.v)}L${X(n - 1)} ${g.top + g.plotH}L${X(0)} ${g.top + g.plotH}Z" fill="${l.tk.color}" opacity="0.1"/>`;
        s += `<path d="${path(l.v)}" fill="none" stroke="${l.tk.color}" stroke-width="${l.tk === MAIN ? 1.6 : 1.3}" stroke-linejoin="round"/>`;
      }
    }

    // События: квадраты по столбцам
    const evCols: { x: number; items: { kind: EventKind; t: number }[] }[] = [];
    if (g.hasEv) {
      const t0 = main[0].t;
      const t1 = main[n - 1].t;
      const list = events(intra).filter((e) => st.events.has(e.kind.key) && e.t >= t0 && e.t <= t1);
      const colW = 120;
      for (const e of list) {
        const x = g.x0 + ((e.t - t0) / (t1 - t0 || 1)) * (g.x1 - g.x0);
        const col = Math.floor((x - g.x0) / colW);
        let c = evCols.find((cc) => Math.floor((cc.x - g.x0) / colW) === col);
        if (!c) evCols.push((c = { x: g.x0 + col * colW + colW / 2, items: [] }));
        c.items.push({ kind: e.kind, t: e.t });
      }
      for (const c of evCols) {
        const kinds = EVENT_KINDS.filter((k) => c.items.some((it) => it.kind === k));
        const perRow = 5;
        kinds.forEach((k, j) => {
          const row = Math.floor(j / perRow);
          const inRow = Math.min(perRow, kinds.length - row * perRow);
          const x = c.x - (inRow * 22) / 2 + (j % perRow) * 22;
          const y = g.evTop + 2 + row * 22;
          const count = c.items.filter((it) => it.kind === k).length;
          s += `<g class="sc__ev" data-ev-col="${evCols.indexOf(c)}" data-ev-kind="${k.key}" tabindex="0" role="button" aria-label="${esc(k.name)}: ${count}"><rect x="${x}" y="${y}" width="18" height="18" rx="3" fill="${k.color}"/><text x="${x + 9}" y="${y + 13}" text-anchor="middle" class="sc__ev-n">${count}</text></g>`;
        });
      }
    }

    // Объёмы
    const vmax = Math.max(...main.map((b) => b.v));
    const bw = Math.max(1, ((g.x1 - g.x0) / n) * 0.7);
    for (let i = 0; i < n; i++) {
      const b = main[i];
      const h = (b.v / vmax) * (g.volH - 6);
      s += `<rect x="${X(i) - bw / 2}" y="${g.volTop + g.volH - h}" width="${bw}" height="${h}" fill="${b.c >= b.o ? '#3db24b' : '#f15b5b'}" opacity="0.7"/>`;
    }
    for (let k = 1; k <= 5; k++) {
      const y = g.volTop + g.volH - (k / 5) * (g.volH - 6);
      s += `<text x="${g.x1 + 10}" y="${y + 4}" class="sc__ax sc__ax--small">${k} M</text>`;
    }
    s += `<line x1="${g.x0}" x2="${g.x1}" y1="${g.volTop + g.volH}" y2="${g.volTop + g.volH}" stroke="#dfdddf"/>`;

    // Навигатор: вся история, окно периода
    const full = data(MAIN, false);
    const NX = (i: number) => g.x0 + (i / (full.length - 1)) * (g.x1 - g.x0);
    const fl = Math.min(...full.map((b) => b.c));
    const fh = Math.max(...full.map((b) => b.c));
    const NY = (v: number) => g.navTop + g.navH - 4 - ((v - fl) / (fh - fl)) * (g.navH - 10);
    let np = '';
    for (let i = 0; i < full.length; i += 4) np += `${i ? 'L' : 'M'}${NX(i).toFixed(1)} ${NY(full[i].c).toFixed(1)}`;
    s += `<rect x="${g.x0}" y="${g.navTop}" width="${g.x1 - g.x0}" height="${g.navH}" fill="#f5f7fa" stroke="#dfdddf"/>`;
    s += `<path d="${np}L${g.x1} ${g.navTop + g.navH}L${g.x0} ${g.navTop + g.navH}Z" fill="#dfe8f6"/><path d="${np}" fill="none" stroke="#a9bfe0"/>`;
    const [wa, wb] = intra ? [full.length - 5, full.length - 1] : st.range;
    const wx0 = NX(wa);
    const wx1 = Math.max(NX(wb), wx0 + 6);
    s += `<rect class="sc__nav-win" data-nav="move" x="${wx0}" y="${g.navTop}" width="${wx1 - wx0}" height="${g.navH}" fill="rgb(13 105 235 / 0.12)" stroke="#0d69eb"/>`;
    s += `<rect class="sc__nav-h" data-nav="a" x="${wx0 - 4}" y="${g.navTop + 8}" width="8" height="${g.navH - 16}" rx="3" fill="#fff" stroke="#0d69eb"/>`;
    s += `<rect class="sc__nav-h" data-nav="b" x="${wx1 - 4}" y="${g.navTop + 8}" width="8" height="${g.navH - 16}" rx="3" fill="#fff" stroke="#0d69eb"/>`;

    // Слой наведения
    s += `<g data-hover></g><rect data-hit x="${g.x0}" y="${g.top}" width="${g.x1 - g.x0}" height="${g.plotH}" fill="transparent"/>`;
    svg.innerHTML = s;
    Object.assign(svg, { __ctx: { g, X, Y, lines, main, compare, revLines, evCols, intra, n } });

    // Чипсы (значения — на конце периода или под курсором)
    renderChips();
    // Легенда событий
    q<HTMLElement>('[data-ev-legend]').innerHTML = EVENT_KINDS.filter((k) => st.events.has(k.key))
      .map((k) => `<span><i style="background:${k.color}"></i>${k.name}<button type="button" data-ev-off="${k.key}" aria-label="Remove">×</button></span>`)
      .join('');
    // Состояние элементов управления
    root.querySelectorAll<HTMLElement>('[data-period]').forEach((b) => b.classList.toggle('is-active', b.dataset.period === st.period));
    q<HTMLElement>('[data-type-label]').textContent = st.type;
    root.querySelectorAll<HTMLInputElement>('input[data-ev]').forEach((c) => (c.checked = st.events.has(c.dataset.ev!)));
    root.querySelectorAll<HTMLInputElement>('input[data-tk]').forEach((c) => (c.checked = st.tickers.includes(c.dataset.tk!)));
    root.querySelectorAll<HTMLElement>('.sc__quick [data-tk]').forEach((b) => b.classList.toggle('is-on', st.tickers.includes(b.dataset.tk!)));
    root.querySelectorAll<HTMLInputElement>('input[data-rev]').forEach((c) => (c.checked = st.revenue.has(c.dataset.rev!)));
    REGIONS.forEach((_, j) => {
      const all = root.querySelector<HTMLInputElement>(`[data-rev-all="${j}"]`)!;
      all.checked = DRUGS.every((_, i) => st.revenue.has(`${i}:${j}`));
    });
    const evAll = q<HTMLElement>('[data-ev-all]');
    evAll.textContent = st.events.size === EVENT_KINDS.length ? 'Deselect All' : 'Select All';
    root.querySelector('[data-open="revenue"]')!.classList.toggle('is-on', st.revenue.size > 0);
    root.querySelector('[data-open="events"]')!.classList.toggle('is-on', st.events.size > 0);
    root.querySelector('[data-open="tickers"]')!.classList.toggle('is-on', st.tickers.length > 0);
    renderPanel();
    renderHover();
  }

  function renderChips() {
    const c = (svg as any).__ctx;
    if (!c) return;
    const i = st.hover ?? c.n - 1;
    q<HTMLElement>('[data-chips]').innerHTML = c.lines
      .map((l: any) => {
        const b: Bar = l.bars[i];
        const ch = ((b.c - l.bars[0].c) / l.bars[0].c) * 100;
        return `<span class="sc__chip" style="--c:${l.tk.color}"><b>${l.tk.sym}</b><span>${fmt(b.c)}</span><span class="${ch < 0 ? 'sc__neg' : ''}">${fmt(ch)} %</span>${
          l.tk === MAIN ? '' : `<button type="button" data-tk-off="${l.tk.sym}" aria-label="Remove ${l.tk.sym}">×</button>`
        }</span>`;
      })
      .join('');
  }

  function renderHover() {
    const c = (svg as any).__ctx;
    const layer = svg.querySelector('[data-hover]');
    const ohlc = q<HTMLElement>('[data-ohlc]');
    if (!c || !layer) return;
    if (st.hover == null) {
      layer.innerHTML = '';
      ohlc.hidden = true;
      return;
    }
    const { g, X, Y, lines, main, compare } = c;
    const i = st.hover;
    const x = X(i);
    let s = `<line x1="${x}" x2="${x}" y1="${g.top}" y2="${g.volTop + g.volH}" stroke="#383a3e" stroke-dasharray="4 3"/>`;
    const y = Y(lines[0].v[i]);
    s += `<line x1="${g.x0}" x2="${g.x1}" y1="${y}" y2="${y}" stroke="#383a3e" stroke-dasharray="4 3"/>`;
    for (const l of lines) s += `<circle cx="${x}" cy="${Y(l.v[i])}" r="4" fill="${l.tk === MAIN ? '#383a3e' : l.tk.color}" stroke="#fff" stroke-width="1.5"/>`;
    const label = compare ? `${fmt(lines[0].v[i])} %` : fmt(lines[0].v[i]);
    s += `<rect x="${g.x1 + 2}" y="${y - 11}" width="56" height="22" rx="3" fill="#383a3e"/><text x="${g.x1 + 30}" y="${y + 4}" text-anchor="middle" class="sc__ax sc__ax--inv">${label}</text>`;
    layer.innerHTML = s;
    const b: Bar = main[i];
    const ch = ((b.c - main[0].c) / main[0].c) * 100;
    ohlc.innerHTML = `<div class="sc__ohlc-date">${dd(b.t)}</div>${[
      ['Open', fmt(b.o)],
      ['High', fmt(b.h)],
      ['Low', fmt(b.l)],
      ['Close', fmt(b.c)],
      ['Volume', `${fmt(b.v / 1e6)}M`],
      ['% Change', `${fmt(ch)}%`],
    ]
      .map(([k, v]) => `<div><span>${k}</span><i>→</i><b>${v}</b></div>`)
      .join('')}`;
    ohlc.style.left = `${g.x0 + 48}px`;
    ohlc.style.top = `${g.top + 12}px`;
    ohlc.hidden = false;
  }

  function renderPanel() {
    const panel = q<HTMLElement>('[data-panel]');
    const c = (svg as any).__ctx;
    if (!st.panel || !c) {
      panel.hidden = true;
      return;
    }
    const { kind, items } = st.panel;
    const { g } = c;
    panel.style.left = `${g.x0}px`;
    panel.style.top = `${g.top}px`;
    panel.style.height = `${g.navTop + g.navH - g.top}px`;
    panel.innerHTML = `<div class="sc__panel-head"><i style="background:${kind.color}"></i><b>${esc(kind.name)}</b><button type="button" data-panel-close aria-label="Close"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 1l12 12M13 1 1 13" stroke="#383A3E" stroke-width="1.5"/></svg></button></div><div class="sc__panel-list">${items
      .map(
        (it, k) =>
          `<div><div class="sc__panel-date">${new Date(it.t).toISOString().slice(0, 10)} <a href="#" data-noop aria-label="Open source">${EXT}</a></div><strong>${kind.label}:</strong> ${esc(kind.text[k % kind.text.length])}</div>`,
      )
      .join('')}</div>`;
    panel.hidden = false;
  }

  /* ---------- Тултип ---------- */
  const tipBox = q<HTMLElement>('[data-tip-box]');
  const showTip = (html: string, x: number, y: number) => {
    tipBox.innerHTML = html;
    tipBox.hidden = false;
    const w = tipBox.offsetWidth;
    tipBox.style.left = `${Math.min(Math.max(0, x - w / 2), IW - w)}px`;
    tipBox.style.top = `${y - tipBox.offsetHeight - 10}px`;
  };
  const hideTip = () => (tipBox.hidden = true);

  /* ---------- События мыши ---------- */
  const zoom = () => Number((root.querySelector('.sc__page') as HTMLElement).style.zoom) || 1;
  const local = (e: PointerEvent | MouseEvent) => {
    const r = svg.getBoundingClientRect();
    const z = zoom();
    return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z };
  };

  svg.addEventListener('pointermove', (e) => {
    const c = (svg as any).__ctx;
    if (!c || drag) return;
    const p = local(e);
    const { g, n, revLines } = c;
    // Точка выручки под курсором — её подсказка
    for (const l of revLines)
      for (const pt of l.pts)
        if (Math.abs(pt.x - p.x) < 7 && Math.abs(pt.y - p.y) < 7) {
          showTip(`<b>${pt.q}</b><span>${l.region}</span><b>${esc(l.label)}</b><span class="sc__tip-row"><i style="background:${l.color}"></i>$${fmt(pt.v, 1)} M</span>`, pt.x, pt.y);
          return;
        }
    hideTip();
    if (p.x >= g.x0 && p.x <= g.x1 && p.y >= g.top && p.y <= g.volTop + g.volH) {
      const i = Math.round(((p.x - g.x0) / (g.x1 - g.x0)) * (n - 1));
      if (i !== st.hover) {
        st.hover = Math.max(0, Math.min(n - 1, i));
        renderHover();
        renderChips();
      }
    } else if (st.hover != null) {
      st.hover = null;
      renderHover();
      renderChips();
    }
  });
  svg.addEventListener('pointerleave', () => {
    st.hover = null;
    hideTip();
    renderHover();
    renderChips();
  });

  // Навигатор: перетаскивание окна и краёв
  let drag: { mode: string; x: number; range: [number, number] } | null = null;
  svg.addEventListener('pointerdown', (e) => {
    const t = (e.target as Element).closest<SVGElement>('[data-nav]');
    if (!t) return;
    e.preventDefault();
    if (isIntra()) {
      st.period = '1M';
      st.range = periodRange('1M');
    }
    drag = { mode: t.dataset.nav!, x: local(e).x, range: [...st.range] as [number, number] };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const c = (svg as any).__ctx;
    const per = (days.length - 1) / (c.g.x1 - c.g.x0);
    const di = Math.round((local(e).x - drag.x) * per);
    let [a, b] = drag.range;
    if (drag.mode === 'move') {
      const len = b - a;
      a = Math.max(0, Math.min(days.length - 1 - len, a + di));
      b = a + len;
    } else if (drag.mode === 'a') a = Math.max(0, Math.min(b - 5, a + di));
    else b = Math.min(days.length - 1, Math.max(a + 5, b + di));
    st.range = [a, b];
    st.period = null;
    st.panel = null;
    render();
  });
  svg.addEventListener('lostpointercapture', () => (drag = null));

  /* ---------- Клики ---------- */
  const closeMenus = (except?: Element | null) =>
    root.querySelectorAll<HTMLElement>('.sc__menu').forEach((m) => {
      if (m !== except) m.hidden = true;
    });
  root.addEventListener('click', (e) => {
    const el = e.target as Element;
    const open = el.closest<HTMLElement>('[data-open]');
    if (open) {
      const menu = open.parentElement!.querySelector<HTMLElement>('.sc__menu')!;
      closeMenus(menu);
      menu.hidden = !menu.hidden;
      return;
    }
    if (el.closest('[data-noop]')) {
      e.preventDefault();
      return;
    }
    const type = el.closest<HTMLElement>('[data-type]');
    if (type) {
      st.type = type.dataset.type as State['type'];
      closeMenus();
      render();
      return;
    }
    const per = el.closest<HTMLElement>('[data-period]');
    if (per) {
      st.period = per.dataset.period as Period;
      st.range = periodRange(st.period);
      st.panel = null;
      render();
      return;
    }
    const quick = el.closest<HTMLElement>('.sc__quick [data-tk]');
    if (quick) {
      toggleTicker(quick.dataset.tk!);
      return;
    }
    const tkOff = el.closest<HTMLElement>('[data-tk-off]');
    if (tkOff) {
      toggleTicker(tkOff.dataset.tkOff!);
      return;
    }
    if (el.closest('[data-tk-clear]')) {
      st.tickers = [];
      render();
      return;
    }
    const evOff = el.closest<HTMLElement>('[data-ev-off]');
    if (evOff) {
      st.events.delete(evOff.dataset.evOff!);
      if (st.panel?.kind.key === evOff.dataset.evOff) st.panel = null;
      render();
      return;
    }
    if (el.closest('[data-ev-all]')) {
      if (st.events.size === EVENT_KINDS.length) st.events.clear();
      else EVENT_KINDS.forEach((k) => st.events.add(k.key));
      st.panel = null;
      render();
      return;
    }
    if (el.closest('[data-clear]')) {
      st.tickers = [];
      st.events.clear();
      st.revenue.clear();
      st.panel = null;
      closeMenus();
      render();
      return;
    }
    if (el.closest('[data-expand]')) {
      st.tall = !st.tall;
      render();
      return;
    }
    if (el.closest('[data-panel-close]')) {
      st.panel = null;
      renderPanel();
      return;
    }
    const ev = el.closest<SVGElement>('[data-ev-kind]');
    if (ev) {
      const c = (svg as any).__ctx;
      const col = c.evCols[Number(ev.dataset.evCol)];
      const kind = EVENT_KINDS.find((k) => k.key === ev.dataset.evKind)!;
      st.panel = { kind, items: col.items.filter((it: { kind: EventKind }) => it.kind === kind) };
      renderPanel();
      return;
    }
    if (!el.closest('.sc__menu')) closeMenus();
  });

  root.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.dataset.ev) {
      if (el.checked) st.events.add(el.dataset.ev);
      else st.events.delete(el.dataset.ev);
      render();
    } else if (el.dataset.tk) {
      toggleTicker(el.dataset.tk);
    } else if (el.dataset.rev) {
      if (el.checked) st.revenue.add(el.dataset.rev);
      else st.revenue.delete(el.dataset.rev);
      render();
    } else if (el.dataset.revAll) {
      DRUGS.forEach((_, i) => (el.checked ? st.revenue.add(`${i}:${el.dataset.revAll}`) : st.revenue.delete(`${i}:${el.dataset.revAll}`)));
      render();
    }
  });

  root.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    const v = el.value.trim().toLowerCase();
    if (el.matches('[data-tk-search]'))
      root.querySelectorAll<HTMLElement>('[data-tk-name]').forEach((r) => (r.hidden = !!v && !r.dataset.tkName!.includes(v)));
    if (el.matches('[data-rev-search]'))
      root.querySelectorAll<HTMLElement>('[data-rev-name]').forEach((r) => (r.hidden = !!v && !r.dataset.revName!.includes(v)));
  });

  // Подсказки быстрых тикеров
  root.addEventListener('pointerover', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.sc__quick [data-tip]');
    const menu = b?.closest<HTMLElement>('.sc__menu');
    const tip = root.querySelector<HTMLElement>('.sc__qtip') ?? Object.assign(document.createElement('div'), { className: 'sc__qtip' });
    if (!b || !menu) {
      tip.remove();
      return;
    }
    tip.textContent = b.dataset.tip!;
    menu.append(tip);
    tip.style.left = `${b.offsetLeft + b.offsetWidth / 2 - tip.offsetWidth / 2}px`;
    tip.style.top = `${b.offsetTop - tip.offsetHeight - 8}px`;
  });

  function toggleTicker(sym: string) {
    st.tickers = st.tickers.includes(sym) ? st.tickers.filter((s) => s !== sym) : [...st.tickers, sym];
    render();
  }

  render();
  return render;
}

/* ---------- Масштаб и запуск ---------- */

function fit(root: HTMLElement) {
  const page = root.querySelector<HTMLElement>('.sc__page');
  if (page) page.style.zoom = String(Math.max(root.clientWidth, MIN_W) / W);
}

const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((es) => es.forEach((e) => fit(e.target as HTMLElement)));

export function initStockCharts(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-stock-chart]').forEach((el) => {
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    mount(el);
    fit(el);
    resize?.observe(el);
  });
}

if (typeof document !== 'undefined') {
  // Клик мимо меню графика — закрыть их
  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest?.('[data-stock-chart]')) return;
    document.querySelectorAll<HTMLElement>('[data-stock-chart] .sc__menu').forEach((m) => (m.hidden = true));
  });
}
export { NS };
