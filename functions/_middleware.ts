/**
 * Cloudflare Pages: посетителей из России уводим на зеркало в Yandex Object Storage
 * (`*.pages.dev` в РФ режется) — тот же адрес страницы. Корень `/` — сразу на язык:
 * cookie `lang` (ручной выбор) → `ru`.
 * Работает только на страницах (`/`, `/ru/*`, `/en/*` — см. `public/_routes.json`), не на картинках и скриптах.
 */
const MIRROR = 'https://vadimpianov.website.yandexcloud.net';

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('Cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export const onRequest: PagesFunction = ({ request, next }) => {
  if (request.method !== 'GET' || request.cf?.country !== 'RU') return next();

  const url = new URL(request.url);
  const lang = getCookie(request, 'lang');
  const path = url.pathname === '/' ? `/${lang === 'en' ? 'en' : 'ru'}/` : url.pathname;

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${MIRROR}${path}${url.search}`,
      // Ответ зависит от страны и cookie — не кэшируем.
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie',
    },
  });
};
