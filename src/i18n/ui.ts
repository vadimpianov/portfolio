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
    'home.intro.chip.1': 'Продуктовый дизайн',
    'home.intro.chip.2': 'Построение процессов вокруг дизайна',
    'home.intro.chip.3': 'Внедрение ИИ',
    'home.intro.chip.4': 'Работа с аналитикой и конкурентами',
    'home.intro.chip.5': 'Управление командой и повышение её эффективности',
    'home.intro.chip.6': 'Разработка дизайн-системы',
    'home.cases': 'Кейсы',
    'tiles.1.title': 'Альфа Банк',
    'tiles.2.title': 'Betting',
    'tiles.3.title': 'Quantori',
    'tiles.4.title': 'Метр квадратный',
    'tiles.5.title': 'BelkaCar',
    'tiles.6.title': 'MAPS.ME',
    'tiles.7.title': 'Revo Технологии',
    'tiles.8.title': 'LEXION development',
    'tiles.9.title': 'Лига Ставок',
    'tiles.10.title': 'Hyperboloid Agency',
    'about.title': 'Обо мне',
    'about.p1':
      'За годы работы я **сотрудничал с ведущими** продуктовыми компаниями, стартапами и агентствами из совершенно разных сфер — **каршеринг, беттинг, строительные компании, банки и криптобанки, недвижимость**.',
    'about.p2':
      'В своей практике я придерживаюсь позиции, что дизайнер **должен быть командным игроком** — это очень эффективно. Я много общаюсь с продуктовой командой, всегда стараюсь помочь ей и найти лучшее решение задачи.',
    'about.p3':
      'Конечно, всегда приятно получить точное техническое задание со всеми артефактами, но в целом для меня это не критично. **У меня хорошие аналитические навыки**, и я всегда легко нахожу всю нужную информацию.',
    'about.p4':
      '**Я использую аналитику и пользовательские тесты**, которые провожу сам, напрямую общаясь с пользователями. А если в компании этих инструментов ещё нет, я изучу лучшие практики рынка, **применю LEAN-методологию и запущу MVP**, чтобы проверить гипотезы. Особенно это актуально для стартапов.',
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
    'home.intro.chip.1': 'Product design',
    'home.intro.chip.2': 'Building processes around design',
    'home.intro.chip.3': 'AI adoption',
    'home.intro.chip.4': 'Analytics and competitor research',
    'home.intro.chip.5': 'Leading the team and raising its efficiency',
    'home.intro.chip.6': 'Building a design system',
    'home.cases': 'Cases',
    'tiles.1.title': 'Alfa-Bank',
    'tiles.2.title': 'Betting',
    'tiles.3.title': 'Quantori',
    'tiles.4.title': 'Metr Kvadratny',
    'tiles.5.title': 'BelkaCar',
    'tiles.6.title': 'MAPS.ME',
    'tiles.7.title': 'Revo Technologies',
    'tiles.8.title': 'LEXION development',
    'tiles.9.title': 'Liga Stavok',
    'tiles.10.title': 'Hyperboloid Agency',
    'about.title': 'About me',
    'about.p1':
      'Over the years **I’ve worked with leading** product companies, startups and agencies in completely different areas — **carsharing, betting, construction, banks and crypto banks, real estate**.',
    'about.p2':
      'In my practice I hold that a designer **must be a team player** — it’s very effective. I communicate a lot with the product team, always try to help and find the best solution to the problem.',
    'about.p3':
      'Of course, it’s always nice to get a precise brief with all the artefacts, but in general it’s not critical for me. **I have strong analytical skills** and can always find the information I need.',
    'about.p4':
      '**I use analytics and user tests**, which I run myself by talking directly to users. And if the company doesn’t have these tools yet, I study the market’s best practices, **apply the LEAN methodology and launch an MVP** to test hypotheses. This is especially relevant for startups.',
    'tiles.placeholder.lead': 'A short case summary: what the problem was, what I did and what it led to.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UIKey = keyof (typeof ui)['ru'];
