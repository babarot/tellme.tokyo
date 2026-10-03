// Checks that every post URL the Hugo site had (tools/old-urls.txt) still
// works on the built site: as a page in dist/, or through a redirect in
// public/_redirects to a page in dist/. A URL of a hidden post (`hidden: true`,
// never built) is gone on purpose and counted apart. Build with drafts first,
// since old posts come back one by one as drafts:
//   POST_STATES=published,draft pnpm build && pnpm check:urls
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2] ?? 'dist';

const lines = (file: string) =>
  fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

const urls = lines('tools/old-urls.txt');

// "/from  /to  301" rules; a trailing * in `from` matches any rest
const redirects = lines('public/_redirects').map((line) => {
  const [from, to] = line.split(/\s+/);
  return { from, to };
});

const redirect = (url: string) =>
  redirects.find(({ from }) => (from.endsWith('*') ? url.startsWith(from.slice(0, -1)) : url === from))?.to;

const built = (url: string) => fs.existsSync(path.join(DIST, url, 'index.html'));

// The URLs of hidden posts, from their front matter: /post/<date>/<slug>/ as
// src/lib/posts.ts makes them (the slug: front matter, else the folder name)
const hiddenUrls = new Set<string>();
for (const file of fs.readdirSync('content/post', { recursive: true, encoding: 'utf8' })) {
  if (!/(^|\/)index\.mdx?$/.test(file)) continue;
  const front = fs.readFileSync(path.join('content/post', file), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  if (!/^hidden:\s*true\s*$/m.test(front)) continue;
  const date = front.match(/^date:\s*["']?(\d{4})-(\d{2})-(\d{2})/m);
  const slug = front.match(/^slug:\s*["']?([^"'\s]+)/m)?.[1] ?? path.basename(path.dirname(file));
  if (date) hiddenUrls.add(`/post/${date[1]}/${date[2]}/${date[3]}/${slug}/`);
}

if (!fs.existsSync(DIST)) {
  console.error(`${DIST}/ not found: build first (POST_STATES=published,draft pnpm build)`);
  process.exit(1);
}

const missing: string[] = [];
const hidden: string[] = [];
let redirected = 0;
for (const url of urls) {
  if (built(url)) continue;
  const to = redirect(url);
  if (to && built(to)) {
    redirected++;
    continue;
  }
  if (hiddenUrls.has(url) || (to && hiddenUrls.has(to))) {
    hidden.push(url);
    continue;
  }
  missing.push(to ? `${url} -> ${to} (not built)` : url);
}

const pages = urls.length - redirected - hidden.length - missing.length;
console.log(`${urls.length} old URLs: ${pages} pages, ${redirected} redirects, ${hidden.length} hidden, ${missing.length} missing`);
for (const url of hidden) console.log(`  hidden: ${url}`);
for (const url of missing) console.log(`  missing: ${url}`);
process.exit(missing.length ? 1 : 0);
