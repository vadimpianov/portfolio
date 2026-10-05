/** Данные интерактивных блоков кейса Quantori (PharmaKB). */
/**
 * Мок отчёта по препарату «до/после»: одни и те же таблицы в двух раскладках. Интерфейс продукта —
 * на английском (как в PharmaKB), значения — с экранов пользователя.
 */
export const dashboard = {
  app: 'PharmaKB · Drug Reports',
  crumbs: 'Abaloparatide › Commercial',
  before: { ru: 'Было', en: 'Before' },
  after: { ru: 'Стало', en: 'After' },
  switch: { ru: 'Версия интерфейса', en: 'Interface version' },
  filters: ['Source: FDA + EMA', 'Phase: all', '2012–2022'],
  tables: [
    {
      key: 'programs',
      title: 'Indications',
      cols: ['Indication', 'MeSH', 'Phase', 'Approved', 'Source'],
      rows: [
        ['Non-small-cell Lung', 'D006973', '4', '2021-11-17', 'FDA'],
        ['Rheumatoid Arthritis', 'D001172', '3', '—', 'EMA'],
        ['Postmenopausal Osteoporosis', 'D015663', '4', '2017-04-28', 'FDA'],
        ['Migraine Disorders', 'D008881', '2', '—', 'EMA'],
        ['Attention Deficit Disorder', 'D001289', '3', '—', 'FDA'],
      ],
    },
    {
      key: 'fda',
      title: 'Label · FDA',
      cols: ['Trade Name', 'Status', 'Updated'],
      rows: [
        ['Alecensa', 'NDA', '2020-06-08'],
        ['Proleukin', 'BLA', '2020-12-20'],
        ['Lemtrada', 'BLA', '2021-03-01'],
      ],
    },
    {
      key: 'ema',
      title: 'Label · EMA',
      cols: ['Trade Name', 'Status', 'Updated'],
      rows: [
        ['Alecensa', 'Authorised', '2017-02-16'],
        ['Proleukin', 'Withdrawn', '2019-07-04'],
        ['Lemtrada', 'Authorised', '2013-09-12'],
      ],
    },
    {
      key: 'phases',
      title: 'Clinical Trials',
      cols: ['Phase', 'Trials', 'Completed'],
      rows: [
        ['Phase 1', '12', '9'],
        ['Phase 2', '20', '14'],
        ['Phase 3', '15', '8'],
      ],
    },
    {
      key: 'refusals',
      title: 'Adverse Events',
      cols: ['Outcome', 'Reports', 'Source'],
      rows: [
        ['Death', '71,533', 'FDA'],
        ['Hospitalization', '56,477', 'FDA'],
      ],
    },
  ],
};

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
