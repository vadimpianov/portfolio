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
    'home.intro.title': 'Архитектура, дизайн, процессы, ИИ',
    'home.intro.lead':
      'Выстраиваю процессы вокруг дизайна, разрабатываю архитектуру продукта и принимаю участие в разработке фич. И всё это — при помощи ИИ.',
    'home.cases': 'Кейсы',
    'tiles.placeholder.title': 'Проект',
    'tiles.placeholder.lead':
      'Короткое описание кейса: какая была задача, что я сделал и к какому результату это привело.',
  },
  en: {
    'site.title': 'Vadim Pianov',
    'site.description': 'Portfolio of Vadim Pianov',
    'nav.home': 'Home',
    'lang.switch': 'Language',
    'home.heading': 'Vadim Pianov',
    'home.intro.title': 'Architecture, design, processes, AI',
    'home.intro.lead':
      'I build processes around design, shape the product architecture and take part in feature development. All of it — with the help of AI.',
    'home.cases': 'Cases',
    'tiles.placeholder.title': 'Project',
    'tiles.placeholder.lead': 'A short case summary: what the problem was, what I did and what it led to.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['ru'];
