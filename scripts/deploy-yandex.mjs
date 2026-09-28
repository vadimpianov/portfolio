/**
 * Выкладка собранного сайта (dist/) в Yandex Object Storage — зеркало для России
 * (*.pages.dev и Cloudflare в РФ режутся). Адрес: https://<bucket>.website.yandexcloud.net
 *
 * Ключи — статический ключ сервисного аккаунта (роль storage.admin) в переменных окружения:
 *   YC_ACCESS_KEY_ID, YC_SECRET_ACCESS_KEY; имя бакета — YC_BUCKET (по умолчанию vadimpianov).
 *
 * Скрипт сам: создаёт бакет, если его нет; открывает публичное чтение; включает хостинг сайта
 * (index.html в каждой папке); заливает dist/ с правильными типами и кэшем; удаляет лишнее.
 * Корень `/` без функции Cloudflare: dist/index.html сам уводит на /ru/ или /en/
 * (cookie `lang` → язык браузера).
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketAclCommand,
  PutBucketWebsiteCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

const clean = (value) => (value ?? '').replace(/[<>\s]/g, '');
const accessKeyId = clean(process.env.YC_ACCESS_KEY_ID);
const secretAccessKey = clean(process.env.YC_SECRET_ACCESS_KEY);
const Bucket = clean(process.env.YC_BUCKET) || 'vadimpianov';
if (!accessKeyId || !secretAccessKey) {
  console.error('Нет YC_ACCESS_KEY_ID / YC_SECRET_ACCESS_KEY в окружении.');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  credentials: { accessKeyId, secretAccessKey },
});

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// HTML — всегда свежий; файлы с хэшем в имени (_astro/) — навсегда; остальное — сутки.
const cacheFor = (key) =>
  key.endsWith('.html')
    ? 'no-cache'
    : key.startsWith('_astro/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=86400';

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(path)));
    else out.push(path);
  }
  return out;
}

// 1. Бакет: создать, если нет; публичное чтение; хостинг сайта.
try {
  await s3.send(new HeadBucketCommand({ Bucket }));
} catch {
  console.log(`Создаю бакет ${Bucket}…`);
  await s3.send(new CreateBucketCommand({ Bucket }));
}
await s3.send(new PutBucketAclCommand({ Bucket, ACL: 'public-read' }));
await s3.send(
  new PutBucketWebsiteCommand({
    Bucket,
    WebsiteConfiguration: { IndexDocument: { Suffix: 'index.html' } },
  }),
);

// 2. Заливка dist/.
const root = 'dist';
const local = await files(root);
const keys = new Set();
for (const path of local) {
  const Key = relative(root, path).split('\\').join('/');
  keys.add(Key);
  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: await readFile(path),
      ContentType: TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
      CacheControl: cacheFor(Key),
    }),
  );
}
console.log(`Залито файлов: ${local.length}`);

// 3. Удалить из бакета то, чего больше нет в сборке.
const stale = [];
let ContinuationToken;
do {
  const page = await s3.send(new ListObjectsV2Command({ Bucket, ContinuationToken }));
  for (const object of page.Contents ?? []) if (!keys.has(object.Key)) stale.push({ Key: object.Key });
  ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
} while (ContinuationToken);
for (let i = 0; i < stale.length; i += 1000) {
  await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: stale.slice(i, i + 1000) } }));
}
console.log(`Удалено устаревших: ${stale.length}`);
console.log(`Готово: https://${Bucket}.website.yandexcloud.net/`);
