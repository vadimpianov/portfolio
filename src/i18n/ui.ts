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
    'home.intro.title': 'Продуктовый дизайнер и многое другое',
    // Первое слово заголовка по очереди переворачивается и меняется на эти (через «|»).
    'home.intro.flip': 'Senior UI/UX|Ведущий|Lead|Senior Product',
    'home.intro.lead':
      'Проектирую архитектуру и ежедневно работаю над продуктовыми задачами, выстраиваю дизайн-процессы, принимаю участие в формировании фич и довожу решения до реализации. Использую ИИ как полноценный рабочий инструмент на всём пути — от идеи и исследования до дизайна, прототипирования и кода.',
    'home.intro.chip.1': 'Продуктовый дизайн',
    'home.intro.chip.2': 'Построение процессов вокруг дизайна',
    'home.intro.chip.3': 'Внедрение ИИ',
    'home.intro.chip.4': 'Работа с аналитикой и конкурентами',
    'home.intro.chip.5': 'Управление командой и повышение её эффективности',
    'home.intro.chip.6': 'Разработка дизайн-систем',
    'home.cases': 'Кейсы',
    'case.close': 'Закрыть',
    'case.slider.show': 'Показать экран',
    'case.tabs': 'Сценарии',
    'case.soon': 'Кейс в разработке',
    'case.wireframe': 'Вайрфрейм',
    'case.design': 'Дизайн',
    'case.compare': 'Сравнить вайрфрейм и дизайн',
    'tiles.1.title': 'Альфа Банк',
    'tiles.2.title': 'Betting app',
    'tiles.2.lead':
      'Выстроил дизайн-процесс и пересобрал ключевые revenue-сценарии — повысил конверсию в завершённую регистрацию и первое пополнение на 48% и 44% соответственно',
    'tiles.3.title': 'Quantori',
    'tiles.3.lead':
      'Привёл десятки таблиц и графиков базы знаний о лекарствах к единой системе и свёл данные FDA и EMA — аналитики работают без перерыва 41 минуту вместо 18',
    'tiles.4.title': 'Метр квадратный',
    'tiles.4.lead':
      'Объединил пять разрозненных сервисов недвижимости в экосистему и за 4 месяца вывел MVP — сократил ипотечную анкету на 40% и поднял retention на 27%',
    'tiles.5.title': 'BelkaCar',
    'tiles.6.title': 'MAPS.ME',
    'tiles.7.title': 'Revo Технологии',
    'tiles.8.title': 'LEXION development',
    'tiles.9.title': 'Лига Ставок',
    'tiles.10.title': 'Hyperboloid Agency',
    'tiles.5.lead': 'Переработал сайт и приложения второго по величине каршеринга по отзывам и UX-тестам',
    'tiles.6.lead': 'Руководил дизайном, запустил сайт и приложения, встроил криптосервис Parity',
    'tiles.7.lead': 'Проектировал сценарии рассрочки на сайтах партнёров — от выбора товара до оплаты',
    'tiles.8.lead': 'Обновил сайты жилого девелопера: изучил конкурентов и улучшил подачу проектов',
    'tiles.9.lead': 'Переработал iOS- и Android-приложения крупного букмекера на основе анализа рынка',
    'tiles.10.lead': 'Строил стратегию и дизайн клиентских продуктов на основе исследований и видения',
    'about.title': 'Обо мне',
    'about.contacts': 'Контакты',
    'about.phone.label': 'Телефон',
    'about.qr.hint': 'Нажмите на QR-код, чтобы открыть чат',
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
    'home.intro.title': 'Product designer and much more',
    'home.intro.flip': 'Senior UI/UX|Lead|Senior Product',
    'home.intro.lead':
      'I design architecture and work on product tasks every day, build design processes, help shape features and see solutions through to implementation. I use AI as a full-fledged working tool along the whole way — from idea and research to design, prototyping and code.',
    'home.intro.chip.1': 'Product design',
    'home.intro.chip.2': 'Building processes around design',
    'home.intro.chip.3': 'AI adoption',
    'home.intro.chip.4': 'Analytics and competitor research',
    'home.intro.chip.5': 'Leading the team and raising its efficiency',
    'home.intro.chip.6': 'Building design systems',
    'home.cases': 'Cases',
    'case.close': 'Close',
    'case.slider.show': 'Show screen',
    'case.tabs': 'Scenarios',
    'case.soon': 'Case in progress',
    'case.wireframe': 'Wireframe',
    'case.design': 'Design',
    'case.compare': 'Compare wireframe and design',
    'tiles.1.title': 'Alfa-Bank',
    'tiles.2.title': 'Betting app',
    'tiles.2.lead':
      'Built the design process and reworked the key revenue flows — lifting conversion to completed registration and first deposit by 48% and 44% respectively',
    'tiles.3.title': 'Quantori',
    'tiles.3.lead':
      'Brought dozens of tables and charts in a drug knowledge base into one system and unified FDA and EMA data — analysts now work 41 minutes without a break instead of 18',
    'tiles.4.title': 'Metr Kvadratny',
    'tiles.4.lead':
      'Brought five disparate real-estate services into one ecosystem and shipped the MVP in 4 months — cut the mortgage form by 40% and lifted retention by 27%',
    'tiles.5.title': 'BelkaCar',
    'tiles.6.title': 'MAPS.ME',
    'tiles.7.title': 'Revo Technologies',
    'tiles.8.title': 'LEXION development',
    'tiles.9.title': 'Liga Stavok',
    'tiles.10.title': 'Hyperboloid Agency',
    'tiles.5.lead': 'Redesigned a top car sharing website and apps based on support feedback and UX tests',
    'tiles.6.lead': 'Led design, launched the website and apps and built the Parity crypto service into Maps.me',
    'tiles.7.lead': 'Designed buy-now-pay-later flows on partner websites, from choosing a product to payment',
    'tiles.8.lead': 'Refreshed a residential developer’s websites: studied competitors and rebuilt project pages',
    'tiles.9.lead': 'Redesigned the iOS and Android apps of a major bookmaker based on market analysis',
    'tiles.10.lead': 'Shaped product strategy and design for agency clients, from research to interfaces',
    'about.title': 'About me',
    'about.contacts': 'Contacts',
    'about.phone.label': 'Phone',
    'about.qr.hint': 'Tap a QR code to open the chat',
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
