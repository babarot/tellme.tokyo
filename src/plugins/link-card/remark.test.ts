import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../shared/test-utils';
import remarkLinkCard from './remark';

let dir: string;
let cacheFile: string;

const page = (head: string) =>
  new Response(`<html><head>${head}</head><body></body></html>`, { status: 200, headers: { 'content-type': 'text/html' } });

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-card-'));
  cacheFile = path.join(dir, 'cards.json');
});

afterEach(() => {
  vi.unstubAllGlobals();
  fs.rmSync(dir, { recursive: true, force: true });
});

const card = (source: string, gfm = false) => render(source, { remark: [[remarkLinkCard, { cacheFile }]], gfm });

describe('remarkLinkCard', () => {
  it('turns a paragraph that is only a URL into a card with the OGP data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      page(`<meta property="og:title" content="Title &amp; more"><meta property="og:description" content="Desc"><meta property="og:image" content="/og.png">`),
    ));
    const html = await card('https://example.com/post');
    expect(html).toContain('<a class="link-card" href="https://example.com/post" target="_blank" rel="noopener">');
    expect(html).toContain('<span class="link-card-title">Title &#x26; more</span>');
    expect(html).toContain('<span class="link-card-description">Desc</span>');
    expect(html).toContain('example.com');
  });

  it('resolves a relative og:image against the page URL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => page('<meta property="og:title" content="T"><meta property="og:image" content="/og.png">')));
    expect(await card('https://example.com/post')).toContain('src="https://example.com/og.png"');
  });

  it('falls back to <title> when there is no og:title', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => page('<title>Plain title</title>')));
    expect(await card('https://example.com/')).toContain('Plain title');
  });

  it('also works when GFM has already turned the URL into an autolink', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => page('<meta property="og:title" content="T">')));
    expect(await card('https://example.com/post', true)).toContain('<a class="link-card" href="https://example.com/post"');
  });

  it('leaves the URL as it was when the page cannot be read', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    expect(await card('https://example.com/gone')).toBe('<p>https://example.com/gone</p>');
    expect(await card('https://example.com/gone', true)).toBe('<p><a href="https://example.com/gone">https://example.com/gone</a></p>');
  });

  it('only cards a URL that stands alone in a top-level paragraph', async () => {
    const fetch = vi.fn(async () => page('<meta property="og:title" content="T">'));
    vi.stubGlobal('fetch', fetch);
    const html = await card('see https://example.com/a\n\n- https://example.com/b\n\n[label](https://example.com/c)', true);
    expect(html).not.toContain('link-card');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('caches results in the file, including failures, and reads them back without fetching', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      url.endsWith('ok') ? page('<meta property="og:title" content="Cached">') : new Response('', { status: 500 }),
    ));
    await card('https://example.com/ok\n\nhttps://example.com/ng');
    const saved = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    expect(saved['https://example.com/ok'].title).toBe('Cached');
    expect(saved['https://example.com/ng']).toBeNull();

    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await card('https://example.com/ok')).toContain('Cached');
    expect(fetch).not.toHaveBeenCalled();
  });
});
