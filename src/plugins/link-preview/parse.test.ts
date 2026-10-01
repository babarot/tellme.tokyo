import { describe, expect, it } from 'vitest';
import { decodeEntities, detectCharset, parsePreview } from './parse';

const head = (inner: string) => `<html><head>${inner}</head><body><p>body</p></body></html>`;

describe('decodeEntities', () => {
  it('decodes named, decimal and hex references', () => {
    expect(decodeEntities('a &amp; b &#39;c&#x27; &mdash; &hellip;')).toBe("a & b 'c' — …");
  });

  it('leaves unknown names as written', () => {
    expect(decodeEntities('&unknown; &#0;')).toBe('&unknown; &#0;');
  });
});

describe('parsePreview', () => {
  it('reads the OGP tags', () => {
    const p = parsePreview(
      head(`<meta property="og:title" content="Title &amp; more">
        <meta property="og:description" content="Desc">
        <meta property="og:image" content="/og.png">
        <meta property="og:site_name" content="Site">`),
      'https://example.com/a/b',
    );
    expect(p).toEqual({
      url: 'https://example.com/a/b',
      title: 'Title & more',
      description: 'Desc',
      image: 'https://example.com/og.png',
      icon: 'https://example.com/favicon.ico',
      siteName: 'Site',
    });
  });

  it('falls back to twitter tags, then <title> and the host', () => {
    const p = parsePreview(head('<title>\n  Plain  title\n</title><meta name="twitter:image" content="https://cdn.example.com/x.png">'), 'https://example.com/');
    expect(p?.title).toBe('Plain title');
    expect(p?.image).toBe('https://cdn.example.com/x.png');
    expect(p?.siteName).toBe('example.com');
  });

  it('takes attributes in any order and with single quotes', () => {
    const p = parsePreview(head(`<meta content='Reversed' property='og:title'>`), 'https://example.com/');
    expect(p?.title).toBe('Reversed');
  });

  it('upgrades an http image to https', () => {
    const p = parsePreview(head('<title>T</title><meta property="og:image" content="http://img.example.com/a.jpg">'), 'https://example.com/');
    expect(p?.image).toBe('https://img.example.com/a.jpg');
  });

  it('picks the largest <link rel="icon">', () => {
    const p = parsePreview(
      head(`<title>T</title>
        <link rel="shortcut icon" href="/small.ico">
        <link rel="icon" sizes="192x192" href="/big.png">
        <link rel="apple-touch-icon" href="/apple.png">`),
      'https://example.com/x/',
    );
    expect(p?.icon).toBe('https://example.com/big.png');
  });

  it('reads tags after </head> too (YouTube puts them there)', () => {
    const p = parsePreview('<html><head></head><body><meta property="og:title" content="Late"></body></html>', 'https://example.com/');
    expect(p?.title).toBe('Late');
  });

  it('upgrades an http icon to https', () => {
    expect(parsePreview(head('<title>T</title>'), 'http://example.com/')?.icon).toBe('https://example.com/favicon.ico');
  });

  it('returns null for a page with no title at all', () => {
    expect(parsePreview(head(''), 'https://example.com/')).toBeNull();
  });
});

describe('detectCharset', () => {
  const bytes = (s: string) => new TextEncoder().encode(s);

  it('prefers the Content-Type header', () => {
    expect(detectCharset('text/html; charset=Shift_JIS', bytes('<meta charset="utf-8">'))).toBe('shift_jis');
  });

  it('reads <meta charset> and the http-equiv form', () => {
    expect(detectCharset('text/html', bytes('<meta charset="EUC-JP">'))).toBe('euc-jp');
    expect(detectCharset(null, bytes('<meta http-equiv="Content-Type" content="text/html; charset=shift_jis">'))).toBe('shift_jis');
  });

  it('defaults to utf-8', () => {
    expect(detectCharset(null, bytes('<html>'))).toBe('utf-8');
  });
});
