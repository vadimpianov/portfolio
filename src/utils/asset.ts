import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const versions = new Map<string, string>();

/**
 * Адрес файла из `public/` с меткой версии по содержимому (`?v=…`): после замены картинки
 * браузер не показывает старую из кэша (на зеркале Яндекса картинки кэшируются на сутки).
 */
export function asset(path: string) {
  let version = versions.get(path);
  if (!version) {
    version = createHash('md5')
      .update(readFileSync(`public${path}`))
      .digest('hex')
      .slice(0, 8);
    versions.set(path, version);
  }
  return `${path}?v=${version}`;
}
