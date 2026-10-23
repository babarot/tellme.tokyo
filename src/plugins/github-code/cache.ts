// The lines each directive showed, kept in a JSON file (commit it), so a build
// does not depend on GitHub, and a post keeps showing what it quoted after the
// file changes or goes away. Only what was read is kept: a failed fetch is
// tried again on the next build.
import fs from 'node:fs';
import path from 'node:path';

export type Entry = { code: string; fetchedAt: string };
export type Entries = Record<string, Entry>;

export function readCache(file: string): Entries {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

// Sorted by URL, so the committed file changes only where an entry does
export function writeCache(file: string, entries: Entries) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
}

export function createCache({ file, now = () => new Date() }: { file: string; now?: () => Date }) {
  let entries: Entries | undefined;
  const load = () => (entries ??= readCache(file));
  // One fetch per URL even when several posts quote it at once.
  const pending = new Map<string, Promise<string | null>>();

  return {
    // The code for `url`, from the cache or else from `read` (null: could not
    // be read; an error from `read` is passed on and nothing is kept).
    async get(url: string, read: () => Promise<string | null>): Promise<string | null> {
      const cached = load()[url];
      if (cached) return cached.code;
      if (!pending.has(url)) {
        pending.set(
          url,
          read().then((code) => {
            if (code !== null) {
              load()[url] = { code, fetchedAt: now().toISOString() };
              writeCache(file, load());
            }
            return code;
          }),
        );
      }
      return pending.get(url)!;
    },
  };
}
