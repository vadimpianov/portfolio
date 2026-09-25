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
  }),
});

export const collections = { cases };
