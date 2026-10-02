// Marks the link of the section being read in every .toc on the page
// (aria-current="true"), following the scroll. Which one is decided by
// activationLine() and activeSlug() (./toc.ts).
//
// A heading can be hidden by CSS until an input is checked (a tab made of
// radios). Hidden headings are never the section being read, and a change of
// an input marks the section again. To show such a heading when its link is
// clicked, an ancestor names its input: data-shown-by="<id of the input>".
import { activationLine, activeSlug } from './toc';

export function initToc(root: ParentNode = document, offset = 80) {
  const links = [...root.querySelectorAll<HTMLAnchorElement>('.toc a[data-toc-slug]')];
  if (!links.length) return;

  // Each slug once, in page order (the same TOC can appear twice: sidebar and inline).
  const slugs = [...new Set(links.map((a) => a.dataset.tocSlug!))];
  const headings = slugs
    .map((slug) => ({ slug, el: document.getElementById(slug) }))
    .filter((h): h is { slug: string; el: HTMLElement } => h.el !== null);

  let current: string | undefined;
  const update = () => {
    const page = document.documentElement;
    const line = activationLine({
      offset,
      viewport: window.innerHeight,
      scrolled: window.scrollY,
      remaining: page.scrollHeight - window.scrollY - window.innerHeight,
    });
    const shown = headings.filter(({ el }) => el.getClientRects().length > 0);
    const slug = activeSlug(shown.map(({ slug, el }) => ({ slug, top: el.getBoundingClientRect().top })), line);
    if (slug === current) return;
    current = slug;
    for (const a of links) {
      if (a.dataset.tocSlug === slug) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  document.addEventListener('change', onScroll);

  // Before the browser follows the link, so it scrolls to a heading on show.
  for (const a of links) {
    a.addEventListener('click', () => {
      const el = document.getElementById(a.dataset.tocSlug!);
      if (el && el.getClientRects().length === 0) reveal(el);
    });
  }
  update();
}

function reveal(el: HTMLElement) {
  for (let holder = el.closest<HTMLElement>('[data-shown-by]'); holder; holder = holder.parentElement?.closest<HTMLElement>('[data-shown-by]') ?? null) {
    const input = document.getElementById(holder.dataset.shownBy!);
    if (!(input instanceof HTMLInputElement) || input.checked) continue;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
