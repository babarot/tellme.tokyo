// Lays out each .gallery with layoutRows() (./layout.ts) and sets every
// photo's size; lays it out again when the gallery's width changes. Without
// this script the CSS-only layout in style.css is used.
import { layoutRows } from './layout';

export type GalleryClientOptions = {
  /** how much the last row may be stretched to fill the width. Default 2 */
  maxStretch?: number;
};

export function initGalleries(root: ParentNode = document, options: GalleryClientOptions = {}) {
  root.querySelectorAll<HTMLElement>('.gallery').forEach((gallery) => {
    const layout = () => layoutGallery(gallery, options);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(gallery);
    layout();
  });
}

export function layoutGallery(gallery: HTMLElement, { maxStretch }: GalleryClientOptions = {}) {
  const style = getComputedStyle(gallery);
  const width = gallery.clientWidth;
  if (!width) return;

  const items = [...gallery.querySelectorAll<HTMLElement>('.gallery-item')];
  const ratios = items.map(
    (el) => Number(el.style.getPropertyValue('--w')) / Number(el.style.getPropertyValue('--h')) || 1.5,
  );
  const rows = layoutRows({
    ratios,
    width,
    target: parseFloat(style.getPropertyValue('--gallery-row-height')) || 150,
    gap: parseFloat(style.getPropertyValue('--gallery-gap')) || 0,
    maxStretch,
  });

  gallery.classList.add('gallery-justified');
  for (const row of rows) {
    row.widths.forEach((w, i) => {
      const el = items[row.start + i];
      el.style.width = `${w}px`;
      el.style.height = `${Math.round(row.height)}px`;
    });
  }
}
