import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Кейсы лежат в `src/content/{ru,en}/cases/*.mdx`.
 * id записи: `ru/cases/slug` — локаль и slug берём через `parseCaseId`.
 */
const cases = defineCollection({
  loader: glob({ base: './src/content', pattern: '*/cases/**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    /** Годы работы над проектом, «2023–2024». */
    period: z.string().optional(),
    /** Отрасль и платформы — чипсы под заголовком. */
    tags: z.array(z.string()).default([]),
    /** Тёмная тема страницы — под тёмные макеты кейса. */
    theme: z.enum(['light', 'dark']).default('light'),
    /** Обложка справа от заголовка: имя картинки в `public/images/cases/` (`<имя>-{600,1200}.webp`). */
    cover: z.string().optional(),
    /** Обложка-слайдер вместо картинки: экраны слева направо (`public/images/cases/<имя>.webp`), первым показан средний. */
    slides: z.array(z.string()).optional(),
  }),
});

export const collections = { cases };
