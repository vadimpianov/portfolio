/**
 * Живые экраны кейса Skyway (`src/components/case/skyway/Skyway.astro`) — логика со страницы пользователя
 * «Skyway Tickets»: выдача с переключателем багажа, тарифы, карта мест, оформление с проверкой паспорта,
 * слайдер экранов. Разметка кейса вставляется в модалку готовой, поэтому всё ищем внутри своего блока.
 */
import { COPY } from '../components/case/skyway/copy';

type FareKey = 'lite' | 'std' | 'flex';

export function initSkyway(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-skyway]:not([data-ready])').forEach(setup);
}

function setup(el: HTMLElement) {
  el.dataset.ready = '';
  const lang = el.dataset.lang === 'en' ? 'en' : 'ru';
  const c = COPY[lang];
  const $ = <T extends HTMLElement = HTMLElement>(k: string) => el.querySelector<T>(`[data-k="${k}"]`)!;
  const fmt = (n: number) => n.toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU').replace(/\s/g, ' ');
  const PAX = 2;
  const FARES: Record<FareKey, { p: number; bag: boolean; xlFree: boolean }> = {
    lite: { p: 5990, bag: false, xlFree: false },
    std: { p: 7340, bag: true, xlFree: false },
    flex: { p: 10900, bag: true, xlFree: true },
  };
  const S = {
    why: false,
    follow: false,
    bag: false,
    fare: 'std' as FareKey,
    seats: ['7C', null] as (string | null)[],
    active: 1,
    ins: false,
    brk: false,
  };

  /* ---------- 1. выдача ---------- */
  $('dates').innerHTML = c.days
    .map(([w, d, p, min, on]) => `<div class="day${min ? ' min' : ''}${on ? ' on' : ''}" data-min="${c.dayMin}"><small>${w}</small><b>${d}</b><span>${p}</span></div>`)
    .join('');
  const days = [...el.querySelectorAll<HTMLElement>('.day')];
  days.forEach((d) => (d.onclick = () => days.forEach((x) => x.classList.toggle('on', x === d))));

  const FLIGHTS = [
    { code: 'AN', col: '#2f5bea', dep: '06:40', from: 'SVO', arr: '09:25', to: 'AER', min: 165, nb: 5990, b: 7340 },
    { code: lang === 'en' ? 'VT' : 'ВТ', col: '#e0457b', dep: '07:55', from: 'VKO', arr: '10:45', to: 'AER', min: 170, nb: 3990, b: 7590, hand: true },
    { code: lang === 'en' ? 'YG' : 'ЮГ', col: '#f08c00', dep: '22:10', from: 'DME', arr: '05:30', arrDay: true, to: 'AER', min: 440, nb: 4850, b: 8900, self: true },
    { code: 'AN', col: '#2f5bea', dep: '11:05', from: 'SVO', arr: '13:35', to: 'AER', min: 150, nb: 6790, b: 8140 },
  ].map((f, i) => ({ ...f, name: c.airlines[i]!, dur: c.durations[i]! }));
  type Flight = (typeof FLIGHTS)[number];

  function renderFlights() {
    const price = (f: Flight) => (S.bag ? f.b : f.nb);
    const cheapest = FLIGHTS.reduce((a, f) => (price(f) < price(a) ? f : a));
    const fastest = FLIGHTS.reduce((a, f) => (f.min < a.min ? f : a));
    const best = FLIGHTS.filter((f) => !f.self).reduce((a, f) => (price(f) + f.min * 20 < price(a) + a.min * 20 ? f : a));
    const list = [best, ...FLIGHTS.filter((f) => f !== best).sort((a, b) => price(a) - price(b))];
    $('bagsub').textContent = S.bag ? c.bagOn : c.bagOff;
    $('flights').innerHTML = list
      .map((f) => {
        const tags: string[] = [];
        if (f === best) tags.push(`<span class="tag a" data-why role="button" tabindex="0" aria-expanded="${S.why}">${c.tagBest}</span>`);
        if (f === cheapest) tags.push(`<span class="tag g">${c.tagCheap}</span>`);
        if (f === fastest) tags.push(`<span class="tag s">${c.tagFast}</span>`);
        if (f.self) tags.push(`<span class="tag w">${c.tagSelf}</span>`);
        tags.push(`<span class="tag m">${S.bag ? c.tagBag : c.tagNoBag}</span>`);
        return `<div class="flight${f === best ? ' best' : ''}">
          <div class="tags">${tags.join('')}</div>
          ${f === best && S.why ? `<div class="why">${c.why}</div>` : ''}
          <div class="leg">
            <div class="t"><b>${f.dep}</b><small>${f.from}</small></div>
            <div class="mid">${f.dur}<div class="line">${f.self ? '<i></i>' : ''}</div>${f.self ? `<span class="warn">${c.selfStop}</span>` : c.direct}</div>
            <div class="t"><b>${f.arr}</b><small>${f.to}${f.arrDay ? `<br><span class="arr-day">${c.arrDay}</span>` : ''}</small></div>
          </div>
          ${f.hand ? `<div class="alert">🎒 ${c.hand}</div>` : ''}
          ${f.self ? `<div class="alert">${c.selfAlert}</div>` : ''}
          <div class="foot">
            <div class="air"><i style="background:${f.col}">${f.code}</i>${f.name}</div>
            <div class="price">${fmt(price(f))} ₽<small>${c.forTwo(fmt(price(f) * PAX))}</small></div>
          </div></div>`;
      })
      .join('');
  }
  $('bagsw').onclick = () => {
    S.bag = !S.bag;
    $('bagsw').classList.toggle('on', S.bag);
    renderFlights();
  };
  const toggleWhy = (e: Event) => {
    if ((e.target as Element).closest('[data-why]')) {
      S.why = !S.why;
      renderFlights();
    }
  };
  $('flights').onclick = toggleWhy;
  $('flights').onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') toggleWhy(e);
  };
  $('follow').onclick = () => {
    S.follow = !S.follow;
    $('follow').classList.toggle('on', S.follow);
    $('follow').textContent = S.follow ? c.followOn : c.follow;
  };

  /* ---------- 2. тарифы ---------- */
  const KEYS: FareKey[] = ['lite', 'std', 'flex'];
  function renderFares() {
    const sel = (k: FareKey) => (k === S.fare ? ' sel' : '');
    const yes = '<span class="yes">✓</span>';
    const rows: [string, (k: FareKey) => string][] = [
      [c.fareRows[0]!, () => yes],
      [c.fareRows[1]!, (k) => (FARES[k].bag ? yes : '<span class="no">—</span>')],
      [c.fareRows[2]!, (k) => (FARES[k].xlFree ? yes : `<span class="cost">${fmt(900)} ₽</span>`)],
      [c.fareRows[3]!, (k) => `<span class="cost">${c.fareChange[k]}</span>`],
      [c.fareRows[4]!, (k) => `<span class="${k === 'flex' ? 'yes' : 'cost'}">${c.fareRefund[k]}</span>`],
    ];
    let h = '<div class="c l h"></div>' + KEYS.map((k) => `<div class="c h${sel(k)}" data-f="${k}">${c.fares[k]}</div>`).join('');
    rows.forEach(([lab, fn]) => {
      h += `<div class="c l">${lab}</div>` + KEYS.map((k) => `<div class="c${sel(k)}" data-f="${k}">${fn(k)}</div>`).join('');
    });
    const diff = (k: FareKey) =>
      k === 'std' ? '' : `${FARES[k].p > FARES.std.p ? '+' : '−'}${fmt(Math.abs(FARES[k].p - FARES.std.p))} ₽`;
    h +=
      `<div class="c l p">${c.perPax}</div>` +
      KEYS.map((k) => `<div class="c p${sel(k)}" data-f="${k}">${fmt(FARES[k].p)} ₽<small>${diff(k)}</small></div>`).join('');
    $('fares').innerHTML = h;
    $('fares')
      .querySelectorAll<HTMLElement>('[data-f]')
      .forEach(
        (cell) =>
          (cell.onclick = () => {
            S.fare = cell.dataset.f as FareKey;
            renderAll();
          }),
      );
    $('ftip').innerHTML = S.fare === 'flex' ? c.tips.flex(fmt(FARES.flex.p - FARES.std.p)) : c.tips[S.fare];
    $('f-sum').textContent = c.paxFare(c.fares[S.fare]);
    $('f-tot').innerHTML = `${fmt(FARES[S.fare].p * PAX)} ₽<em>${c.forTwoShort}</em>`;
    $('f-go').textContent = c.goFare(c.fares[S.fare]);
  }

  /* ---------- 3. места ---------- */
  const ROWS = 8;
  const COLS = 'ABCDEF';
  const taken = new Set(['1A', '1B', '2A', '2E', '3C', '3D', '3F', '4A', '4F', '5B', '5C', '6D', '6E', '7A', '7E', '8C', '8D', '8F']);
  const isXL = (r: number) => r <= 2 || r === 6;
  const rowOf = (id: string) => Number(id.slice(0, -1));
  const seatCost = (id: string | null) => (id && isXL(rowOf(id)) && !FARES[S.fare].xlFree ? 900 : 0);
  const isFree = (id: string) => !taken.has(id) && !S.seats.includes(id);
  const neighbours = (id: string) => {
    const r = rowOf(id);
    const col = COLS.indexOf(id.slice(-1));
    const side = col < 3 ? [0, 1, 2] : [3, 4, 5];
    return [col - 1, col + 1].filter((x) => side.includes(x)).map((x) => r + COLS[x]!);
  };
  const adjacent = (a: string | null, b: string | null) => !!a && !!b && neighbours(a).includes(b);
  function findPair() {
    for (let r = 1; r <= ROWS; r++) {
      if (isXL(r)) continue;
      for (const [a, b] of [['B', 'C'], ['D', 'E'], ['A', 'B'], ['E', 'F']] as const)
        if (isFree(r + a) && isFree(r + b)) return [r + a, r + b];
    }
    return null;
  }
  const people = '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M11 20c0-3 2.5-5 5-5s5 2 5 5"/></svg>';
  const check = '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';

  function renderTogether() {
    const [a, b] = S.seats;
    const box = $('together');
    if (adjacent(a!, b!)) {
      box.className = 'together done';
      box.innerHTML = `${check}<div>${c.together}${a} · ${b}</div>`;
      return;
    }
    box.className = 'together';
    let msg = '';
    let btn = '';
    let act: (() => void) | null = null;
    const one = a || b;
    const missing = a ? 1 : 0;
    if (one && !(a && b)) {
      const n = neighbours(one).find(isFree);
      if (n && !seatCost(n)) {
        msg = c.seatNear(c.acc[missing]!, n);
        act = () => (S.seats[missing] = n);
        btn = c.yes;
      }
    }
    if (!act) {
      const p = findPair();
      if (p) {
        msg = c.pairMsg;
        act = () => (S.seats = [...p]);
        btn = c.pick;
      }
    }
    box.innerHTML = `${people}<div>${msg}</div>${act ? `<button type="button">${btn}</button>` : ''}`;
    const go = act;
    box.querySelector('button')?.addEventListener('click', () => {
      go?.();
      renderAll();
    });
  }

  function renderSeats() {
    const xlFree = FARES[S.fare].xlFree;
    $('xl-price').textContent = xlFree ? c.xlFree : c.xl;
    $('pax').innerHTML = S.seats
      .map(
        (s, i) =>
          `<button type="button" class="px${i === S.active ? ' on' : ''}" data-i="${i}"><small>${c.pax(i + 1)}</small><b>${c.names[i]} ${
            s ? `<span class="seat">· ${s}${seatCost(s) ? ' +900' : ''}</span>` : `<span class="need">${c.choose}</span>`
          }</b></button>`,
      )
      .join('');
    $('pax')
      .querySelectorAll<HTMLElement>('.px')
      .forEach(
        (p) =>
          (p.onclick = () => {
            S.active = Number(p.dataset.i);
            renderAll();
          }),
      );
    let h = '<div class="cols"><span>A</span><span>B</span><span>C</span><span></span><span>D</span><span>E</span><span>F</span></div>';
    for (let r = 1; r <= ROWS; r++) {
      if (r === 6) h += `<div class="exit"><span>${c.exitL}</span><span>${c.exitR}</span></div>`;
      h += '<div class="row">';
      [...COLS].forEach((col, i) => {
        if (i === 3) h += `<span class="num">${r}</span>`;
        const id = r + col;
        const owner = S.seats.indexOf(id);
        const cls = taken.has(id) ? 'taken' : owner === S.active ? 'mine' : owner >= 0 ? 'other' : isXL(r) ? 'xl' : 'free';
        const paid = isXL(r) && !xlFree;
        const label = taken.has(id) ? c.seatTaken(id) : owner >= 0 ? c.seatMine(id, c.names[owner]!) : c.seatFree(id, paid, r === 6);
        h += `<button type="button" class="s ${cls}" data-id="${id}" ${taken.has(id) ? 'disabled' : ''} aria-label="${label}" title="${label}">${
          owner >= 0 ? c.names[owner]![0] : cls === 'xl' && paid ? '+' : ''
        }</button>`;
      });
      h += '</div>';
    }
    $('cabin').innerHTML = h;
    $('cabin')
      .querySelectorAll<HTMLElement>('.s:not(.taken)')
      .forEach(
        (b) =>
          (b.onclick = () => {
            const id = b.dataset.id!;
            const owner = S.seats.indexOf(id);
            if (owner >= 0 && owner !== S.active) return;
            S.seats[S.active] = id;
            const next = S.seats.findIndex((s) => !s);
            if (next >= 0) S.active = next;
            renderAll();
            el.querySelector<HTMLElement>(`.s[data-id="${id}"]`)?.focus({ preventScroll: true });
          }),
      );
    renderTogether();
    const ex = S.seats.filter((id): id is string => !!id && rowOf(id) === 6);
    $('exitwarn').className = 'exitwarn' + (ex.length ? ' show' : '');
    $('exitwarn').innerHTML = ex.length ? c.exitWarn(ex.join(', ')) : '';
    const extra = S.seats.reduce((s, id) => s + seatCost(id), 0);
    $('s-line').textContent = c.seatsLine(c.fares[S.fare], S.seats.map((s) => s || '—').join(', ')) + (extra ? ` · +${fmt(extra)} ₽` : '');
    $('s-tot').innerHTML = `${fmt(FARES[S.fare].p * PAX + extra)} ₽<em>${c.total}</em>`;
    const missing = S.seats.map((s, i) => (s ? null : c.names[i])).filter(Boolean);
    const go = $<HTMLButtonElement>('s-go');
    go.disabled = missing.length > 0;
    go.textContent = missing.length ? c.chooseFor(missing.join(', ')) : c.cont;
  }
  $('skip').onclick = () => {
    S.seats = [null, null];
    S.active = 0;
    renderAll();
  };

  /* ---------- 4. оформление ---------- */
  const doc = $<HTMLInputElement>('doc');
  function validateDoc() {
    const d = doc.value.replace(/\D/g, '');
    const ok = d.length === 10;
    $('docf').classList.toggle('bad', !ok);
    $('docerr').className = 'ferr' + (ok ? ' ok' : '');
    $('docerr').textContent = ok ? c.docOk : c.docBad(d.length);
    return ok;
  }
  function renderCheckout() {
    const f = FARES[S.fare];
    const seats = S.seats.reduce((s, id) => s + seatCost(id), 0);
    const ins = S.ins ? 690 : 0;
    const total = f.p * PAX + seats + ins;
    $('c-tot').textContent = `${fmt(total)} ₽`;
    $('brk').className = 'brk' + (S.brk ? ' open' : '');
    $('brk-t').textContent = S.brk ? c.brkHide : c.brkShow;
    $('brk').innerHTML = `
      <div><span>${c.brkTickets(c.fares[S.fare], fmt(f.p))}</span><span>${fmt(f.p * PAX)} ₽</span></div>
      <div><span>${c.brkSeats(S.seats.filter(Boolean).join(', ') || c.atCheckin)}</span><span>${fmt(seats)} ₽</span></div>
      <div><span>${c.brkIns}</span><span>${ins ? `${fmt(690)} ₽` : c.none}</span></div>
      <div><span>${c.brkFee}</span><span>${c.feeIn}</span></div>`;
    const ok = validateDoc();
    const pay = $<HTMLButtonElement>('pay');
    pay.disabled = !ok;
    pay.textContent = ok ? c.pay(fmt(total)) : c.fixDoc;
    $('ins').classList.toggle('on', S.ins);
  }
  doc.addEventListener('input', renderCheckout);
  $('ins').onclick = () => {
    S.ins = !S.ins;
    renderCheckout();
  };
  $('brk-t').onclick = () => {
    S.brk = !S.brk;
    renderCheckout();
  };
  let left = 18 * 60;
  const timer = window.setInterval(() => {
    if (!el.isConnected) return window.clearInterval(timer);
    left = left > 0 ? left - 1 : 18 * 60;
    $('timer').textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  }, 1000);

  /* ---------- слайдер ---------- */
  const track = $('track');
  const shots = [...track.children] as HTMLElement[];
  const step = () => shots[1]!.offsetLeft - shots[0]!.offsetLeft;
  function updateSlider() {
    const i = Math.round(track.scrollLeft / step());
    const visible = Math.max(1, Math.floor((track.clientWidth + 40) / step()));
    const last = Math.min(shots.length, i + visible);
    $('pos').textContent = c.pos(visible > 1 ? `${i + 1}–${last}` : String(i + 1), shots.length);
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

  function renderAll() {
    renderFares();
    renderSeats();
    renderCheckout();
  }
  renderFlights();
  renderAll();
  updateSlider();
}
