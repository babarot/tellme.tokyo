// @vitest-environment happy-dom
// How the page is wired to activeSlug(); the rule itself is in toc.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initToc } from './client';

// Where each heading sits relative to the viewport; the test scrolls by
// changing these. A heading without a top is hidden (no layout boxes).
let tops: Record<string, number | undefined> = {};

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => {
    fn(0);
    return 0;
  });
  document.body.innerHTML = `
    <nav class="toc"><a href="#a" data-toc-slug="a">A</a><a href="#b" data-toc-slug="b">B</a></nav>
    <details class="toc"><a href="#a" data-toc-slug="a">A</a><a href="#b" data-toc-slug="b">B</a></details>
    <h2 id="a">A</h2><h2 id="b">B</h2>`;
  mockLayout();
});

function mockLayout() {
  for (const el of document.querySelectorAll<HTMLElement>('h2')) {
    el.getBoundingClientRect = () => ({ top: tops[el.id] }) as DOMRect;
    el.getClientRects = () => (tops[el.id] === undefined ? [] : [{}]) as unknown as DOMRectList;
  }
}
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const current = () =>
  [...document.querySelectorAll('a[aria-current="true"]')].map((a) => a.getAttribute('data-toc-slug'));
const scroll = (next: Record<string, number | undefined>) => {
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

  it('never marks a hidden heading, and marks again when an input changes', () => {
    tops = { a: -600, b: 60 };
    initToc();
    expect(current()).toEqual(['b', 'b']);
    // b is hidden, say by switching tabs: its section is no longer read
    tops = { a: -600, b: undefined };
    document.body.dispatchEvent(new Event('change', { bubbles: true }));
    expect(current()).toEqual(['a', 'a']);
  });

  it('checks the input that shows a hidden heading before following its link', () => {
    document.body.innerHTML = `
      <nav class="toc"><a href="#a" data-toc-slug="a">A</a><a href="#b" data-toc-slug="b">B</a></nav>
      <input type="radio" name="v" id="v0"><input type="radio" name="v" id="v1" checked>
      <section data-shown-by="v0"><h2 id="a">A</h2></section>
      <section data-shown-by="v1"><h2 id="b">B</h2></section>`;
    mockLayout();
    tops = { a: undefined, b: 300 };
    initToc();
    const changed = vi.fn();
    document.addEventListener('change', changed);
    document.querySelector<HTMLAnchorElement>('a[href="#a"]')!.click();
    expect(document.querySelector<HTMLInputElement>('#v0')!.checked).toBe(true);
    expect(changed).toHaveBeenCalled();
  });

  it('leaves the inputs alone when the heading is already shown', () => {
    document.body.innerHTML = `
      <nav class="toc"><a href="#a" data-toc-slug="a">A</a></nav>
      <input type="radio" name="v" id="v0"><input type="radio" name="v" id="v1" checked>
      <section data-shown-by="v0"><h2 id="a">A</h2></section>`;
    mockLayout();
    tops = { a: 300 };
    initToc();
    document.querySelector<HTMLAnchorElement>('a')!.click();
    expect(document.querySelector<HTMLInputElement>('#v1')!.checked).toBe(true);
  });
});
