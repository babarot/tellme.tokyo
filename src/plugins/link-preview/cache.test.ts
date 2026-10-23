import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCache, isFresh, needsImage, prune, readCache, unusedImages, writeCache } from './cache';

const preview = (url: string) => ({ url, title: 'T', description: '', image: '', icon: '', siteName: 'example.com' });
const withImage = (url: string) => ({ ...preview(url), image: 'https://img/og.png' });

let dir: string;
let file: string;
let imageDir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-preview-'));
  file = path.join(dir, 'sub', 'previews.json');
  imageDir = path.join(dir, 'images');
});
const saveAs = (name: string) =>
  vi.fn(async () => {
    fs.mkdirSync(imageDir, { recursive: true });
    fs.writeFileSync(path.join(imageDir, name), '');
    return { file: name, width: 2, height: 1 };
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
    const cache = createCache({ file, imageDir, now: () => new Date('2026-10-01T00:00:00Z') });
    const [a, b] = await Promise.all([cache.get('https://a/', get), cache.get('https://a/', get)]);
    expect(a).toEqual(b);
    expect(get).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))['https://a/']).toMatchObject({ title: 'T', fetchedAt: '2026-10-01T00:00:00.000Z' });

    // A new instance (the next build) reads the file instead of fetching
    const again = vi.fn(async (url: string) => preview(url));
    expect(await createCache({ file, imageDir }).get('https://a/', again)).toMatchObject({ title: 'T' });
    expect(again).not.toHaveBeenCalled();
  });

  it('records a failure and tries again after the retry period', async () => {
    let now = new Date('2026-01-01T00:00:00Z');
    const failing = vi.fn(async () => {
      throw new Error('down');
    });
    expect(await createCache({ file, imageDir, now: () => now }).get('https://a/', failing)).toBeNull();
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))['https://a/']).toMatchObject({ failed: true });

    const working = vi.fn(async (url: string) => preview(url));
    now = new Date('2026-01-10T00:00:00Z');
    expect(await createCache({ file, imageDir, now: () => now }).get('https://a/', working)).toBeNull();
    now = new Date('2026-02-15T00:00:00Z');
    expect(await createCache({ file, imageDir, now: () => now }).get('https://a/', working)).toMatchObject({ title: 'T' });
    expect(working).toHaveBeenCalledTimes(1);
  });
});

describe('needsImage', () => {
  const now = new Date('2026-10-01T00:00:00Z');
  const entry = { ...withImage('u'), fetchedAt: 'x' };
  it('wants an image that is not saved yet', () => {
    expect(needsImage(entry, () => true, now, 30)).toBe(true);
  });
  it('is done once the file is there, and again when it is gone', () => {
    const done = { ...entry, localImage: { file: 'a.webp', width: 2, height: 1 } };
    expect(needsImage(done, () => true, now, 30)).toBe(false);
    expect(needsImage(done, () => false, now, 30)).toBe(true);
  });
  it('waits out the retry period after a failure', () => {
    expect(needsImage({ ...entry, imageFailedAt: '2026-09-02T00:00:00Z' }, () => true, now, 30)).toBe(false);
    expect(needsImage({ ...entry, imageFailedAt: '2026-08-31T00:00:00Z' }, () => true, now, 30)).toBe(true);
  });
  it('has nothing to do for a page without an image', () => {
    expect(needsImage({ ...preview('u'), fetchedAt: 'x' }, () => false, now, 30)).toBe(false);
  });
});

describe('createCache image', () => {
  it('saves once per image URL and records it', async () => {
    const save = saveAs('a.webp');
    const cache = createCache({ file, imageDir });
    const get = async (url: string) => withImage(url);
    await Promise.all([cache.get('https://a/', get), cache.get('https://b/', get)]);
    const [a, b] = await Promise.all([cache.image('https://a/', save), cache.image('https://b/', save)]);
    expect(a).toEqual({ file: 'a.webp', width: 2, height: 1 });
    expect(b).toEqual(a);
    expect(save).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))['https://b/'].localImage).toEqual(a);

    // The next build uses the saved file
    const again = saveAs('b.webp');
    expect(await createCache({ file, imageDir }).image('https://a/', again)).toEqual(a);
    expect(again).not.toHaveBeenCalled();
  });

  it('records a failure and keeps the card without an image', async () => {
    const cache = createCache({ file, imageDir, now: () => new Date('2026-10-01T00:00:00Z') });
    await cache.get('https://a/', async (url) => withImage(url));
    expect(await cache.image('https://a/', async () => null)).toBeNull();
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))['https://a/']).toMatchObject({ imageFailedAt: '2026-10-01T00:00:00.000Z' });
  });
});

describe('unusedImages', () => {
  it('lists the files no entry names', () => {
    const entries = { 'https://a/': { ...withImage('https://a/'), fetchedAt: 'x', localImage: { file: 'a.webp', width: 2, height: 1 } } };
    expect(unusedImages(entries, ['a.webp', 'b.webp'])).toEqual(['b.webp']);
  });
});

describe('prune', () => {
  const entry = (url: string) => ({ ...preview(url), fetchedAt: '2026-10-01T00:00:00Z' });

  it('keeps the entries in use and lists the rest', () => {
    const entries = { 'https://a/': entry('https://a/'), 'https://b/': { url: 'https://b/', failed: true as const, fetchedAt: 'x' } };
    expect(prune(entries, new Set(['https://a/']))).toEqual({ kept: { 'https://a/': entries['https://a/'] }, removed: ['https://b/'] });
  });

  it('removes nothing when every entry is in use', () => {
    expect(prune({ 'https://a/': entry('https://a/') }, new Set(['https://a/', 'https://c/'])).removed).toEqual([]);
  });
});

describe('readCache / writeCache', () => {
  it('writes sorted by URL and reads it back', () => {
    writeCache(file, { 'https://b/': preview('https://b/') as any, 'https://a/': preview('https://a/') as any });
    expect(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8')))).toEqual(['https://a/', 'https://b/']);
    expect(Object.keys(readCache(file))).toEqual(['https://a/', 'https://b/']);
  });

  it('reads a missing file as empty', () => {
    expect(readCache(file)).toEqual({});
  });
});
