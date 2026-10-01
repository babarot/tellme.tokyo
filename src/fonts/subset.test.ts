import { describe, expect, it } from 'vitest';
import { addCharacters, baseCharacters, fontUrl, hashedUrl, rewriteUrls } from './subset';

describe('baseCharacters', () => {
  it('keeps ASCII, kana and Japanese punctuation', () => {
    const chars = baseCharacters();
    for (const c of ['a', 'Z', '0', '~', 'あ', 'ン', 'ー', '、', '「', '…', '！']) expect(chars.has(c)).toBe(true);
  });

  it('leaves kanji to the pages', () => {
    expect(baseCharacters().has('出')).toBe(false);
  });
});

describe('addCharacters', () => {
  it('adds every character of the source', () => {
    const chars = new Set<string>();
    addCharacters(chars, '<p>出かけた</p>');
    expect(chars.has('出')).toBe(true);
    expect(chars.has('け')).toBe(true);
  });

  it('adds characters written as numeric references', () => {
    const chars = new Set<string>();
    addCharacters(chars, '&#x51FA; &#12354;');
    expect(chars.has('出')).toBe(true);
    expect(chars.has('あ')).toBe(true);
  });

  it('keeps characters outside the BMP whole', () => {
    const chars = new Set<string>();
    addCharacters(chars, '𠮷');
    expect(chars.has('𠮷')).toBe(true);
  });
});

describe('urls', () => {
  it('names a file after its weight and contents', () => {
    const a = hashedUrl(400, new Uint8Array([1, 2, 3]));
    expect(a).toMatch(/^\/fonts\/zen-kaku-gothic-new-400\.[0-9a-f]{8}\.woff2$/);
    expect(hashedUrl(400, new Uint8Array([1, 2, 3]))).toBe(a);
    expect(hashedUrl(400, new Uint8Array([1, 2, 4]))).not.toBe(a);
  });

  it('points every placeholder at its hashed file', () => {
    const urls = new Map([
      [fontUrl(400), '/fonts/zen-kaku-gothic-new-400.aaaaaaaa.woff2'],
      [fontUrl(700), '/fonts/zen-kaku-gothic-new-700.bbbbbbbb.woff2'],
    ]);
    const html = `<style>src:url(${fontUrl(400)})</style><script>['${fontUrl(400)}','${fontUrl(700)}']</script>`;
    const out = rewriteUrls(html, urls);
    expect(out).not.toContain(fontUrl(400));
    expect(out).not.toContain(fontUrl(700));
    expect(out.match(/aaaaaaaa/g)).toHaveLength(2);
    expect(out).toContain('bbbbbbbb');
  });
});
