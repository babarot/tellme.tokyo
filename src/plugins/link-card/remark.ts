// Turns a paragraph that holds nothing but a URL into a link card (Zenn style).
// OGP data is fetched at build time and cached in a JSON file (commit it, so
// builds do not depend on remote sites being up). A URL whose page cannot be
// read stays a plain link.
import fs from 'node:fs';
import path from 'node:path';

type Card = {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
};

export type LinkCardOptions = {
  /** where fetched OGP data is cached. Default ".cache/link-cards.json" */
  cacheFile?: string;
};

// OGP data per URL (null: the page could not be read), loaded from and saved
// to one JSON file.
function createCache(file: string) {
  let data: Record<string, Card | null> | undefined;
  const load = () => (data ??= fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {});
  const save = () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const sorted = Object.fromEntries(Object.entries(load()).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
  };
  return {
    async get(url: string): Promise<Card | null> {
      const cards = load();
      if (!(url in cards)) {
        cards[url] = await fetchCard(url);
        save();
      }
      return cards[url];
    },
  };
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function parseMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {};
    for (const [, k, , v1, v2] of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
      attrs[k.toLowerCase()] = decode(v1 ?? v2 ?? '');
    }
    const key = (attrs.property ?? attrs.name)?.toLowerCase();
    if (key && attrs.content && !(key in meta)) meta[key] = attrs.content;
  }
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (title) meta['html:title'] = decode(title[1].trim());
  return meta;
}

async function fetchCard(url: string): Promise<Card | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; tellme.tokyo link card)' },
    });
    if (!res.ok) return null;
    const meta = parseMeta(await res.text());
    const title = meta['og:title'] ?? meta['twitter:title'] ?? meta['html:title'];
    if (!title) return null;
    const image = meta['og:image'] ?? meta['twitter:image'] ?? '';
    return {
      url,
      title,
      description: meta['og:description'] ?? meta['description'] ?? '',
      // res.url is the URL after redirects (empty for a Response built by hand)
      image: image ? new URL(image, res.url || url).href : '',
      siteName: meta['og:site_name'] ?? new URL(url).hostname,
    };
  } catch {
    return null;
  }
}

const text = (value: string) => ({ type: 'text', value });
const el = (tagName: string, className: string, children: any[], props: Record<string, unknown> = {}) => ({
  type: 'element',
  tagName,
  properties: { className: [className], ...props },
  children,
});

function cardHast(card: Card) {
  const host = new URL(card.url).hostname;
  const body = el('span', 'link-card-body', [
    el('span', 'link-card-title', [text(card.title)]),
    ...(card.description ? [el('span', 'link-card-description', [text(card.description)])] : []),
    el('span', 'link-card-site', [
      el('img', 'link-card-favicon', [], {
        src: `https://www.google.com/s2/favicons?domain=${host}&sz=32`,
        alt: '',
        width: 16,
        height: 16,
        loading: 'lazy',
      }),
      text(host),
    ]),
  ]);
  const thumb = card.image
    ? [el('span', 'link-card-thumb', [el('img', '', [], { src: card.image, alt: '', loading: 'lazy' })])]
    : [];
  return [body, ...thumb];
}

// The URL of a paragraph that holds nothing but a URL: an autolink (with GFM)
// or plain text (without).
function bareUrl(node: any): string | undefined {
  if (node.type !== 'paragraph' || node.children.length !== 1) return;
  const child = node.children[0];
  if (child.type === 'text') {
    const value = child.value.trim();
    return /^https?:\/\/\S+$/.test(value) ? value : undefined;
  }
  if (child.type !== 'link') return;
  const label = child.children.length === 1 && child.children[0].type === 'text' ? child.children[0].value : '';
  if (label !== child.url || !/^https?:\/\//.test(child.url)) return;
  return child.url;
}

export default function remarkLinkCard(options: LinkCardOptions = {}) {
  const cache = createCache(path.resolve(options.cacheFile ?? '.cache/link-cards.json'));
  return async (tree: any) => {
    const targets: { node: any; url: string }[] = [];
    // Only top-level paragraphs, so URLs inside lists or quotes stay links.
    for (const node of tree.children) {
      const url = bareUrl(node);
      if (url) targets.push({ node, url });
    }
    await Promise.all(
      targets.map(async ({ node, url }) => {
        const card = await cache.get(url);
        if (!card) return;
        node.data = {
          hName: 'a',
          hProperties: { className: ['link-card'], href: url, target: '_blank', rel: 'noopener' },
          hChildren: cardHast(card),
        };
      }),
    );
  };
}
