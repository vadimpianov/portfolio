import { getCollection } from 'astro:content';
import { isLocale } from './utils';
import type { Locale } from './ui';

/** `ru/cases/hello-world` → `{ locale: 'ru', slug: 'hello-world' }` */
export function parseCaseId(id: string): { locale: Locale; slug: string } {
  const [locale, , ...rest] = id.split('/');
  if (!isLocale(locale)) throw new Error(`Unknown locale in content id: ${id}`);
  return { locale, slug: rest.join('/') };
}

/** Кейсы локали. Черновики видны только в dev. */
export async function getCases(locale: Locale) {
  const all = await getCollection(
    'cases',
    (entry) => parseCaseId(entry.id).locale === locale && (import.meta.env.DEV || !entry.data.draft),
  );
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
