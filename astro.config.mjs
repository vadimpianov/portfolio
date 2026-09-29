// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { typographPlugin } from './src/i18n/rehype-typograph.ts';

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
  // Типографика (висячие предлоги, тире) в Markdown/MDX-кейсах — как в строках интерфейса.
  // MDX берёт обработчик из markdown.
  markdown: { processor: satteri({ hastPlugins: [typographPlugin] }) },
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
