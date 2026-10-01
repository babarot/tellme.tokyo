import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCache, isFresh } from './cache';

const preview = (url: string) => ({ url, title: 'T', description: '', image: '', icon: '', siteName: 'example.com' });

let dir: string;
let file: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-preview-'));
  file = path.join(dir, 'sub', 'previews.json');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('isFresh', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  it('keeps a preview forever', () => {
    expect(isFresh({ ...preview('u'), fetchedAt: '2000-01-01T00:00:00Z' }, now, 30)).toBe(true);
  });
  it('keeps a failure until it is older than the retry period', () => {
    expect(isFresh({ url: 'u', failed: true, fetchedAt: '2026-09-02T00:00:00Z' }, now, 30)).toBe(true);
    expect(isFresh({ url: 'u', failed: true, fetchedAt: '2026-08-31T00:00:00Z' }, now, 30)).toBe(false);
  });
  it('has nothing for an unknown URL', () => {
    expect(isFresh(undefined, now, 30)).toBe(false);
  });
});

describe('createCache', () => {
  it('fetches once and saves to the file', async () => {
    const get = vi.fn(async (url: string) => preview(url));
    const cache = createCache({ file, now: () => new Date('2026-10-01T00:00:00Z') });
    const [a, b] = await Promise.all([cache.get('https://a/', get), cache.get('https://a/', get)]);
    expect(a).toEqual(b);
    expect(get).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))['https://a/']).toMatchObject({ title: 'T', fetchedAt: '2026-10-01T00:00:00.000Z' });

    // A new instance (the next build) reads the file instead of fetching
    const again = vi.fn(async (url: string) => preview(url));
    expect(await createCache({ file }).get('https://a/', again)).toMatchObject({ title: 'T' });
    expect(again).not.toHaveBeenCalled();
  });

  it('records a failure and tries again after the retry period', async () => {
    let now = new Date('2026-01-01T00:00:00Z');
    const failing = vi.fn(async () => {
      throw new Error('down');
    });
    expect(await createCache({ file, now: () => now }).get('https://a/', failing)).toBeNull();
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))['https://a/']).toMatchObject({ failed: true });

    const working = vi.fn(async (url: string) => preview(url));
    now = new Date('2026-01-10T00:00:00Z');
    expect(await createCache({ file, now: () => now }).get('https://a/', working)).toBeNull();
    now = new Date('2026-02-15T00:00:00Z');
    expect(await createCache({ file, now: () => now }).get('https://a/', working)).toMatchObject({ title: 'T' });
    expect(working).toHaveBeenCalledTimes(1);
  });
});
