// What the carousel does, without the DOM: which slide is shown, and when
// autoplay advances. client.ts connects it to the page.

export type Timer = {
  /** call fn every ms; returns a handle for clear */
  every(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
};

export type CarouselOptions = {
  count: number;
  /** ms between slides when autoplaying */
  interval: number;
  autoplay: boolean;
  /** called with the new index whenever the shown slide changes */
  onChange(index: number): void;
  timer?: Timer;
};

const browserTimer: Timer = {
  every: (fn, ms) => setInterval(fn, ms),
  clear: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

// Index of the slide `by` steps from `index`, wrapping around both ends.
export function step(index: number, by: number, count: number): number {
  return (((index + by) % count) + count) % count;
}

export function createCarousel({ count, interval, autoplay, onChange, timer = browserTimer }: CarouselOptions) {
  let index = 0;
  let handle: unknown;
  let running = false;

  const show = (next: number) => {
    if (next === index) return;
    index = next;
    onChange(index);
  };
  const stop = () => {
    if (running) timer.clear(handle);
    running = false;
  };
  const start = () => {
    stop();
    if (!autoplay || count < 2) return;
    handle = timer.every(() => show(step(index, 1, count)), interval);
    running = true;
  };
  // A manual move restarts the countdown so the new slide gets a full interval.
  const go = (next: number) => {
    show(next);
    if (running) start();
  };

  return {
    get index() {
      return index;
    },
    /** start autoplay (also used to resume after pause) */
    start,
    /** pause autoplay, e.g. while the pointer is over the carousel */
    pause: stop,
    next: () => go(step(index, 1, count)),
    prev: () => go(step(index, -1, count)),
    goTo: (i: number) => go(step(i, 0, count)),
  };
}
