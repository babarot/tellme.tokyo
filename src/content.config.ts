import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Posts: content/post/<year>/<slug>/index.mdx, or index.md for the posts
// migrated from Hugo (tools/hugo-to-astro.py)
const SOURCES = ['content/post/**/index.{md,mdx}'];

const post = defineCollection({
  loader: glob({
    pattern: SOURCES,
    base: '.',
    // "content/post/2026/foo/index.mdx" -> "2026/foo"
    generateId: ({ entry }) => entry.replace(/^content\/post\//, '').replace(/\/index\.mdx?$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    // Kept as the raw string: the URL takes YYYY-MM-DD from it as written,
    // which is what Hugo did, so no timezone conversion can shift the day.
    // An unquoted YAML date (date: 2026-09-27) arrives as a Date at UTC midnight.
    date: z
      .union([z.string(), z.date()])
      .transform((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : d))
      .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    slug: z.string().optional(),
    description: z.string().optional().default(''),
    // draft: still being written; built only in dev and previews.
    // hidden: withdrawn; never built for production or previews, as if the
    // post did not exist (only a local build asked for it: src/lib/posts.ts).
    draft: z.boolean().optional().default(false),
    hidden: z.boolean().optional().default(false),
    // show a table of contents (h2 and h3)
    toc: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { post };
