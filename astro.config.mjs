// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// TODO: заменить на реальный домен, когда он появится.
const SITE = 'https://portfolio.pages.dev';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      // `/` — только редирект, в карту сайта не включаем.
      filter: (page) => new URL(page).pathname !== '/',
      i18n: { defaultLocale: 'en', locales: { ru: 'ru-RU', en: 'en-US' } },
    }),
  ],
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: true,
      // Редирект с `/` делает edge-функция `functions/index.ts` (по стране / cookie).
      redirectToDefaultLocale: false,
    },
  },
});
