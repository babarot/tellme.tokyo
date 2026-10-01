// Connects each .carousel on the page to createCarousel() (./state.ts):
// buttons, indicators, hover pause and swipe in; the active slide (and its
// caption) out.
import { swipeDirection } from '../shared/swipe';
import { createCarousel } from './state';

export function initCarousels(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.carousel').forEach(initCarousel);
}

function initCarousel(el: HTMLElement) {
  const slides = [...el.querySelectorAll<HTMLElement>('.carousel-slide')];
  const indicators = [...el.querySelectorAll<HTMLElement>('.carousel-indicator')];
  const captions = [...(el.closest('.carousel-figure')?.querySelectorAll<HTMLElement>('.carousel-caption') ?? [])];
  if (slides.length < 2) return;

  const carousel = createCarousel({
    count: slides.length,
    interval: Number(el.dataset.interval) || 7000,
    autoplay: el.dataset.autoplay !== 'false',
    onChange: (index) => {
      slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
      indicators.forEach((dot, i) => dot.classList.toggle('active', i === index));
      captions.forEach((caption, i) => caption.classList.toggle('active', i === index));
    },
  });

  el.querySelector('.carousel-prev')?.addEventListener('click', carousel.prev);
  el.querySelector('.carousel-next')?.addEventListener('click', carousel.next);
  indicators.forEach((dot, i) => dot.addEventListener('click', () => carousel.goTo(i)));

  el.addEventListener('mouseenter', carousel.pause);
  el.addEventListener('mouseleave', carousel.start);

  let touchX = 0;
  el.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0].screenX;
    carousel.pause();
  }, { passive: true });
  el.addEventListener('touchend', (e) => {
    const direction = swipeDirection(e.changedTouches[0].screenX - touchX);
    if (direction) carousel.goTo(carousel.index + direction);
    carousel.start();
  }, { passive: true });

  carousel.start();
}
