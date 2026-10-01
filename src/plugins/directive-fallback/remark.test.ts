import { describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkDirectiveFallback from './remark';

const text = (html: string) => html.replace(/<[^>]+>/g, '').trim();
const fallback = (source: string) => render(source, { remark: [remarkDirectiveFallback] });

describe('remarkDirectiveFallback', () => {
  it.each([
    ['a time', '時刻は 10:30 です'],
    ['a word after a colon', 'ratio:16 の画面'],
    ['attributes', 'key:value{a=1} と書く'],
    ['a label', 'note:[ラベル] を付ける'],
  ])('keeps %s as written', async (_, source) => {
    expect(text(await fallback(source))).toBe(source);
  });

  it('keeps a leaf directive line as written', async () => {
    expect(text(await fallback('::leaf{x=1}'))).toBe('::leaf{x=1}');
  });

  it('keeps an unhandled container directive as written', async () => {
    expect(text(await fallback(':::unknown\nbody\n:::'))).toBe(':::unknown\nbody\n:::');
  });

  it('leaves URLs alone', async () => {
    expect(await fallback('https://example.com/a:b')).toContain('https://example.com/a:b');
  });
});
