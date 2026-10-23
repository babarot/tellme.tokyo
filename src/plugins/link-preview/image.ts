// A page's image, fetched once and kept as a small WebP next to the site's
// files, so a card never asks the linked site for it again: hotlinked images
// break when a host rate limits (opengraph.githubassets.com answers 429) or
// goes away. The file is named by the hash of what it holds, so the same
// image linked from several pages is one file, and a changed image gets a new
// URL. Not cropped: the card fits it in its box (style.css).
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Fetch } from './fetch';

export type SavedImage = { file: string; width: number; height: number };

/** the longest side kept, in px: a full-width card on a phone at 2x */
export const MAX_SIZE = 960;

const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  accept: 'image/avif,image/webp,image/png,image/*;q=0.8',
};

// How long to wait before trying again after a 429 or 503 (pure): the
// Retry-After header (seconds or a date) when it says, else a growing delay.
export function retryDelay(retryAfter: string | null, attempt: number, now = Date.now()): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const ms = Number.isFinite(seconds) ? seconds * 1000 : new Date(retryAfter).getTime() - now;
    if (ms >= 0) return Math.min(ms, 60_000);
  }
  return 2_000 * 2 ** attempt;
}

// One request at a time per host, so a post with many GitHub cards does not
// set off the host's rate limit.
const queues = new Map<string, Promise<unknown>>();
function oneAtATime<T>(url: string, task: () => Promise<T>): Promise<T> {
  const host = new URL(url).host;
  const run = (queues.get(host) ?? Promise.resolve()).then(task, task);
  queues.set(host, run.catch(() => {}));
  return run;
}

async function download(url: string, get: Fetch, sleep: (ms: number) => Promise<void>, tries = 4): Promise<Uint8Array | null> {
  for (let attempt = 0; attempt < tries; attempt++) {
    const res = await get(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(15_000) });
    if (res.status === 429 || res.status === 503) {
      if (attempt < tries - 1) await sleep(retryDelay(res.headers.get('retry-after'), attempt));
      continue;
    }
    if (!res.ok || !/^image\//i.test(res.headers.get('content-type') ?? 'image/')) return null;
    return new Uint8Array(await res.arrayBuffer());
  }
  return null;
}

export type SaveOptions = {
  /** where the files go */
  dir: string;
  fetch?: Fetch;
  sleep?: (ms: number) => Promise<void>;
};

export async function saveImage(url: string, { dir, fetch: get = fetch, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }: SaveOptions): Promise<SavedImage | null> {
  const bytes = await oneAtATime(url, () => download(url, get, sleep));
  if (!bytes) return null;
  const { data, info } = await sharp(bytes)
    .rotate()
    .resize({ width: MAX_SIZE, height: MAX_SIZE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const file = `${createHash('sha256').update(data).digest('hex')}.webp`;
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, file);
  if (!fs.existsSync(target)) fs.writeFileSync(target, data);
  return { file, width: info.width, height: info.height };
}
