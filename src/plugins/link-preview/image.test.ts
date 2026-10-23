import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryDelay, saveImage } from './image';

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-preview-image-'));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#888' } }).png().toBuffer();
const image = async (width: number, height: number) =>
  new Response(new Uint8Array(await png(width, height)), { status: 200, headers: { 'content-type': 'image/png' } });
const noWait = async () => {};

describe('retryDelay', () => {
  it('follows Retry-After in seconds or as a date', () => {
    expect(retryDelay('3', 0)).toBe(3000);
    expect(retryDelay(new Date(10_000).toUTCString(), 0, 5_000)).toBe(5000);
  });
  it('backs off when the host does not say', () => {
    expect([0, 1, 2].map((n) => retryDelay(null, n))).toEqual([2000, 4000, 8000]);
  });
});

describe('saveImage', () => {
  it('shrinks to fit 960 px without cropping, as WebP named by its content', async () => {
    const saved = await saveImage('https://a.example/og.png', { dir, fetch: (async () => image(1200, 600)) as any });
    expect(saved).toMatchObject({ width: 960, height: 480 });
    expect(saved!.file).toMatch(/^[0-9a-f]{64}\.webp$/);
    expect((await sharp(path.join(dir, saved!.file)).metadata()).format).toBe('webp');
  });

  it('keeps a small image at its size', async () => {
    expect(await saveImage('https://b.example/a.png', { dir, fetch: (async () => image(200, 200)) as any })).toMatchObject({ width: 200, height: 200 });
  });

  it('gives the same file for the same image', async () => {
    const get = (async () => image(400, 200)) as any;
    const a = await saveImage('https://c.example/1.png', { dir, fetch: get });
    const b = await saveImage('https://c.example/2.png', { dir, fetch: get });
    expect(a!.file).toBe(b!.file);
    expect(fs.readdirSync(dir)).toHaveLength(1);
  });

  it('tries again after a 429', async () => {
    let calls = 0;
    const get = vi.fn(async () => (++calls < 3 ? new Response('', { status: 429, headers: { 'retry-after': '1' } }) : image(100, 50)));
    const sleep = vi.fn(noWait);
    expect(await saveImage('https://d.example/og.png', { dir, fetch: get as any, sleep })).toMatchObject({ width: 100 });
    expect(sleep).toHaveBeenCalledWith(1000);
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('gives up on an error, a page that is not an image, or a host that stays busy', async () => {
    const busy = async () => new Response('', { status: 429 });
    expect(await saveImage('https://e.example/a', { dir, fetch: (async () => new Response('', { status: 404 })) as any })).toBeNull();
    expect(await saveImage('https://e.example/b', { dir, fetch: (async () => new Response('<html>', { headers: { 'content-type': 'text/html' } })) as any })).toBeNull();
    expect(await saveImage('https://e.example/c', { dir, fetch: busy as any, sleep: noWait })).toBeNull();
    expect(fs.existsSync(dir) ? fs.readdirSync(dir) : []).toEqual([]);
  });
});
