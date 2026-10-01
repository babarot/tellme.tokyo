// What OG designs (designs/*.ts) build with: an element helper, the site's
// images, and the title layout helpers. Pure, apart from reading src/assets.
import fs from 'node:fs';
import path from 'node:path';
import { loadDefaultJapaneseParser } from 'budoux';
import type { FontSpec } from './fonts';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** what a design is drawn from */
export type OgInput = {
  /** a post's title; none for the top page */
  title?: string;
  /** a post's date, e.g. 2026-09-27 */
  date?: string;
};

/** an element for satori: like a <div> with inline styles */
export type El = { type: string; props: Record<string, unknown> };

export type OgDesign = {
  /**
   * Whether the image shows something of the post (its title, its date). When
   * not, the site has one image, /og.png, and posts get none of their own.
   */
  perPost: boolean;
  /** the fonts it draws with (fonts.ts); the first is the default for all text */
  fonts: FontSpec[];
  /** the input in, the element tree of the whole 1200x630 image out */
  draw: (input: OgInput) => El;
};

export const h = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): El => ({
  type,
  props: { style, children, ...props },
});

const asset = (file: string) => fs.readFileSync(path.resolve('src', file));
const dataUri = (file: string, type: string) => `data:${type};base64,${asset(file).toString('base64')}`;

/** the site's images, as data URIs for <img src> */
export const images = {
  // 16px pixel art: draw it at a whole multiple of 16 to keep its pixels sharp
  get logo() {
    return dataUri('icons/logo.svg', 'image/svg+xml');
  },
  get face() {
    return dataUri('assets/me.jpg', 'image/jpeg');
  },
};

// A title split into phrases (BudouX), so lines break between phrases
// ("作り変えた" stays whole) as a person would break them. Short kana endings
// ("した", "して") join the phrase before, so they never sit alone on a line.
// A space that starts a phrase moves to the end of the one before, where a
// line end hides it. Lay them out as flex items with flexWrap: 'wrap'.
let parser: ReturnType<typeof loadDefaultJapaneseParser> | undefined;
export function phrases(title: string): string[] {
  const out: string[] = [];
  for (const part of (parser ??= loadDefaultJapaneseParser()).parse(title)) {
    if (out.length && /^\s/.test(part)) out[out.length - 1] += ' ';
    const phrase = part.trim();
    if (!phrase) continue;
    if (out.length && /^[\p{Script=Hiragana}ー]{1,2}[。、！？]?$/u.test(phrase)) out[out.length - 1] += phrase;
    else out.push(phrase);
  }
  return out;
}

// Shorter titles are set larger, so that titles of any usual length fill two
// or three lines of a 1040px wide box.
export function titleSize(title: string): number {
  const length = [...title].length;
  if (length <= 16) return 72;
  if (length <= 32) return 60;
  if (length <= 48) return 52;
  return 44;
}
