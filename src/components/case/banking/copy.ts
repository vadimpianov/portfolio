/**
 * Тексты кейса «Банковские приложения» (прожарка, RU / EN): разметка (`Banking.astro`) и живые экраны
 * (`src/scripts/banking.ts`). Все строки сразу проходят через typograph() — по кускам между тегами.
 * Цифры описания — из открытых данных (ЦБ, НАФИ, законы 2025 года), см. log.md.
 */
import { typograph } from '../../../i18n/typograph';

type Pair = { no: string; problem: string; solution: string };
type Screen = { title: string; pairs: Pair[] };

const RU = {
  title: 'Банковские приложения',
  eyebrow: 'Кейс 1',
  lead: [
    'Мы разбираем проблемы, с которыми реальные люди сталкиваются в мобильных банках.',
    'Мобильным банком пользуются 70% взрослых россиян. В 2025 году жалоб на банки в ЦБ стало на 15% больше — 235 тысяч. Чаще всего люди жаловались на отказы в операциях и блокировку карт и приложения: банк не объяснял, в чём причина и что делать. Мошенники за год украли со счетов 29,3 млрд ₽, а пострадавшим вернули только 5,9%.',
  ],
  leadListTitle: 'Часть проблем человек замечает, только когда уже поздно:',
  leadList: [
    'Комиссия за перевод появляется, когда бесплатные 100 тысяч в месяц уже кончились, а сколько осталось — нигде не видно',
    'Платное уведомление за 99 ₽ в месяц списывается годами, а отключить его можно только через поддержку',
    'Деньги по кредиту не пришли: человек не знал про период охлаждения и 48 часов ожидания',
  ],
  problems: [
    [
      'Реклама вместо денег',
      'На главной первым экраном — баннеры кредитов и карт, а свой баланс приходится искать ниже',
      [1],
    ],
    [
      'Списания, о которых забыли',
      'Платные уведомления до 99 ₽ в месяц и подписки списываются годами, а отключаются только через поддержку',
      [1],
    ],
    [
      'Автоплатежи врасплох',
      'Не видно, что и когда спишется на этой неделе, — в нужный день денег на карте может не хватить',
      [1],
    ],
    [
      'Реквизиты в глубине меню',
      'Чтобы отправить реквизиты для зарплаты, нужно пройти три-четыре экрана и копировать поля по одному',
      [1],
    ],
    [
      'Кэшбэк, который проспали',
      'Категории надо выбирать каждый месяц, а напоминания нет — кэшбэк сгорает',
      [1],
    ],
    [
      'Перевод не тому',
      'По номеру телефона видно только имя и первую букву фамилии — легко ошибиться цифрой и отправить чужому',
      [2],
    ],
    [
      'Комиссия из ниоткуда',
      'Бесплатно — 100 тысяч в месяц по СБП, дальше 0,5%. Сколько осталось, приложение не показывает',
      [2],
    ],
    [
      '«Служба безопасности банка»',
      'Мошенник звонит и диктует перевод, а приложение молча его проводит. Социальная инженерия — главный инструмент мошенников',
      [2],
    ],
    ['Итог после нажатия', 'Сумма с комиссией видна только на экране подтверждения или уже в выписке', [2]],
    ['Страховка по умолчанию', 'Страховка к кредиту включена заранее и незаметно увеличивает платёж', [3]],
    [
      'Полная стоимость мелким шрифтом',
      'Крупно — ставка «от», а полная стоимость кредита и переплата спрятаны в документах',
      [3],
    ],
    [
      'Деньги «пропали»',
      'С сентября 2025 года кредит больше 200 тысяч выдают через 48 часов. Об этом узнают, когда денег нет',
      [3],
    ],
    [
      'Блокировка без объяснений',
      'Банк приостанавливает переводы, но не говорит, почему и что делать. Таких жалоб в ЦБ больше всего',
      [4],
    ],
    [
      '«Меня обманули» — куда нажать',
      'Заявление в банк и справку для полиции приходится искать по меню или просить в отделении',
      [4],
    ],
    [
      'Защита спрятана',
      'Самозапрет на кредиты и «вторую руку» мало кто находит, хотя самозапрет установлен уже больше 22 млн раз',
      [4],
    ],
  ] as [string, string, number[]][],
  prev: 'Предыдущий экран',
  next: 'Следующий экран',
  problem: 'Проблема · ',
  solution: 'Решение · ',
  screens: [
    {
      title: '1 · Главная',
      pairs: [
        {
          no: '01',
          problem: 'реклама кредитов выше своих денег',
          solution:
            'первым экраном — все деньги и счета. Предложение банка — одной строкой внизу, его можно скрыть',
        },
        {
          no: '02',
          problem: 'платные уведомления и подписки списываются незаметно',
          solution: 'платные услуги — в «Скоро спишется» с ценой за год. Отключаются одним нажатием',
        },
        {
          no: '03',
          problem: 'автоплатежи застают врасплох',
          solution: 'списания на неделю вперёд: что, когда и хватит ли денег на карте',
        },
        {
          no: '04',
          problem: 'реквизиты не найти',
          solution: 'реквизиты — на главной. Одно нажатие, и они скопированы целиком',
        },
        {
          no: '05',
          problem: 'кэшбэк сгорает, потому что категории не выбраны',
          solution: 'напоминание за неделю и выбор категорий прямо на главной',
        },
      ],
    },
    {
      title: '2 · Перевод по телефону',
      pairs: [
        {
          no: '06',
          problem: 'по имени и букве фамилии легко ошибиться',
          solution:
            'имя и отчество, банк и история переводов. Новому получателю — отметка «Вы ещё не переводили»',
        },
        {
          no: '07',
          problem: 'бесплатный лимит не виден',
          solution: 'сколько ещё бесплатно в этом месяце — полоской под суммой',
        },
        {
          no: '08',
          problem: 'мошенник диктует перевод по телефону',
          solution: 'во время звонка — предупреждение: банк никогда не просит переводить деньги',
        },
        {
          no: '09',
          problem: 'итог с комиссией виден после нажатия',
          solution: 'комиссия и итог считаются сразу при вводе суммы, итог — на кнопке',
        },
      ],
    },
    {
      title: '3 · Кредит наличными',
      pairs: [
        {
          no: '10',
          problem: 'страховка включена по умолчанию',
          solution: 'страховка выключена. Включить можно самому — сразу видно, на сколько вырастет платёж',
        },
        {
          no: '11',
          problem: 'полная стоимость и переплата спрятаны',
          solution: 'полная стоимость и переплата — рядом с платежом, тем же размером',
        },
        {
          no: '12',
          problem: 'деньги не приходят, и непонятно почему',
          solution:
            'сразу видно, когда придут деньги по закону о периоде охлаждения и что до этого можно отказаться',
        },
      ],
    },
    {
      title: '4 · Безопасность',
      pairs: [
        {
          no: '13',
          problem: 'блокировка без объяснений',
          solution: 'причина простыми словами и два шага: подтвердить перевод или заблокировать карту',
        },
        {
          no: '14',
          problem: 'не найти, куда сообщить об обмане',
          solution: 'кнопка «Меня обманули»: заявление в банк и справка для полиции за минуту',
        },
        {
          no: '15',
          problem: 'самозапрет и «вторая рука» спрятаны',
          solution: 'обе защиты — на одном экране, с понятным статусом',
        },
      ],
    },
  ] as Screen[],
  // Экран 1 — главная
  name: 'Анна',
  totalLabel: 'Все деньги',
  accounts: [
    ['Дебетовая ·· 4821', '52 340 ₽'],
    ['Накопительный · 16%', '120 000 ₽'],
    ['Кредитная ·· 7710', 'Доступно 30 000 ₽'],
  ] as [string, string][],
  total: '172 340 ₽',
  actions: ['Перевести', 'Оплатить', 'Пополнить', 'Реквизиты'],
  copied: '✓ Реквизиты скопированы',
  cbTitle: 'Кэшбэк на ноябрь',
  cbSub: (n: number) => `Выберите 3 категории — осталось 6 дней · выбрано ${n} из 3`,
  cbDone: '✓ Категории на ноябрь выбраны',
  cats: ['Кафе 5%', 'Такси 3%', 'Аптеки 5%', 'АЗС 3%', 'Кино 7%'],
  upTitle: 'Скоро спишется',
  upSub: 'На этой неделе · на карте хватает',
  upcoming: [
    ['10 окт', 'Мобильная связь', 'Автоплатёж', '650 ₽'],
    ['12 окт', 'Онлайн-кинотеатр', 'Подписка', '399 ₽'],
    ['15 окт', 'Уведомления об операциях', 'Платная услуга · 1 188 ₽ в год', '99 ₽'],
  ] as [string, string, string, string][],
  off: 'Отключить',
  offDone: 'Отключено · −1 188 ₽ в год',
  offer: 'Кредит наличными от 19,9%',
  offerLabel: 'Предложение банка',
  hideOffer: 'Скрыть предложение',
  // Экран 2 — перевод
  transferTop: 'Перевод по телефону',
  contacts: ['Иван К.', 'Новый номер'],
  phoneLabel: 'Номер телефона',
  phones: ['+7 916 123-45-67', '+7 999 765-43-21'],
  recipients: [
    {
      name: 'Иван Петрович К.',
      bank: 'Банк «Северный»',
      note: 'Переводили 3 раза, последний — 2 октября',
      fresh: false,
    },
    {
      name: 'Игорь Сергеевич М.',
      bank: 'Банк «Восток»',
      note: 'Вы ещё не переводили этому человеку',
      fresh: true,
    },
  ],
  call: '<b>Идёт звонок · 04:12</b>Банк никогда не просит переводить деньги по телефону. Если вас торопят — положите трубку',
  callCancel: 'Отменить перевод',
  callOk: 'Я перевожу сам',
  amountLabel: 'Сумма',
  limitFree: (rest: string) => `Без комиссии ещё ${rest} ₽ до 1 ноября`,
  limitOver: (over: string) => `Сверх лимита ${over} ₽ — комиссия 0,5%, не больше 1 500 ₽`,
  fee: 'Комиссия',
  feeNone: 'Без комиссии',
  totalShort: 'итого',
  send: (s: string) => `Перевести ${s} ₽`,
  // Экран 3 — кредит
  creditTop: 'Кредит наличными',
  sumLabel: 'Сумма',
  termLabel: 'Срок',
  months: (n: number) => `${n} мес.`,
  payLabel: 'Платёж в месяц',
  rate: 'Ставка',
  psk: 'Полная стоимость кредита',
  over: 'Переплата за весь срок',
  ins: '<b>Страховка жизни</b>',
  insSub: (p: string) => `Необязательно · +${p} ₽ в месяц, ставка без неё та же`,
  cool: {
    now: '<b>Деньги придут сразу.</b> До 50 000 ₽ период охлаждения не нужен',
    h4: '<b>Деньги придут через 4 часа — сегодня в 19:40.</b> До этого можно бесплатно отказаться',
    h48: '<b>Деньги придут через 48 часов — 14 октября в 15:40.</b> Так требует закон о периоде охлаждения. До этого можно бесплатно отказаться',
  },
  apply: 'Оформить кредит',
  // Экран 4 — безопасность
  secTop: 'Безопасность',
  blockTitle: 'Переводы приостановлены до 13 октября',
  blockWhy:
    '<b>Почему.</b> Перевод 48 000 ₽ новому получателю похож на мошеннический — так банк обязан делать по закону',
  blockSteps: ['Если перевод ваш — подтвердите его здесь', 'Если нет — заблокируйте карту'],
  blockOk: 'Это я, подтвердить',
  blockCard: 'Заблокировать карту',
  blockDone: '<b>Ограничение снято.</b> Перевод 48 000 ₽ отправлен',
  cardDone: '<b>Карта заблокирована.</b> Перевод отменён, деньги на счёте',
  fraud: 'Меня обманули',
  fraudSub: 'Заявление в банк и справка для полиции',
  fraudDone: ['Заявление № 2410-5837 отправлено в банк', 'Справка для полиции · PDF'],
  guardTitle: 'Защита',
  guard: [
    ['Самозапрет на кредиты', 'Установлен через Госуслуги'],
    ['Вторая рука', 'Сергей К. подтверждает переводы от 30 000 ₽'],
    ['Лимит переводов в сутки', '100 000 ₽'],
  ] as [string, string][],
  on: 'Включено',
  ariaPaid: 'Отключить платные уведомления',
  ariaIns: 'Страховка жизни',
  ariaGuard: 'Вторая рука',
};

