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
