// Lightbox: clicking a photo inside an element with [data-lightbox] shows it
// large in a <dialog>, with the other photos of that element one step away
// (buttons, arrow keys, swipe). Esc, the close button or a click on the
// backdrop closes it. The dialog is created on first use.
//
// What to show is decided by createViewer() (./viewer.ts); this file builds
// the dialog, feeds it events and draws what it says.
import { swipeDirection } from '../shared/swipe';
import { createViewer, type Photo } from './viewer';

export function initLightbox(root: ParentNode = document) {
  let dialog: HTMLDialogElement | undefined;
  let viewer: ReturnType<typeof createViewer> | undefined;

  const build = () => {
    const d = document.createElement('dialog');
    d.className = 'lightbox';
    d.innerHTML = `
      <img class="lightbox-image" alt="" />
      <button type="button" class="lightbox-prev" aria-label="前の写真">${icon('15 18 9 12 15 6')}</button>
      <button type="button" class="lightbox-next" aria-label="次の写真">${icon('9 18 15 12 9 6')}</button>
      <button type="button" class="lightbox-close" aria-label="閉じる">${icon('18 6 6 18', '6 6 18 18')}</button>
      <p class="lightbox-counter"></p>`;
    document.body.append(d);

    const view = d.querySelector<HTMLImageElement>('.lightbox-image')!;
    const v = createViewer({
      load: (src) => ready(src),
      render: (photo) => {
        if (photo) {
          view.src = photo.src;
          view.alt = photo.alt;
        } else {
          view.removeAttribute('src');
          view.alt = '';
        }
      },
      renderCounter: (text, single) => {
        d.querySelector('.lightbox-counter')!.textContent = text;
        d.classList.toggle('lightbox-single', single);
      },
    });

    d.querySelector('.lightbox-prev')!.addEventListener('click', (e) => (e.stopPropagation(), v.prev()));
    d.querySelector('.lightbox-next')!.addEventListener('click', (e) => (e.stopPropagation(), v.next()));
    d.querySelector('.lightbox-close')!.addEventListener('click', () => d.close());
    // A click outside the photo (the backdrop or empty space) closes it.
    d.addEventListener('click', (e) => {
      if (e.target === d) d.close();
    });
    d.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') v.next();
      if (e.key === 'ArrowLeft') v.prev();
    });
    let touchX = 0;
    d.addEventListener('touchstart', (e) => (touchX = e.changedTouches[0].screenX), { passive: true });
    d.addEventListener('touchend', (e) => {
      const direction = swipeDirection(e.changedTouches[0].screenX - touchX);
      if (direction === 1) v.next();
      if (direction === -1) v.prev();
    }, { passive: true });

    dialog = d;
    viewer = v;
  };

  root.querySelectorAll<HTMLElement>('[data-lightbox]').forEach((group) => {
    const imgs = [...group.querySelectorAll('img')];
    imgs.forEach((img, i) =>
      img.addEventListener('click', () => {
        if (!dialog) build();
        // src is the full-size photo; currentSrc may be a smaller copy from srcset
        const photos: Photo[] = imgs.map((p) => ({ src: p.src, alt: p.alt }));
        viewer!.open(photos, i);
        dialog!.showModal();
      }),
    );
  });
}

// Resolves once the image at src can be drawn without flashing. decode() says
// so exactly, but a browser may hold it while the page is hidden (a background
// tab), so a finished load also counts after a short wait. A photo that fails
// to load or decode is still shown, as the browser would.
function ready(src: string): Promise<void> {
  const img = new Image();
  img.src = src;
  const loaded = new Promise<void>((resolve) => {
    if (img.complete && img.naturalWidth) return resolve();
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  }).then(() => new Promise<void>((resolve) => setTimeout(resolve, 200)));
  return Promise.race([img.decode(), loaded]).catch(() => {});
}

function icon(...polylines: string[]) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${polylines
    .map((points) => `<polyline points="${points}" />`)
    .join('')}</svg>`;
}
