/**
 * Живые экраны кейса «Банковские приложения» (`src/components/case/banking/Banking.astro`): главная (кэшбэк,
 * отключение платной услуги, реквизиты, скрытие предложения), перевод по телефону (получатель, лимит СБП,
 * комиссия, предупреждение о звонке), кредит наличными (платёж, переплата, страховка, период охлаждения),
 * безопасность (блокировка с объяснением, «Меня обманули», «вторая рука»). Слайдер и точки — `roast-frame.ts`.
 */
import { COPY } from '../components/case/banking/copy';
import { initRoastFrame } from './roast-frame';

export function initBanking(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-banking]:not([data-ready])').forEach(setup);
}

function setup(el: HTMLElement) {
  el.dataset.ready = '';
  const lang = el.dataset.lang === 'en' ? 'en' : 'ru';
  const c = COPY[lang];
  const $ = <T extends HTMLElement = HTMLElement>(k: string) => el.querySelector<T>(`[data-k="${k}"]`)!;
  const fmt = (n: number) =>
    Math.round(n)
      .toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU')
      .replace(/\s/g, '\u00a0');
  // Радио-группа из «чипсов»: выбранный — `.on`.
  const pick = (btns: HTMLElement[], on: HTMLElement) =>
    btns.forEach((b) => b.classList.toggle('on', b === on));

  /* ---------- 1. главная ---------- */
  const cats = [
    ...el.querySelectorAll<HTMLElement>(
      '.bk-cat:not([data-rcp]):not([data-amt]):not([data-sum]):not([data-term])',
    ),
  ];
  function renderCb() {
    const n = cats.filter((b) => b.classList.contains('on')).length;
    $('cb-sub').textContent = n === 3 ? c.cbDone : c.cbSub(n);
    $('cb').classList.toggle('done', n === 3);
  }
  cats.forEach(
    (b) =>
      (b.onclick = () => {
        const on = b.classList.contains('on');
        if (!on && cats.filter((x) => x.classList.contains('on')).length >= 3) return;
        b.classList.toggle('on', !on);
        renderCb();
      }),
  );
  renderCb();
  $('paid').onclick = () => {
    const btn = $('paid');
    btn.textContent = c.offDone;
    btn.classList.add('done');
    btn.setAttribute('disabled', '');
  };
  $('req').onclick = () => {
    const toast = $('toast');
    toast.hidden = false;
    window.setTimeout(() => (toast.hidden = true), 1800);
  };
  $('offer-x').onclick = () => ($('offer').hidden = true);

  /* ---------- 2. перевод по телефону ---------- */
  const T = { rcp: 0, amount: 15000, call: true };
  const FREE = 100000;
  const USED = 88000; // уже переведено в этом месяце
  const rcps = [...el.querySelectorAll<HTMLElement>('[data-rcp]')];
  const amts = [...el.querySelectorAll<HTMLElement>('[data-amt]')];
  function renderTransfer() {
    const r = c.recipients[T.rcp]!;
    $('rcp').innerHTML =
      `<span class="bk-ava">${r.name[0]}</span><span><small>${c.phoneLabel} · ${c.phones[T.rcp]}</small><b>${r.name}</b><small>${r.bank}</small><em class="${r.fresh ? 'warn' : ''}">${r.note}</em></span>`;
    $('rcp').classList.toggle('fresh', r.fresh);
    $('call').hidden = !T.call;
    $('amt').textContent = `${fmt(T.amount)}\u00a0₽`;
    const rest = Math.max(0, FREE - USED);
    const over = Math.max(0, T.amount - rest);
    const fee = over ? Math.min(1500, over * 0.005) : 0;
    $('limit-bar').style.width = `${Math.round((Math.min(FREE, USED + T.amount) / FREE) * 100)}%`;
    $('limit').classList.toggle('over', over > 0);
    $('limit-text').textContent = over ? c.limitOver(fmt(over)) : c.limitFree(fmt(rest - T.amount));
    $('fee').textContent = fee ? `${c.fee} ${fmt(fee)}\u00a0₽` : c.feeNone;
    $('t-tot').innerHTML = `${fmt(T.amount + fee)}\u00a0₽<em>${c.totalShort}</em>`;
    $('t-go').textContent = c.send(fmt(T.amount + fee));
  }
  rcps.forEach(
    (b) =>
      (b.onclick = () => {
        pick(rcps, b);
        T.rcp = Number(b.dataset.rcp);
        renderTransfer();
      }),
  );
  amts.forEach(
    (b) =>
      (b.onclick = () => {
        pick(amts, b);
        T.amount = Number(b.dataset.amt);
        renderTransfer();
      }),
  );
  $('call-ok').onclick = () => {
    T.call = false;
    renderTransfer();
  };
  $('call-cancel').onclick = () => {
    T.call = false;
    renderTransfer();
  };
  renderTransfer();

  /* ---------- 3. кредит наличными ---------- */
  const L = { sum: 300000, term: 24, ins: false };
  const RATE = 0.249;
  const sums = [...el.querySelectorAll<HTMLElement>('[data-sum]')];
  const terms = [...el.querySelectorAll<HTMLElement>('[data-term]')];
  function renderLoan() {
    const i = RATE / 12;
    const pay = (L.sum * i) / (1 - (1 + i) ** -L.term);
    const ins = Math.round((L.sum * 0.0025) / 10) * 10; // страховка: 0,25% суммы в месяц
    const total = pay + (L.ins ? ins : 0);
    $('pay').textContent = `${fmt(total)}\u00a0₽`;
    // Полная стоимость: без страховки — как ставка; со страховкой — ставка плюс её годовая доля.
    const psk = RATE * 100 + (L.ins ? ((ins * 12) / L.sum) * 100 : 0);
    $('psk-v').textContent = `${psk.toFixed(1).replace('.', lang === 'en' ? '.' : ',')}%`;
    $('over').textContent = `${fmt(total * L.term - L.sum)}\u00a0₽`;
    $('ins-sub').textContent = c.insSub(fmt(ins));
    $('ins-sw').classList.toggle('on', L.ins);
    $('cool').innerHTML = L.sum <= 50000 ? c.cool.now : L.sum <= 200000 ? c.cool.h4 : c.cool.h48;
  }
  sums.forEach(
    (b) =>
      (b.onclick = () => {
        pick(sums, b);
        L.sum = Number(b.dataset.sum);
        renderLoan();
      }),
  );
  terms.forEach(
    (b) =>
      (b.onclick = () => {
        pick(terms, b);
        L.term = Number(b.dataset.term);
        renderLoan();
      }),
  );
  $('ins-sw').onclick = () => {
    L.ins = !L.ins;
    renderLoan();
  };
  renderLoan();

  /* ---------- 4. безопасность ---------- */
  const resolve = (html: string) => {
    $('block-open').hidden = true;
    $('block-done').innerHTML = html;
    $('block-done').hidden = false;
    $('block').classList.add('done');
  };
  $('block-ok').onclick = () => resolve(c.blockDone);
  $('block-card').onclick = () => resolve(c.cardDone);
  $('fraud').onclick = () => ($('fraud-done').hidden = false);
  $('guard-sw').onclick = () => $('guard-sw').classList.toggle('on');

  /* ---------- слайдер, карточки, точки-подсказки — общая часть прожарки ---------- */
  initRoastFrame(el, {
    problem: c.problem,
    solution: c.solution,
    screens: c.screens,
    hotspots: [
      ['[data-k=total]', '[data-k=paid]', '.bk-up .bk-card__head', '[data-k=req]', '[data-k=cb]'],
      ['[data-k=rcp]', '[data-k=limit]', '[data-k=call]', '[data-k=t-go]'],
      ['[data-k=ins]', '[data-k=psk]', '[data-k=cool]'],
      ['[data-k=block]', '[data-k=fraud]', '[data-k=guard]'],
    ],
  });
}
