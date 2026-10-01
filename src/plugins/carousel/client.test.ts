// @vitest-environment happy-dom
// How the page is wired to createCarousel(). The rules themselves (wrapping,
// timing) are tested without the DOM in state.test.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initCarousels } from './client';

// The markup remark.ts produces, trimmed to what the client uses.
const markup = (count: number, autoplay = true) => `
  <div class="carousel" data-interval="5000" data-autoplay="${autoplay}">
    <div class="carousel-slides">
      ${Array.from({ length: count }, (_, i) => `<div class="carousel-slide${i === 0 ? ' active' : ''}"><img alt="photo ${i + 1}"></div>`).join('')}
    </div>
    <button class="carousel-prev" aria-label="前の写真"></button>
    <button class="carousel-next" aria-label="次の写真"></button>
    <div class="carousel-indicators">
      ${Array.from({ length: count }, (_, i) => `<button class="carousel-indicator${i === 0 ? ' active' : ''}" aria-label="${i + 1} 枚目"></button>`).join('')}
    </div>
  </div>`;

const carousel = () => document.querySelector<HTMLElement>('.carousel')!;
const button = (label: string) => document.querySelector<HTMLElement>(`[aria-label="${label}"]`)!;
// The photo on show, and the indicator marked current, as a reader sees them.
const shown = () => document.querySelector('.carousel-slide.active img')!.getAttribute('alt');
const current = () => document.querySelector('.carousel-indicator.active')!.getAttribute('aria-label');
const fire = (el: Element, type: string, screenX?: number) => {
  const event = new Event(type) as any;
  if (screenX !== undefined) event.changedTouches = [{ screenX }];
  el.dispatchEvent(event);
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('initCarousels', () => {
  it('shows the next and previous photo with the buttons, the indicator following', () => {
    document.body.innerHTML = markup(3);
    initCarousels();
    fire(button('次の写真'), 'click');
    expect(shown()).toBe('photo 2');
    expect(current()).toBe('2 枚目');
    fire(button('前の写真'), 'click');
    expect(shown()).toBe('photo 1');
  });

  it('shows the photo of a clicked indicator', () => {
    document.body.innerHTML = markup(3);
    initCarousels();
    fire(button('3 枚目'), 'click');
    expect(shown()).toBe('photo 3');
  });

  it('autoplays, and pauses while the pointer is over it', () => {
    document.body.innerHTML = markup(3);
    initCarousels();
    vi.advanceTimersByTime(5000);
    expect(shown()).toBe('photo 2');
    fire(carousel(), 'mouseenter');
    vi.advanceTimersByTime(20000);
    expect(shown()).toBe('photo 2');
    fire(carousel(), 'mouseleave');
    vi.advanceTimersByTime(5000);
    expect(shown()).toBe('photo 3');
  });

  it('follows data-autoplay="false"', () => {
    document.body.innerHTML = markup(3, false);
    initCarousels();
    vi.advanceTimersByTime(20000);
    expect(shown()).toBe('photo 1');
  });

  it('follows a swipe', () => {
    document.body.innerHTML = markup(3);
    initCarousels();
    fire(carousel(), 'touchstart', 300);
    fire(carousel(), 'touchend', 200);
    expect(shown()).toBe('photo 2');
    fire(carousel(), 'touchstart', 200);
    fire(carousel(), 'touchend', 300);
    expect(shown()).toBe('photo 1');
  });

  it('shows the caption of the photo on show', () => {
    const captions = Array.from({ length: 3 }, (_, i) => `<span class="carousel-caption${i === 0 ? ' active' : ''}">caption ${i + 1}</span>`).join('');
    document.body.innerHTML = `<figure class="carousel-figure">${markup(3)}<figcaption>${captions}</figcaption></figure>`;
    initCarousels();
    fire(button('3 枚目'), 'click');
    expect(document.querySelector('.carousel-caption.active')!.textContent).toBe('caption 3');
  });

  it('leaves a single-photo carousel alone', () => {
    document.body.innerHTML = markup(1);
    initCarousels();
    vi.advanceTimersByTime(20000);
    expect(shown()).toBe('photo 1');
  });
});
