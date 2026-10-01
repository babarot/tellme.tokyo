import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Posts come from two places:
// - content/post: the posts of the site. Only new-format posts (index.mdx) are
//   read for now; the Hugo-era .md posts there join once they are migrated.
// - sample/post: hand-picked copies for the design work, local only (gitignored),
//   so it is simply empty anywhere else.
const SOURCES = ['content/post/**/index.mdx', 'sample/post/**/index.{md,mdx}'];

const post = defineCollection({
  loader: glob({
    pattern: SOURCES,
    base: '.',
    // "content/post/2026/foo/index.mdx" -> "2026/foo"
    generateId: ({ entry }) => entry.replace(/^(content|sample)\/post\//, '').replace(/\/index\.mdx?$/, ''),
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
    draft: z.boolean().optional().default(false),
    // show a table of contents (h2 and h3)
    toc: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { post };
