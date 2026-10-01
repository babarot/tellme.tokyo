// @vitest-environment happy-dom
// How the page is wired to createViewer(). Which photo is shown and when
// (wrapping, loading order, no flash of the previous photo) is tested without
// the DOM in viewer.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initLightbox } from './client';

const flush = () => new Promise((r) => setTimeout(r, 0));

// decode() finishes at once unless `held`; the hidden-tab test holds it.
let held = false;
let decoding: HTMLImageElement[] = [];

beforeEach(() => {
  held = false;
  decoding = [];
  vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(function (this: HTMLImageElement) {
    decoding.push(this);
    return held ? new Promise<void>(() => {}) : Promise.resolve();
  });
  document.body.innerHTML = `
    <div data-lightbox id="trip"><img src="a.jpg" alt="one"><img src="b.jpg" alt="two"><img src="c.jpg" alt="three"></div>
    <div data-lightbox id="solo"><img src="d.jpg" alt="alone"></div>
    <img src="e.jpg" alt="outside" id="outside">`;
  initLightbox();
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const dialog = () => document.querySelector<HTMLDialogElement>('dialog.lightbox');
const button = (label: string) => dialog()!.querySelector<HTMLElement>(`[aria-label="${label}"]`)!;
// What a reader sees in the dialog: the photo (by alt) and the counter.
const shown = () => dialog()!.querySelector('.lightbox-image')!.getAttribute('alt') || null;
const counter = () => dialog()!.querySelector('.lightbox-counter')!.textContent;
const click = async (el: Element) => {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await flush();
};
const key = async (k: string) => {
  dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
  await flush();
};
const photo = (alt: string) => document.querySelector(`img[alt="${alt}"]`)!;

describe('initLightbox', () => {
  it('creates no dialog until a photo is clicked', () => {
    expect(dialog()).toBeNull();
  });

  it('opens on the clicked photo, with its position in the group', async () => {
    await click(photo('two'));
    expect(dialog()!.open).toBe(true);
    expect(shown()).toBe('two');
    expect(counter()).toBe('2 / 3');
  });

  it('moves with the buttons, the arrow keys and a swipe', async () => {
    await click(photo('one'));
    await click(button('次の写真'));
    expect(shown()).toBe('two');
    await key('ArrowRight');
    expect(shown()).toBe('three');
    await click(button('前の写真'));
    await key('ArrowLeft');
    expect(shown()).toBe('one');
    const touch = (type: string, screenX: number) => {
      const event = new Event(type) as any;
      event.changedTouches = [{ screenX }];
      dialog()!.dispatchEvent(event);
    };
    touch('touchstart', 300);
    touch('touchend', 100);
    await flush();
    expect(shown()).toBe('two');
  });

  it('stays open when the prev/next buttons or the photo are clicked', async () => {
    await click(photo('one'));
    await click(button('次の写真'));
    await click(dialog()!.querySelector('.lightbox-image')!);
    expect(dialog()!.open).toBe(true);
  });

  it('closes with the close button or a click on the backdrop', async () => {
    await click(photo('one'));
    await click(button('閉じる'));
    expect(dialog()!.open).toBe(false);
    await click(photo('one'));
    await click(dialog()!);
    expect(dialog()!.open).toBe(false);
  });

  it('marks a group of one, so its arrows can be hidden', async () => {
    await click(photo('alone'));
    expect(dialog()!.classList.contains('lightbox-single')).toBe(true);
    expect(counter()).toBe('');
  });

  it('reuses one dialog for every group', async () => {
    await click(photo('one'));
    await click(button('閉じる'));
    await click(photo('alone'));
    expect(document.querySelectorAll('dialog.lightbox')).toHaveLength(1);
    expect(shown()).toBe('alone');
  });

  it('shows the full-size photo even when the page shows a smaller copy (srcset)', async () => {
    const img = photo('two') as HTMLImageElement;
    Object.defineProperty(img, 'currentSrc', { value: 'http://localhost:3000/b-300w.webp' });
    await click(img);
    expect(dialog()!.querySelector<HTMLImageElement>('.lightbox-image')!.getAttribute('src')).toBe(img.src);
  });

  it('ignores photos outside a [data-lightbox] element', async () => {
    await click(photo('outside'));
    expect(dialog()).toBeNull();
  });

  it('still shows the photo when decode() is held back (a hidden tab), once it has loaded', async () => {
    held = true;
    await click(photo('two'));
    expect(shown()).toBeNull();
    decoding.at(-1)!.dispatchEvent(new Event('load'));
    await new Promise((r) => setTimeout(r, 250));
    expect(shown()).toBe('two');
  });
});
