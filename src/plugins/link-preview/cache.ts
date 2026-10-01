// Previews kept in a JSON file (commit it), so a build does not depend on the
// linked sites being up, and a dead site keeps its card. A failed fetch is
// kept too, and tried again once it is older than `retryAfterDays`.
import fs from 'node:fs';
import path from 'node:path';
import type { Preview } from './parse';

export type Entry = (Preview & { fetchedAt: string }) | { url: string; failed: true; fetchedAt: string };

export type CacheOptions = {
  file: string;
  /** days before a failed fetch is tried again. Default 30 */
  retryAfterDays?: number;
  now?: () => Date;
};

// Whether an entry is still good to use (pure).
export function isFresh(entry: Entry | undefined, now: Date, retryAfterDays: number): entry is Entry {
  if (!entry) return false;
  if (!('failed' in entry)) return true;
  return now.getTime() - new Date(entry.fetchedAt).getTime() < retryAfterDays * 86_400_000;
}

export function createCache({ file, retryAfterDays = 30, now = () => new Date() }: CacheOptions) {
  let entries: Record<string, Entry> | undefined;
  const load = () => (entries ??= fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {});
  const save = () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const sorted = Object.fromEntries(Object.entries(load()).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
  };
  // One fetch per URL even when several posts link it at once.
  const pending = new Map<string, Promise<Preview | null>>();

  return {
    async get(url: string, fetchPreview: (url: string) => Promise<Preview | null>): Promise<Preview | null> {
      const cached = load()[url];
      if (isFresh(cached, now(), retryAfterDays)) return 'failed' in cached ? null : cached;
      if (!pending.has(url)) {
        pending.set(
          url,
          fetchPreview(url)
            .catch(() => null)
            .then((preview) => {
              const fetchedAt = now().toISOString();
              load()[url] = preview ? { ...preview, fetchedAt } : { url, failed: true, fetchedAt };
              save();
              return preview;
            }),
        );
      }
      return pending.get(url)!;
    },
  };
}
