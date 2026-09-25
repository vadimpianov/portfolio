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
    'home.heading': 'Архитектура, дизайн, процессы, ИИ',
    'home.lead':
      'Выстраиваю процессы вокруг дизайна, разрабатываю архитектуру продукта и принимаю участие в разработке фич. И всё это — при помощи ИИ.',
    'home.cases': 'Кейсы',
  },
  en: {
    'site.title': 'Vadim Pianov',
    'site.description': 'Portfolio of Vadim Pianov',
    'nav.home': 'Home',
    'lang.switch': 'Language',
    'home.heading': 'Architecture, design, processes, AI',
    'home.lead':
      'I build processes around design, shape the product architecture and take part in feature development. All of it — with the help of AI.',
    'home.cases': 'Cases',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['ru'];
