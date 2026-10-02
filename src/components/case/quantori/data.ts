/**
 * Данные интерактивных блоков кейса Quantori (BioHarmony). Переходы между фазами «Все» — отчёт BIO
 * «Clinical Development Success Rates 2011–2020»; остальное — демо-данные, похожие на данные продукта.
 */
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

/** Вероятность перехода между фазами, %. */
export const phases = {
  sources: [
    { key: 'all', label: { ru: 'Все', en: 'All' } },
    { key: 'fda', label: { ru: 'FDA', en: 'FDA' } },
    { key: 'ema', label: { ru: 'EMA', en: 'EMA' } },
  ],
  steps: [
    { label: { ru: 'Фаза I → II', en: 'Phase I → II' }, all: 52.0, fda: 54.1, ema: 49.3 },
    { label: { ru: 'Фаза II → III', en: 'Phase II → III' }, all: 28.9, fda: 30.2, ema: 27.4 },
    { label: { ru: 'Фаза III → подача', en: 'Phase III → filing' }, all: 57.8, fda: 59.6, ema: 55.1 },
    { label: { ru: 'Подача → одобрение', en: 'Filing → approval' }, all: 90.6, fda: 91.8, ema: 88.2 },
  ],
  /** Доля препаратов из фазы I, дошедших до одобрения (произведение переходов), %. */
  total: { ru: 'Дошли до рынка из фазы I', en: 'Reached the market from phase I' },
  hint: { ru: 'Источник данных', en: 'Data source' },
};

/** Медианный срок рассмотрения заявки, месяцев, по годам (демо). */
export const review = {
  years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
  fda: [12.1, 11.4, 10.6, 10.2, 10.0, 10.4, 10.1, 9.8],
  ema: [14.8, 14.2, 13.9, 13.6, 13.1, 13.7, 13.3, 12.9],
  unit: { ru: 'мес.', en: 'mo' },
};

/** Терапевтические области (демо): сортируемая таблица. */
export const areas = {
  cols: [
    { key: 'area', label: { ru: 'Область', en: 'Area' }, type: 'text' },
    { key: 'programs', label: { ru: 'Программ', en: 'Programs' }, type: 'num' },
    { key: 'loa', label: { ru: 'Фаза I → рынок, %', en: 'Phase I → market, %' }, type: 'num' },
    { key: 'years', label: { ru: 'Путь, лет', en: 'Path, years' }, type: 'num' },
    { key: 'fda', label: { ru: 'Одобрено FDA', en: 'FDA approved' }, type: 'num' },
    { key: 'ema', label: { ru: 'Одобрено EMA', en: 'EMA approved' }, type: 'num' },
  ],
  rows: [
    { area: { ru: 'Онкология', en: 'Oncology' }, programs: 3412, loa: 5.3, years: 11.2, fda: 118, ema: 104 },
    { area: { ru: 'Гематология', en: 'Hematology' }, programs: 612, loa: 23.9, years: 9.1, fda: 41, ema: 37 },
    { area: { ru: 'Неврология', en: 'Neurology' }, programs: 1287, loa: 5.9, years: 12.4, fda: 46, ema: 39 },
    { area: { ru: 'Инфекции', en: 'Infectious diseases' }, programs: 1043, loa: 13.2, years: 9.6, fda: 63, ema: 58 },
    { area: { ru: 'Иммунология', en: 'Immunology' }, programs: 894, loa: 10.7, years: 10.3, fda: 38, ema: 35 },
    { area: { ru: 'Кардиология', en: 'Cardiology' }, programs: 701, loa: 4.8, years: 11.9, fda: 22, ema: 24 },
    { area: { ru: 'Офтальмология', en: 'Ophthalmology' }, programs: 318, loa: 11.9, years: 10.1, fda: 17, ema: 12 },
    { area: { ru: 'Метаболизм', en: 'Metabolic' }, programs: 655, loa: 7.4, years: 10.8, fda: 29, ema: 27 },
  ],
} as const;

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
