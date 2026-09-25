/**
 * Cloudflare Pages Function: срабатывает только на `/`.
 * Приоритет: cookie `lang` (ручной выбор) → страна посетителя → `en`.
 */
const LOCALES = ['ru', 'en'] as const;
type Locale = (typeof LOCALES)[number];

const isLocale = (value: string | undefined): value is Locale =>
  !!value && (LOCALES as readonly string[]).includes(value);

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('Cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export const onRequestGet: PagesFunction = ({ request }) => {
  const fromCookie = getCookie(request, 'lang');
  const country = request.cf?.country;
  const locale: Locale = isLocale(fromCookie) ? fromCookie : country === 'RU' ? 'ru' : 'en';

  const url = new URL(request.url);
  url.pathname = `/${locale}/`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      // Ответ зависит от cookie и страны — не кэшируем.
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie',
    },
  });
};
