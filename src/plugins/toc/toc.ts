// Table of contents, without the DOM: the tree of headings, its HTML, and
// which heading the reader is at.

export type Heading = { depth: number; slug: string; text: string };
export type TocItem = { slug: string; text: string; children: TocItem[] };

export type TocOptions = {
  /** shallowest heading level to include. Default 2 */
  from?: number;
  /** deepest heading level to include. Default 3 */
  to?: number;
};

// Nests headings by level: an h3 goes under the h2 before it. A heading with
// no parent at the level above (an h3 before any h2) stays at the top.
export function buildToc(headings: Heading[], { from = 2, to = 3 }: TocOptions = {}): TocItem[] {
  const root: TocItem[] = [];
  const stack: { depth: number; children: TocItem[] }[] = [{ depth: from - 1, children: root }];
  for (const { depth, slug, text } of headings) {
    if (depth < from || depth > to) continue;
    while (stack.length > 1 && stack.at(-1)!.depth >= depth) stack.pop();
    const item = { slug, text, children: [] };
    stack.at(-1)!.children.push(item);
    stack.push({ depth, children: item.children });
  }
  return root;
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The list of links, nested <ol>s. Empty string when there are no items.
export function tocHtml(items: TocItem[]): string {
  if (!items.length) return '';
  const list = (level: TocItem[]): string =>
    `<ol>${level
      .map(
        (item) =>
          `<li><a href="#${encodeURIComponent(item.slug)}" data-toc-slug="${escape(item.slug)}">${escape(item.text)}</a>${
            item.children.length ? list(item.children) : ''
          }</li>`,
      )
      .join('')}</ol>`;
  return list(items);
}

export type ScrollState = {
  /** distance from the top of the viewport at which a heading counts as reached */
  offset: number;
  /** height of the viewport */
  viewport: number;
  /** how far the page is scrolled (window.scrollY) */
  scrolled: number;
  /** how much is left to scroll to the bottom of the page */
  remaining: number;
};

// The line a heading's top must reach to count as the one being read.
//
// Usually `offset` px from the top. In the last viewport of scrolling, though,
// headings near the end of the page can never rise that far, so the line moves
// down toward the bottom of the viewport in step with the scroll left: at the
// very bottom it is the bottom edge, and the last heading on screen is reached.
// At the top of the page (nothing scrolled yet) the line stays put, so a short
// post that fits on one screen does not start at its last heading.
export function activationLine({ offset, viewport, scrolled, remaining }: ScrollState): number {
  if (scrolled <= 0 || remaining >= viewport) return offset;
  const progress = 1 - Math.max(remaining, 0) / viewport;
  return offset + (viewport - offset) * progress;
}

// The heading the reader is at: the last one whose top has reached `line` px
// from the top of the viewport. Undefined above the first one.
// `tops` are viewport-relative (getBoundingClientRect().top), in page order.
export function activeSlug(tops: { slug: string; top: number }[], line = 80): string | undefined {
  let active: string | undefined;
  for (const { slug, top } of tops) {
    if (top <= line) active = slug;
    else break;
  }
  return active;
}
