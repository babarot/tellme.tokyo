// Marks the link of the section being read in every .toc on the page
// (aria-current="true"), following the scroll. Which one is decided by
// activationLine() and activeSlug() (./toc.ts).
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
    const slug = activeSlug(headings.map(({ slug, el }) => ({ slug, top: el.getBoundingClientRect().top })), line);
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
  update();
}
