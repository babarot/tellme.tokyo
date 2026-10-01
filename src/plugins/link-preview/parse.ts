// What a page says about itself, read from its HTML. Pure: no network.

export type Preview = {
  url: string;
  title: string;
  description: string;
  /** absolute https URL of the page's image, or "" */
  image: string;
  /** absolute URL of the page's icon (unchecked), or "" */
  icon: string;
  siteName: string;
};

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', middot: '·', copy: '©',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] === '#') {
      const code = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED[ref.toLowerCase()] ?? whole;
  });
}

// Attributes of every tag with the given name, in order.
function tags(html: string, name: string): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  for (const tag of html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? []) {
    const attrs: Record<string, string> = {};
    for (const [, key, , dq, sq, bare] of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
      attrs[key.toLowerCase()] = decodeEntities(dq ?? sq ?? bare ?? '').trim();
    }
    out.push(attrs);
  }
  return out;
}

const clean = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

const absolute = (href: string, base: string) => {
  try {
    return new URL(href, base).href;
  } catch {
    return '';
  }
};

// An image on an https page must be https itself, or the browser blocks it.
const https = (href: string) => href.replace(/^http:\/\//, 'https://');

// The page's icon: a <link rel="icon"> (the largest by sizes), else /favicon.ico.
function findIcon(links: Record<string, string>[], base: string): string {
  const icons = links.filter((l) => l.href && /(^|\s)icon(\s|$)/i.test(l.rel ?? ''));
  const size = (l: Record<string, string>) => parseInt(l.sizes ?? '', 10) || (/\.svg(\?|$)/i.test(l.href) ? 512 : 16);
  const best = icons.sort((a, b) => size(b) - size(a))[0];
  return https(best ? absolute(best.href, base) : absolute('/favicon.ico', base));
}

// `url` is the page's final URL (after redirects); relative links resolve against it.
export function parsePreview(html: string, url: string): Preview | null {
  // The whole document, not just <head>: YouTube writes its OGP tags after it.
  const meta: Record<string, string> = {};
  for (const m of tags(html, 'meta')) {
    const key = (m.property ?? m.name ?? '').toLowerCase();
    if (key && m.content && !(key in meta)) meta[key] = m.content;
  }
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const host = new URL(url).hostname;

  const title = clean(meta['og:title'] ?? meta['twitter:title'] ?? (titleTag && decodeEntities(titleTag)));
  if (!title) return null;
  const image = meta['og:image'] ?? meta['og:image:url'] ?? meta['twitter:image'] ?? '';
  return {
    url,
    title,
    description: clean(meta['og:description'] ?? meta['description'] ?? meta['twitter:description']),
    image: image ? https(absolute(image, url)) : '',
    icon: findIcon(tags(html, 'link'), url),
    siteName: clean(meta['og:site_name']) || host,
  };
}

// The charset a page is encoded in: the Content-Type header, else a <meta>
// in the first bytes, else UTF-8.
export function detectCharset(contentType: string | null, firstBytes: Uint8Array): string {
  const fromHeader = contentType?.match(/charset=["']?([\w-]+)/i)?.[1];
  if (fromHeader) return fromHeader.toLowerCase();
  const ascii = new TextDecoder('latin1').decode(firstBytes.subarray(0, 4096));
  const fromMeta = ascii.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  return (fromMeta ?? 'utf-8').toLowerCase();
}
