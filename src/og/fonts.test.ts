import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { googleCssUrl, loadFont } from './fonts';

let dir: string;
beforeEach(() => (dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-fonts-'))));
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const css = (url: string) => `@font-face { font-family: 'X'; src: url(${url}) format('truetype'); }`;

describe('loadFont', () => {
  it('reads a committed font from src/assets/fonts', async () => {
    const font = await loadFont({ name: 'Sixtyfour', weight: 400, file: 'Sixtyfour-tellme.tokyo.ttf' });
    expect(font).toMatchObject({ name: 'Sixtyfour', weight: 400, style: 'normal' });
    expect(font.data.length).toBeGreaterThan(0);
  });

  it('fetches a Google font once and keeps it in the cache directory', async () => {
    const get = vi.fn(async (url: string) =>
      url.startsWith('https://fonts.googleapis.com/') ? new Response(css('https://fonts.gstatic.com/x.ttf')) : new Response(new Uint8Array([1, 2, 3])),
    );
    const spec = { name: 'Test Sans', weight: 700 as const, google: 'Test Sans' };
    const font = await loadFont(spec, { get: get as any, cacheDir: dir });
    expect([...font.data]).toEqual([1, 2, 3]);
    expect(get).toHaveBeenCalledWith(googleCssUrl('Test Sans', 700));
    expect(fs.existsSync(path.join(dir, 'TestSans-700.ttf'))).toBe(true);

    await loadFont(spec, { get: get as any, cacheDir: dir });
    expect(get).toHaveBeenCalledTimes(2); // the CSS and the font, once each
  });

  it('fails clearly when Google Fonts has no TrueType for it', async () => {
    const get = vi.fn(async () => new Response('/* nothing */'));
    await expect(loadFont({ name: 'Nope', weight: 400, google: 'Nope' }, { get: get as any, cacheDir: dir })).rejects.toThrow(/No TrueType/);
  });
});

describe('googleCssUrl', () => {
  it('asks for one weight of a family', () => {
    expect(googleCssUrl('Noto Sans JP', 700)).toBe('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700');
  });
});
