// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeTypograph from './src/i18n/rehype-typograph.ts';

// TODO: заменить на реальный домен, когда он появится.
const SITE = 'https://portfolio.pages.dev';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    // Типографика (висячие предлоги, тире) и в MDX-кейсах — как в строках интерфейса.
    mdx({ rehypePlugins: [rehypeTypograph] }),
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
