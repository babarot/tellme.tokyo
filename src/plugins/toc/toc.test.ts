import { describe, expect, it } from 'vitest';
import { activationLine, activeSlug, buildToc, tocHtml, type Heading } from './toc';

const h = (depth: number, text: string): Heading => ({ depth, slug: text.toLowerCase(), text });

describe('buildToc', () => {
  it('nests h3 under the h2 before it', () => {
    const toc = buildToc([h(2, 'A'), h(3, 'A1'), h(3, 'A2'), h(2, 'B'), h(3, 'B1')]);
    expect(toc.map((i) => [i.text, i.children.map((c) => c.text)])).toEqual([
      ['A', ['A1', 'A2']],
      ['B', ['B1']],
    ]);
  });

  it('leaves out levels outside from..to', () => {
    const toc = buildToc([h(1, 'Title'), h(2, 'A'), h(3, 'A1'), h(4, 'deep')]);
    expect(toc).toEqual([{ slug: 'a', text: 'A', children: [{ slug: 'a1', text: 'A1', children: [] }] }]);
  });

  it('takes a custom range', () => {
    const toc = buildToc([h(2, 'A'), h(3, 'A1'), h(4, 'A1a')], { from: 2, to: 4 });
    expect(toc[0].children[0].children[0].text).toBe('A1a');
    expect(buildToc([h(2, 'A'), h(3, 'A1')], { to: 2 })[0].children).toEqual([]);
  });

  it('keeps an h3 that comes before any h2 at the top', () => {
    expect(buildToc([h(3, 'Lead'), h(2, 'A')]).map((i) => i.text)).toEqual(['Lead', 'A']);
  });

  it('returns nothing for a post without headings', () => {
    expect(buildToc([])).toEqual([]);
  });
});

describe('tocHtml', () => {
  it('renders nested ordered lists of links to the headings', () => {
    expect(tocHtml(buildToc([h(2, 'A'), h(3, 'A1'), h(2, 'B')]))).toBe(
      '<ol><li><a href="#a" data-toc-slug="a">A</a><ol><li><a href="#a1" data-toc-slug="a1">A1</a></li></ol></li>' +
        '<li><a href="#b" data-toc-slug="b">B</a></li></ol>',
    );
  });

  it('escapes text and encodes Japanese slugs in the link', () => {
    const html = tocHtml([{ slug: '1-デフォルト', text: '<script> & "x"', children: [] }]);
    expect(html).toContain('href="#1-%E3%83%87%E3%83%95%E3%82%A9%E3%83%AB%E3%83%88"');
    expect(html).toContain('data-toc-slug="1-デフォルト"');
    expect(html).toContain('&lt;script&gt; &amp; &quot;x&quot;');
  });

  it('is empty when there is nothing to list', () => {
    expect(tocHtml([])).toBe('');
  });
});

describe('activeSlug', () => {
  const tops = (...values: number[]) => values.map((top, i) => ({ slug: `s${i + 1}`, top }));

  it('is undefined while the first heading is still below the offset', () => {
    expect(activeSlug(tops(300, 900, 1500))).toBeUndefined();
  });

  it('is the last heading that has scrolled up to the offset', () => {
    expect(activeSlug(tops(-500, 40, 600))).toBe('s2');
    expect(activeSlug(tops(-900, -300, 80))).toBe('s3');
  });

  it('takes a custom offset', () => {
    expect(activeSlug(tops(150, 900), 200)).toBe('s1');
  });
});

describe('activationLine', () => {
  const at = (scrolled: number, remaining: number) => activationLine({ offset: 80, viewport: 800, scrolled, remaining });

  it('is the offset while more than a viewport is left to scroll', () => {
    expect(at(1000, 5000)).toBe(80);
    expect(at(1000, 800)).toBe(80);
  });

  it('moves down in step with the last viewport of scrolling, reaching the bottom edge', () => {
    expect(at(1000, 400)).toBe(440);
    expect(at(1000, 0)).toBe(800);
  });

  it('stays at the offset at the top of the page, even when the page fits on one screen', () => {
    expect(at(0, 0)).toBe(80);
  });
});

// The case that showed up in the 2024 recap post: the last few headings sit in
// the final screen and never rise to the offset. Scroll a page from top to
// bottom and see which heading is marked along the way.
describe('scrolling through a page to the bottom', () => {
  const viewport = 800;
  const page = 6000;
  // absolute positions; the last four are within the final screen (5200..6000)
  const headings = [
    ['work', 200], ['life', 1500], ['clothes', 4800], ['sauna', 5300], ['events', 5500], ['games', 5650], ['2025', 5800],
  ] as const;

  const activeAt = (scrolled: number) =>
    activeSlug(
      headings.map(([slug, y]) => ({ slug, top: y - scrolled })),
      activationLine({ offset: 80, viewport, scrolled, remaining: page - viewport - scrolled }),
    );

  it('marks every heading in turn, ending on the last one at the bottom', () => {
    const seen: string[] = [];
    for (let y = 0; y <= page - viewport; y += 10) {
      const slug = activeAt(y);
      if (slug && seen.at(-1) !== slug) seen.push(slug);
    }
    expect(seen).toEqual(headings.map(([slug]) => slug));
    expect(activeAt(page - viewport)).toBe('2025');
  });
});