export type BankCopy = typeof RU;

const EN: BankCopy = {
  title: 'Banking apps',
  eyebrow: 'Case 1',
  lead: [
    'We look at the problems real people run into in mobile banking apps.',
    '70% of adults in Russia use a mobile bank. In 2025, complaints about banks to the Bank of Russia grew by 15% to 235 thousand. Most often people complained about refused transactions and blocked cards and apps: the bank did not explain why or what to do. Fraudsters stole 29.3 billion rubles from accounts in a year, and victims got back only 5.9%.',
  ],
  leadListTitle: 'Some problems show up only when it is too late:',
  leadList: [
    'A transfer fee appears once the free 100 thousand a month is used up, and nowhere shows how much is left',
    'A paid notification of 99 rubles a month is charged for years and can only be turned off through support',
    'The loan money did not arrive: the person did not know about the cooling-off period and the 48-hour wait',
  ],
  problems: [
    [
      'Ads instead of money',
      'The home screen opens with loan and card banners, and you have to scroll to find your own balance',
      [1],
    ],
    [
      'Forgotten charges',
      'Paid notifications of up to 99 rubles a month and subscriptions are charged for years and can only be turned off through support',
      [1],
    ],
    [
      'Surprise autopayments',
      'You cannot see what will be charged this week and when — on the day the card may be short',
      [1],
    ],
    [
      'Account details buried in menus',
      'To send your account details for salary, you go through three or four screens and copy fields one by one',
      [1],
    ],
    [
      'Missed cashback',
      'Categories have to be picked every month, and there is no reminder — the cashback is lost',
      [1],
    ],
    [
      'Money to the wrong person',
      'By phone number you see only the first name and the initial of the surname — one wrong digit sends money to a stranger',
      [2],
    ],
    [
      'A fee out of nowhere',
      'Fast payments are free up to 100 thousand a month, then 0.5%. The app does not show how much is left',
      [2],
    ],
    [
      '“The bank’s security service”',
      'A fraudster calls and dictates a transfer, and the app silently sends it. Social engineering is the fraudsters’ main tool',
      [2],
    ],
    [
      'The total after you tap',
      'The amount with the fee is shown only on the confirmation screen or in the statement',
      [2],
    ],
    ['Insurance by default', 'Loan insurance is switched on in advance and quietly raises the payment', [3]],
    [
      'Full cost in small print',
      'The rate “from” is big, while the full cost of the loan and the overpayment are hidden in documents',
      [3],
    ],
    [
      'The money “went missing”',
      'Since September 2025, loans over 200 thousand rubles are paid out after 48 hours. People learn this when the money is not there',
      [3],
    ],
    [
      'Blocked with no explanation',
      'The bank suspends transfers but does not say why or what to do. These are the most common complaints to the Bank of Russia',
      [4],
    ],
    [
      '“I was scammed” — where to tap',
      'The report to the bank and the certificate for the police have to be searched for in menus or requested at a branch',
      [4],
    ],
    [
      'Protection is hidden',
      'Few people find the self-ban on loans and the “second hand” service, although the self-ban has been set more than 22 million times',
      [4],
    ],
  ],
  prev: 'Previous screen',
  next: 'Next screen',
  problem: 'Problem · ',
  solution: 'Solution · ',
  screens: [
    {
      title: '1 · Home',
      pairs: [
        {
          no: '01',
          problem: 'loan ads above your own money',
          solution:
            'the first screen shows all money and accounts. The bank’s offer is one line at the bottom and can be hidden',
        },
        {
          no: '02',
          problem: 'paid notifications and subscriptions are charged unnoticed',
          solution:
            'paid services are in “Coming up” with the price per year. They are turned off with one tap',
        },
        {
          no: '03',
          problem: 'autopayments come as a surprise',
          solution: 'charges for the week ahead: what, when and whether the card has enough',
        },
        {
          no: '04',
          problem: 'account details are hard to find',
          solution: 'account details are on the home screen. One tap copies them all',
        },
        {
          no: '05',
          problem: 'cashback is lost because categories are not picked',
          solution: 'a reminder a week ahead and picking categories right on the home screen',
        },
      ],
    },
    {
      title: '2 · Transfer by phone',
      pairs: [
        {
          no: '06',
          problem: 'a first name and an initial are easy to confuse',
          solution:
            'first name and patronymic, the bank and the transfer history. A new recipient is marked “You have not sent money here before”',
        },
        {
          no: '07',
          problem: 'the free limit is not visible',
          solution: 'how much is still free this month — a bar under the amount',
        },
        {
          no: '08',
          problem: 'a fraudster dictates a transfer over the phone',
          solution: 'during a call — a warning: the bank never asks you to transfer money',
        },
        {
          no: '09',
          problem: 'the total with the fee is shown after you tap',
          solution: 'the fee and the total are counted as you type, the total is on the button',
        },
      ],
    },
    {
      title: '3 · Cash loan',
      pairs: [
        {
          no: '10',
          problem: 'insurance is on by default',
          solution:
            'insurance is off. You can switch it on yourself and see at once how much the payment grows',
        },
        {
          no: '11',
          problem: 'the full cost and the overpayment are hidden',
          solution: 'the full cost and the overpayment are next to the payment, in the same size',
        },
        {
          no: '12',
          problem: 'the money does not arrive and it is unclear why',
          solution:
            'you see at once when the money arrives under the cooling-off law and that you can cancel until then',
        },
      ],
    },
    {
      title: '4 · Security',
      pairs: [
        {
          no: '13',
          problem: 'blocked with no explanation',
          solution: 'the reason in plain words and two steps: confirm the transfer or block the card',
        },
        {
          no: '14',
          problem: 'no idea where to report a scam',
          solution:
            'an “I was scammed” button: a report to the bank and a certificate for the police in a minute',
        },
        {
          no: '15',
          problem: 'the self-ban and the “second hand” are hidden',
          solution: 'both protections on one screen with a clear status',
        },
      ],
    },
  ],
  name: 'Anna',
  totalLabel: 'All money',
  accounts: [
    ['Debit ·· 4821', '52,340 ₽'],
    ['Savings · 16%', '120,000 ₽'],
    ['Credit ·· 7710', 'Available 30,000 ₽'],
  ],
  total: '172,340 ₽',
  actions: ['Transfer', 'Pay', 'Top up', 'Details'],
  copied: '✓ Account details copied',
  cbTitle: 'November cashback',
  cbSub: (n) => `Pick 3 categories — 6 days left · ${n} of 3 picked`,
  cbDone: '✓ November categories picked',
  cats: ['Cafés 5%', 'Taxi 3%', 'Pharmacies 5%', 'Fuel 3%', 'Cinema 7%'],
  upTitle: 'Coming up',
  upSub: 'This week · the card has enough',
  upcoming: [
    ['Oct 10', 'Mobile plan', 'Autopayment', '650 ₽'],
    ['Oct 12', 'Streaming service', 'Subscription', '399 ₽'],
    ['Oct 15', 'Transaction notifications', 'Paid service · 1,188 ₽ a year', '99 ₽'],
  ],
  off: 'Turn off',
  offDone: 'Turned off · −1,188 ₽ a year',
  offer: 'Cash loan from 19.9%',
  offerLabel: 'Bank offer',
  hideOffer: 'Hide the offer',
  transferTop: 'Transfer by phone',
  contacts: ['Ivan K.', 'New number'],
  phoneLabel: 'Phone number',
  phones: ['+7 916 123-45-67', '+7 999 765-43-21'],
  recipients: [
    {
      name: 'Ivan Petrovich K.',
      bank: 'Severny Bank',
      note: 'Sent 3 times, last on October 2',
      fresh: false,
    },
    {
      name: 'Igor Sergeevich M.',
      bank: 'Vostok Bank',
      note: 'You have not sent money to this person before',
      fresh: true,
    },
  ],
  call: '<b>On a call · 04:12</b>The bank never asks you to transfer money over the phone. If you are being rushed, hang up',
  callCancel: 'Cancel the transfer',
  callOk: 'I am sending it myself',
  amountLabel: 'Amount',
  limitFree: (rest) => `Free for another ${rest} ₽ until November 1`,
  limitOver: (over) => `${over} ₽ over the limit — 0.5% fee, no more than 1,500 ₽`,
  fee: 'Fee',
  feeNone: 'No fee',
  totalShort: 'total',
  send: (s) => `Send ${s} ₽`,
  creditTop: 'Cash loan',
  sumLabel: 'Amount',
  termLabel: 'Term',
  months: (n) => `${n} mo.`,
  payLabel: 'Monthly payment',
  rate: 'Rate',
  psk: 'Full cost of the loan',
  over: 'Overpayment for the whole term',
  ins: '<b>Life insurance</b>',
  insSub: (p) => `Optional · +${p} ₽ a month, the rate is the same without it`,
  cool: {
    now: '<b>The money arrives at once.</b> Under 50,000 ₽ there is no cooling-off period',
    h4: '<b>The money arrives in 4 hours — today at 7:40 pm.</b> Until then you can cancel for free',
    h48: '<b>The money arrives in 48 hours — October 14 at 3:40 pm.</b> This is required by the cooling-off law. Until then you can cancel for free',
  },
  apply: 'Take the loan',
  secTop: 'Security',
  blockTitle: 'Transfers suspended until October 13',
  blockWhy:
    '<b>Why.</b> A 48,000 ₽ transfer to a new recipient looks like fraud — the law requires the bank to stop it',
  blockSteps: ['If the transfer is yours, confirm it here', 'If not, block the card'],
  blockOk: 'It’s me, confirm',
  blockCard: 'Block the card',
  blockDone: '<b>The restriction is lifted.</b> The 48,000 ₽ transfer has been sent',
  cardDone: '<b>The card is blocked.</b> The transfer is cancelled, the money is in the account',
  fraud: 'I was scammed',
  fraudSub: 'A report to the bank and a certificate for the police',
  fraudDone: ['Report No. 2410-5837 sent to the bank', 'Certificate for the police · PDF'],
  guardTitle: 'Protection',
  guard: [
    ['Self-ban on loans', 'Set via Gosuslugi'],
    ['Second hand', 'Sergey K. confirms transfers from 30,000 ₽'],
    ['Daily transfer limit', '100,000 ₽'],
  ],
  on: 'On',
  ariaPaid: 'Turn off paid notifications',
  ariaIns: 'Life insurance',
  ariaGuard: 'Second hand',
};

// Число не отрывается ни от разрядов («1 500», «52,340»), ни от единицы или слова за ним («235 тысяч», «99 ₽», «70%»).
const nbspNumbers = (t: string) =>
  t.replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0').replace(/(\d) (?=[₽%]|[а-яёa-z])/giu, '$1\u00a0');

// Текст между тегами — по отдельности: короткое слово сразу после <b> тоже привязывается.
function deep<T>(v: T): T {
  if (typeof v === 'string')
    return v
      .split(/(<[^>]+>)/)
      .map((part) => (part.startsWith('<') ? part : nbspNumbers(typograph(part))))
      .join('') as T;
  if (typeof v === 'function')
    return ((...a: unknown[]) => deep((v as (...x: unknown[]) => unknown)(...a))) as T;
  if (Array.isArray(v)) return v.map(deep) as T;
  if (v && typeof v === 'object')
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) as T;
  return v;
}

export const COPY = { ru: deep(RU), en: deep(EN) };
