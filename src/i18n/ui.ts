export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
};

export const ui = {
  ru: {
    'site.title': 'Вадим Пьянов',
    'site.description': 'Портфолио Вадима Пьянова',
    'nav.home': 'Главная',
    'lang.switch': 'Язык',
    'home.heading': 'Вадим Пьянов',
    'home.lead': 'Сайт в разработке.',
    'home.cases': 'Кейсы',
  },
  en: {
    'site.title': 'Vadim Pianov',
    'site.description': 'Portfolio of Vadim Pianov',
    'nav.home': 'Home',
    'lang.switch': 'Language',
    'home.heading': 'Vadim Pianov',
    'home.lead': 'Site under construction.',
    'home.cases': 'Cases',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['ru'];
