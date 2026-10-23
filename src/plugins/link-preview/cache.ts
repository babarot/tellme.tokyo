// Previews kept in a JSON file (commit it), so a build does not depend on the
// linked sites being up, and a dead site keeps its card. A failed fetch is
// kept too, and tried again once it is older than `retryAfterDays`. The same
// goes for a preview's image, saved as a file (image.ts) and named here.
import fs from 'node:fs';
import path from 'node:path';
import type { SavedImage } from './image';
import type { Preview } from './parse';

export type PreviewEntry = Preview & {
  fetchedAt: string;
  /** the saved copy of `image` */
  localImage?: SavedImage;
  /** when saving `image` last failed */
  imageFailedAt?: string;
};
export type Entry = PreviewEntry | { url: string; failed: true; fetchedAt: string };

export type CacheOptions = {
  file: string;
  /** where the saved images are */
  imageDir: string;
  /** days before a failed fetch is tried again. Default 30 */
  retryAfterDays?: number;
  now?: () => Date;
};

// Whether an entry is still good to use (pure).
export function isFresh(entry: Entry | undefined, now: Date, retryAfterDays: number): entry is Entry {
  if (!entry) return false;
  if (!('failed' in entry)) return true;
  return !olderThan(entry.fetchedAt, now, retryAfterDays);
}

const olderThan = (date: string, now: Date, days: number) => now.getTime() - new Date(date).getTime() >= days * 86_400_000;

// Whether to try saving a preview's image (pure): it has one, it is not saved
// yet (or the file is gone), and the last failure is older than the retry period.
export function needsImage(entry: PreviewEntry, saved: (file: string) => boolean, now: Date, retryAfterDays: number): boolean {
  if (!entry.image) return false;
  if (entry.localImage && saved(entry.localImage.file)) return false;
  return !entry.imageFailedAt || olderThan(entry.imageFailedAt, now, retryAfterDays);
}

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

// The entries no post uses any more (pure): `used` is every card URL of every
// post. Run by tools/prune-link-previews.ts, not by builds: a build converts
// only the posts that changed, so it does not see every URL.
export function prune(entries: Entries, used: Set<string>): { kept: Entries; removed: string[] } {
  const removed = Object.keys(entries).filter((url) => !used.has(url));
  const kept = Object.fromEntries(Object.entries(entries).filter(([url]) => used.has(url)));
  return { kept, removed };
}

// The image files no entry names (pure), after prune: an image shared by
// several pages stays while one of them is kept.
export function unusedImages(entries: Entries, files: string[]): string[] {
  const named = new Set(Object.values(entries).flatMap((e) => ('localImage' in e && e.localImage ? [e.localImage.file] : [])));
  return files.filter((f) => !named.has(f));
}

export function createCache({ file, imageDir, retryAfterDays = 30, now = () => new Date() }: CacheOptions) {
  let entries: Entries | undefined;
  const load = () => (entries ??= readCache(file));
  const save = () => writeCache(file, load());
  // One fetch per URL even when several posts link it at once.
  const pending = new Map<string, Promise<Preview | null>>();
  const pendingImages = new Map<string, Promise<SavedImage | null>>();
  const saved = (name: string) => fs.existsSync(path.join(imageDir, name));

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

    // The saved copy of the image of the preview for `url` (after get), saving
    // it first when needed. null: no image, or it could not be saved.
    async image(url: string, saveImage: (imageUrl: string) => Promise<SavedImage | null>): Promise<SavedImage | null> {
      const entry = load()[url];
      if (!entry || 'failed' in entry) return null;
      if (!needsImage(entry, saved, now(), retryAfterDays)) return entry.localImage && saved(entry.localImage.file) ? entry.localImage : null;
      // One save per image URL, also when several pages share it.
      if (!pendingImages.has(entry.image)) pendingImages.set(entry.image, saveImage(entry.image).catch(() => null));
      const image = await pendingImages.get(entry.image)!;
      if (image) {
        entry.localImage = image;
        delete entry.imageFailedAt;
      } else {
        entry.imageFailedAt = now().toISOString();
      }
      save();
      return image;
    },
  };
}
