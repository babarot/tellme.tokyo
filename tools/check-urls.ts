// Checks that every post URL the Hugo site had (tools/old-urls.txt) still
// works on the built site: as a page in dist/, or through a redirect in
// public/_redirects to a page in dist/. Build with drafts first, since old
// posts come back one by one as drafts:
//   SHOW_DRAFTS=1 pnpm build && pnpm check:urls
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

if (!fs.existsSync(DIST)) {
  console.error(`${DIST}/ not found: build first (SHOW_DRAFTS=1 pnpm build)`);
  process.exit(1);
}

const missing: string[] = [];
let redirected = 0;
for (const url of urls) {
  if (built(url)) continue;
  const to = redirect(url);
  if (to && built(to)) {
    redirected++;
    continue;
  }
  missing.push(to ? `${url} -> ${to} (not built)` : url);
}

console.log(`${urls.length} old URLs: ${urls.length - missing.length - redirected} pages, ${redirected} redirects, ${missing.length} missing`);
for (const url of missing) console.log(`  missing: ${url}`);
process.exit(missing.length ? 1 : 0);
