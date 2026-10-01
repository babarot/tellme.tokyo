// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { layoutGallery } from './client';

const setup = (sizes: [number, number][], width = 648) => {
  document.body.innerHTML = `<div class="gallery" style="--gallery-row-height:150px;--gallery-gap:5px">${sizes
    .map(([w, h]) => `<span class="gallery-item" style="--w:${w};--h:${h}"><img src="x.jpg"></span>`)
    .join('')}</div>`;
  const gallery = document.querySelector<HTMLElement>('.gallery')!;
  Object.defineProperty(gallery, 'clientWidth', { value: width, configurable: true });
  return gallery;
};

const sizes = (gallery: HTMLElement) =>
  [...gallery.querySelectorAll<HTMLElement>('.gallery-item')].map((el) => [el.style.width, el.style.height]);

describe('layoutGallery', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('sets a width and height on every photo and marks the gallery as laid out', () => {
    const gallery = setup([[3, 2], [3, 2], [2, 3]]);
    layoutGallery(gallery);
    expect(gallery.classList.contains('gallery-justified')).toBe(true);
    for (const [w, h] of sizes(gallery)) {
      expect(w).toMatch(/^\d+px$/);
      expect(h).toMatch(/^\d+px$/);
    }
  });

  it('makes a filled row add up to the gallery width', () => {
    const gallery = setup([[3, 2], [3, 2], [3, 2], [3, 2]]);
    layoutGallery(gallery);
    const widths = sizes(gallery).map(([w]) => parseInt(w));
    // all four in one row (or two rows of two); each row plus its gaps is 648px
    const total = widths.reduce((a, b) => a + b, 0);
    const rows = new Set(sizes(gallery).map(([, h]) => h)).size;
    expect(total + 5 * (widths.length - rows)).toBe(648 * rows);
  });

  it('reads the row height and gap from the CSS variables', () => {
    const gallery = setup([[1, 1]], 1000);
    gallery.style.setProperty('--gallery-row-height', '100px');
    layoutGallery(gallery);
    // a lone square cannot fill 1000px within 2x the target, so it keeps 100px
    expect(sizes(gallery)).toEqual([['100px', '100px']]);
  });

  it('reads minRows from data-min-rows', () => {
    // four squares fit one 158px row at 648px; asked for two rows, they split
    const gallery = setup([[1, 1], [1, 1], [1, 1], [1, 1]]);
    layoutGallery(gallery);
    expect(new Set(sizes(gallery).map(([, h]) => h)).size).toBe(1);
    gallery.dataset.minRows = '2';
    layoutGallery(gallery);
    expect(new Set(sizes(gallery).map(([, h]) => h)).size).toBe(2);
  });

  it('does nothing while the gallery has no width (not rendered yet)', () => {
    const gallery = setup([[3, 2]], 0);
    layoutGallery(gallery);
    expect(gallery.classList.contains('gallery-justified')).toBe(false);
  });
});
