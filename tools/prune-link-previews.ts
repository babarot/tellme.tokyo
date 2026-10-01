// Removes the link preview cache entries (.cache/link-previews.json) that no
// post uses any more: after a post is deleted or its links change. Reads every
// post, drafts too, and finds its cards the way the plugin does.
//   pnpm prune:link-previews [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { previewUrls } from '../src/plugins/link-preview/urls.ts';
import { prune, readCache, writeCache } from '../src/plugins/link-preview/cache.ts';

const CACHE = '.cache/link-previews.json'; // as in astro.config.ts
const POSTS = 'content/post';
const dryRun = process.argv.includes('--dry-run');

// Parsed like the site parses posts (GFM on, directives on)
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkDirective);

const used = new Set<string>();
const posts = fs
  .readdirSync(POSTS, { recursive: true, encoding: 'utf8' })
  .filter((f) => /(^|\/)index\.mdx?$/.test(f));
for (const post of posts) {
  const source = fs.readFileSync(path.join(POSTS, post), 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
  for (const url of previewUrls(parser.parse(source))) used.add(url);
}

const { kept, removed } = prune(readCache(CACHE), used);
console.log(`${posts.length} posts, ${used.size} card URLs; ${removed.length} unused in ${CACHE}${dryRun ? ' (dry run)' : ''}`);
for (const url of removed) console.log(`  - ${url}`);
if (!dryRun && removed.length) writeCache(CACHE, kept);
