import { describe, expect, it } from 'vitest';
import { createCarousel, step, type Timer } from './state';

// A clock the test moves by hand.
function fakeTimer() {
  let now = 0;
  let id = 0;
  const timers = new Map<number, { fn: () => void; ms: number; next: number }>();
  const timer: Timer & { advance(ms: number): void; active(): number } = {
    every(fn, ms) {
      timers.set(++id, { fn, ms, next: now + ms });
      return id;
    },
    clear(handle) {
      timers.delete(handle as number);
    },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const due = [...timers.values()].filter((t) => t.next <= end).sort((a, b) => a.next - b.next)[0];
        if (!due) break;
        now = due.next;
        due.next += due.ms;
        due.fn();
      }
      now = end;
    },
    active: () => timers.size,
  };
  return timer;
}

const setup = (options: { count?: number; interval?: number; autoplay?: boolean } = {}) => {
  const timer = fakeTimer();
  const changes: number[] = [];
  const carousel = createCarousel({
    count: 3,
    interval: 5000,
    autoplay: true,
    onChange: (i) => changes.push(i),
    timer,
    ...options,
  });
  return { carousel, timer, changes };
};

describe('step', () => {
  it('wraps around both ends', () => {
    expect(step(2, 1, 3)).toBe(0);
    expect(step(0, -1, 3)).toBe(2);
    expect(step(1, 7, 3)).toBe(2);
    expect(step(0, -4, 3)).toBe(2);
  });
});

describe('createCarousel', () => {
  it('starts on the first slide without reporting a change', () => {
    const { carousel, changes } = setup();
    expect(carousel.index).toBe(0);
    expect(changes).toEqual([]);
  });

  it('moves with next, prev and goTo, wrapping around', () => {
    const { carousel, changes } = setup();
    carousel.next();
    carousel.prev();
    carousel.prev();
    carousel.goTo(1);
    expect(changes).toEqual([1, 0, 2, 1]);
  });

  it('reports nothing when going to the slide already shown', () => {
    const { carousel, changes } = setup();
    carousel.goTo(0);
    expect(changes).toEqual([]);
  });

  it('advances every interval once started', () => {
    const { carousel, timer } = setup();
    carousel.start();
    timer.advance(4999);
    expect(carousel.index).toBe(0);
    timer.advance(1);
    expect(carousel.index).toBe(1);
    timer.advance(10000);
    expect(carousel.index).toBe(0);
  });

  it('gives the new slide a full interval after a manual move', () => {
    const { carousel, timer } = setup();
    carousel.start();
    timer.advance(4000);
    carousel.next();
    timer.advance(4000);
    expect(carousel.index).toBe(1);
    timer.advance(1000);
    expect(carousel.index).toBe(2);
  });

  it('stays paused through a manual move', () => {
    const { carousel, timer } = setup();
    carousel.start();
    carousel.pause();
    carousel.next();
    timer.advance(20000);
    expect(carousel.index).toBe(1);
  });

  it('resumes with a full interval', () => {
    const { carousel, timer } = setup();
    carousel.start();
    timer.advance(4000);
    carousel.pause();
    carousel.start();
    timer.advance(4000);
    expect(carousel.index).toBe(0);
    timer.advance(1000);
    expect(carousel.index).toBe(1);
  });

  it('never runs two timers at once', () => {
    const { carousel, timer } = setup();
    carousel.start();
    carousel.start();
    carousel.next();
    expect(timer.active()).toBe(1);
  });

  it('does not autoplay when turned off, or with a single slide', () => {
    for (const options of [{ autoplay: false }, { count: 1 }]) {
      const { carousel, timer } = setup(options);
      carousel.start();
      timer.advance(20000);
      expect(carousel.index).toBe(0);
      expect(timer.active()).toBe(0);
    }
  });
});
