// @vitest-environment happy-dom
// How the page is wired to activeSlug(); the rule itself is in toc.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initToc } from './client';

// Where each heading sits relative to the viewport; the test scrolls by
// changing these.
let tops: Record<string, number> = {};

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => {
    fn(0);
    return 0;
  });
  document.body.innerHTML = `
    <nav class="toc"><a href="#a" data-toc-slug="a">A</a><a href="#b" data-toc-slug="b">B</a></nav>
    <details class="toc"><a href="#a" data-toc-slug="a">A</a><a href="#b" data-toc-slug="b">B</a></details>
    <h2 id="a">A</h2><h2 id="b">B</h2>`;
  for (const el of document.querySelectorAll<HTMLElement>('h2')) {
    el.getBoundingClientRect = () => ({ top: tops[el.id] }) as DOMRect;
  }
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const current = () =>
  [...document.querySelectorAll('a[aria-current="true"]')].map((a) => a.getAttribute('data-toc-slug'));
const scroll = (next: Record<string, number>) => {
  tops = next;
  window.dispatchEvent(new Event('scroll'));
};

describe('initToc', () => {
  it('marks nothing above the first heading', () => {
    tops = { a: 500, b: 1200 };
    initToc();
    expect(current()).toEqual([]);
  });

  it('marks the section being read in every table of contents, following the scroll', () => {
    tops = { a: 500, b: 1200 };
    initToc();
    scroll({ a: 20, b: 700 });
    expect(current()).toEqual(['a', 'a']);
    scroll({ a: -600, b: 60 });
    expect(current()).toEqual(['b', 'b']);
  });

  it('does nothing on a page without a table of contents', () => {
    document.body.innerHTML = '<h2 id="a">A</h2>';
    expect(() => initToc()).not.toThrow();
  });
});
