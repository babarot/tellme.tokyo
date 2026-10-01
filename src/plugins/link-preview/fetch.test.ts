import { describe, expect, it, vi } from 'vitest';
import { fetchPreview } from './fetch';

const html = (body: BodyInit, type = 'text/html; charset=utf-8', url = '') => {
  const res = new Response(body, { status: 200, headers: { 'content-type': type } });
  if (url) Object.defineProperty(res, 'url', { value: url });
  return res;
};
const icon = () => new Response('', { status: 200, headers: { 'content-type': 'image/x-icon' } });

describe('fetchPreview', () => {
  it('reads the page and keeps an icon that is there', async () => {
    const get = vi.fn(async (url: string) => (url.endsWith('.ico') ? icon() : html('<title>T</title>')));
    const p = await fetchPreview('https://example.com/', { fetch: get as any });
    expect(p).toMatchObject({ title: 'T', icon: 'https://example.com/favicon.ico' });
  });

  it('drops an icon that is not there', async () => {
    const get = vi.fn(async (url: string) => (url.endsWith('.ico') ? new Response('', { status: 404 }) : html('<title>T</title>')));
    expect((await fetchPreview('https://example.com/', { fetch: get as any }))?.icon).toBe('');
  });

  it('decodes Shift_JIS', async () => {
    // "日本語" in Shift_JIS
    const sjis = new Uint8Array([0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea]);
    const body = new Uint8Array([...new TextEncoder().encode('<title>'), ...sjis, ...new TextEncoder().encode('</title>')]);
    const get = vi.fn(async (url: string) => (url.endsWith('.ico') ? icon() : html(body, 'text/html; charset=Shift_JIS')));
    expect((await fetchPreview('http://example.jp/', { fetch: get as any }))?.title).toBe('日本語');
  });

  it('resolves relative links against the URL after redirects, but keeps the linked URL', async () => {
    const get = vi.fn(async (url: string) =>
      url.endsWith('.ico') ? icon() : html('<title>T</title><meta property="og:image" content="og.png">', 'text/html', 'https://new.example.com/dir/'),
    );
    const p = await fetchPreview('https://old.example.com/', { fetch: get as any });
    expect(p?.url).toBe('https://old.example.com/');
    expect(p?.image).toBe('https://new.example.com/dir/og.png');
  });

  it('returns null for an error status or a non-HTML response', async () => {
    expect(await fetchPreview('https://example.com/', { fetch: (async () => new Response('', { status: 500 })) as any })).toBeNull();
    expect(await fetchPreview('https://example.com/a.pdf', { fetch: (async () => html('%PDF', 'application/pdf')) as any })).toBeNull();
  });
});
