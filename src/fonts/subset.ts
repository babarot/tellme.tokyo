// The body font, Zen Kaku Gothic New, cut down at build time to the
// characters the site uses (./integration.ts does the I/O). These are the
// pure parts: which characters to keep, what the files are called, and how
// the pages are pointed at them.
import { createHash } from 'node:crypto';

export const family = 'Zen Kaku Gothic New';
export const weights = [400, 700] as const;
export type Weight = (typeof weights)[number];

// The URL pages refer to. The build replaces it with the hashed file's URL
// (hashedUrl); the dev server answers it with the whole font.
export const fontUrl = (weight: Weight) => `/fonts/zen-kaku-gothic-new-${weight}.woff2`;

// A file name that changes whenever the font's bytes do, so it can be cached
// for good.
export const hashedUrl = (weight: Weight, data: Uint8Array) =>
  `/fonts/zen-kaku-gothic-new-${weight}.${createHash('sha256').update(data).digest('hex').slice(0, 8)}.woff2`;

// Kept whatever the pages contain: small, and scripts may insert any of it.
const baseRanges: [number, number][] = [
  [0x20, 0x7e], // ASCII
  [0x2010, 0x206f], // dashes, quotes, ellipsis
  [0x3000, 0x30ff], // CJK punctuation, hiragana, katakana
  [0xff00, 0xffef], // full-width and half-width forms
];

export function baseCharacters(): Set<string> {
  const chars = new Set<string>();
  for (const [from, to] of baseRanges) for (let c = from; c <= to; c++) chars.add(String.fromCodePoint(c));
  return chars;
}

// Every character in a page or script, numeric character references
// (&#x3042; &#12354;) included. Markup and code only add ASCII, which is kept
// anyway.
export function addCharacters(chars: Set<string>, source: string) {
  for (const c of source) chars.add(c);
  for (const [, hex, dec] of source.matchAll(/&#(?:x([0-9a-f]+)|(\d+));/gi)) {
    const code = hex ? parseInt(hex, 16) : Number(dec);
    if (code <= 0x10ffff) chars.add(String.fromCodePoint(code));
  }
}

// Points a page at the built files: each placeholder URL becomes its hashed URL.
export function rewriteUrls(html: string, urls: Map<string, string>): string {
  let out = html;
  for (const [from, to] of urls) out = out.replaceAll(from, to);
  return out;
}
