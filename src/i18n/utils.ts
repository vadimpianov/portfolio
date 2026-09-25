import { defaultLocale, locales, ui, type Locale, type UIKey } from './ui';

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Локаль из URL вида `/ru/...`. */
export function getLocaleFromUrl(url: URL): Locale {
  const [, first] = url.pathname.split('/');
  return isLocale(first) ? first : defaultLocale;
}

export function useTranslations(locale: Locale) {
  return (key: UIKey): string => ui[locale][key];
}

/** Ссылка внутри текущей локали: `localePath('ru', 'cases/foo')` → `/ru/cases/foo/`. */
export function localePath(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}

/** Тот же путь в другой локали: `/ru/cases/foo/` → `/en/cases/foo/`. */
export function switchLocalePath(url: URL, target: Locale): string {
  const parts = url.pathname.split('/');
  if (isLocale(parts[1])) parts[1] = target;
  else parts.splice(1, 0, target);
  return parts.join('/') || `/${target}/`;
}

export function getLocaleStaticPaths() {
  return locales.map((lang) => ({ params: { lang } }));
}
