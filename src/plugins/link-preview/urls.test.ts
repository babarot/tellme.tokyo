import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { previewUrls } from './urls';

const urls = (md: string, gfm = true) => previewUrls((gfm ? unified().use(remarkParse).use(remarkGfm) : unified().use(remarkParse)).parse(md));

describe('previewUrls', () => {
  it('finds URLs alone in a top-level paragraph, with or without GFM', () => {
    const md = 'https://a.example/\n\ntext https://b.example/\n\nhttps://c.example/';
    expect(urls(md)).toEqual(['https://a.example/', 'https://c.example/']);
    expect(urls(md, false)).toEqual(['https://a.example/', 'https://c.example/']);
  });

  it('skips URLs in lists, quotes and labeled links', () => {
    expect(urls('- https://a.example/\n\n> https://b.example/\n\n[label](https://c.example/)')).toEqual([]);
  });
});
