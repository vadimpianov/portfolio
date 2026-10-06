/** Данные интерактивных блоков кейса Quantori (PharmaKB). */
/** Результаты: было → стало. */
export const results = [
  {
    label: { ru: 'Минут непрерывной работы', en: 'Minutes of uninterrupted work' },
    from: 18,
    to: 41,
  },
  {
    label: { ru: 'Минут на поиск нужного показателя', en: 'Minutes to find the right metric' },
    from: 3.7,
    to: 1.2,
  },
  {
    label: { ru: 'Сессий заканчивались выгрузкой в Excel, %', en: 'Sessions ending in an Excel export, %' },
    from: 64,
    to: 23,
  },
  {
    label: { ru: 'Оценка удобства SUS, из 100', en: 'SUS usability score, of 100' },
    from: 52,
    to: 81,
  },
];

/** Истории «что мы улучшили»: было → стало (придуманы по просьбе пользователя, как и итоги кейса). */
export const stories = {
  search: [
    { label: { ru: 'Запросов без результатов, %', en: 'Searches with no results, %' }, from: 38, to: 9 },
    { label: { ru: 'Секунд до нужного отчёта', en: 'Seconds to the right report' }, from: 74, to: 19 },
    { label: { ru: 'Уточнений одного запроса', en: 'Refinements per search' }, from: 3.1, to: 1.4 },
    { label: { ru: 'Запросов через подсказки, %', en: 'Searches via suggestions, %' }, from: 0, to: 61 },
  ],
  favorites: [
    { label: { ru: 'Пользователей с избранным, %', en: 'Users with favourites, %' }, from: 21, to: 68 },
    { label: { ru: 'Отчётов в избранном на пользователя', en: 'Favourite reports per user' }, from: 2.4, to: 11.7 },
    { label: { ru: 'Секунд, чтобы вернуться к отчёту', en: 'Seconds to get back to a report' }, from: 52, to: 6 },
    { label: { ru: 'Сессий начинаются с «Моих отчётов», %', en: 'Sessions starting in My Reports, %' }, from: 12, to: 47 },
  ],
  collections: [
    { label: { ru: 'Коллекций на аналитика', en: 'Collections per analyst' }, from: 0, to: 4.6 },
    { label: { ru: 'Минут на подборку к встрече', en: 'Minutes to prepare a set for a meeting' }, from: 45, to: 8 },
    { label: { ru: 'Отчётов отправляют ссылкой на коллекцию, %', en: 'Reports shared as a collection link, %' }, from: 7, to: 33 },
    { label: { ru: 'Выгрузок отчётов по одному, в неделю', en: 'One-by-one report exports per week' }, from: 26, to: 9 },
  ],
  alerts: [
    { label: { ru: 'Подписок на обновления на пользователя', en: 'Update subscriptions per user' }, from: 0.3, to: 5.2 },
    { label: { ru: 'Дней до того, как узнают об одобрении', en: 'Days to learn about an approval' }, from: 9, to: 1 },
    { label: { ru: 'Визитов в неделю', en: 'Visits per week' }, from: 1.8, to: 3.4 },
    { label: { ru: 'Писем открывают, %', en: 'Emails opened, %' }, from: 18, to: 46 },
  ],
};

/** Масштаб базы — из презентации PharmaKB («Introducing PharmaKB», pharmakb.com). */
export const scale = [
  {
    value: 9770,
    label: { ru: 'Препаратов', en: 'Drugs' },
    sub: { ru: 'одобренные FDA и EMA и в исследованиях', en: 'approved by FDA and EMA and in trials' },
  },
  {
    value: 1700,
    label: { ru: 'Компаний', en: 'Companies' },
    sub: {
      ru: 'около 600 торгуются на бирже, капитализация от $100 млн до $400 млрд',
      en: 'about 600 publicly traded, market cap from $100M to $400B',
    },
  },
  {
    value: 1300,
    label: { ru: 'Заболеваний', en: 'Diseases' },
    sub: { ru: 'конкурентные рынки', en: 'competitive markets' },
  },
];
