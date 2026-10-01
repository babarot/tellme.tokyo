import { describe, expect, it } from 'vitest';
import { createViewer, type Photo } from './viewer';

const photos: Photo[] = ['a', 'b', 'c'].map((name) => ({ src: `${name}.jpg`, alt: name }));

// load() that finishes only when the test says so, per src.
function setup() {
  const waiting = new Map<string, (() => void)[]>();
  const drawn: (string | null)[] = [];
  const counters: string[] = [];
  let single = false;
  const viewer = createViewer({
    load: (src) => new Promise<void>((done) => waiting.set(src, [...(waiting.get(src) ?? []), done])),
    render: (photo) => drawn.push(photo?.alt ?? null),
    renderCounter: (text, s) => {
      counters.push(text);
      single = s;
    },
  });
  const finish = async (src: string) => {
    waiting.get(src)?.splice(0).forEach((done) => done());
    await new Promise((r) => setTimeout(r, 0));
  };
  return { viewer, drawn, counters, finish, single: () => single, shown: () => drawn.at(-1) };
}

describe('createViewer', () => {
  it('clears the view on open, then draws the photo once it has loaded', async () => {
    const { viewer, drawn, finish } = setup();
    viewer.open(photos, 1);
    expect(drawn).toEqual([null]);
    await finish('b.jpg');
    expect(drawn).toEqual([null, 'b']);
  });

  it('shows the position in the group right away, before the photo loads', () => {
    const { viewer, counters } = setup();
    viewer.open(photos, 1);
    expect(counters).toEqual(['2 / 3']);
  });

  it('keeps the current photo until the next one has loaded', async () => {
    const { viewer, finish, shown } = setup();
    viewer.open(photos, 0);
    await finish('a.jpg');
    viewer.next();
    expect(shown()).toBe('a');
    await finish('b.jpg');
    expect(shown()).toBe('b');
  });

  it('wraps around both ends', async () => {
    const { viewer, counters } = setup();
    viewer.open(photos, 2);
    viewer.next();
    viewer.prev();
    viewer.prev();
    expect(counters).toEqual(['3 / 3', '1 / 3', '3 / 3', '2 / 3']);
  });

  it('ends on the last photo chosen when photos load out of order', async () => {
    const { viewer, finish, drawn } = setup();
    viewer.open(photos, 0);
    viewer.next(); // b
    viewer.next(); // c
    await finish('c.jpg');
    await finish('b.jpg'); // late: dropped
    await finish('a.jpg'); // late: dropped
    expect(drawn).toEqual([null, 'c']);
  });

  it('never shows the photo from the previous opening', async () => {
    const { viewer, finish, drawn } = setup();
    viewer.open(photos, 0);
    await finish('a.jpg');
    viewer.open(photos, 2);
    expect(drawn.at(-1)).toBeNull();
    await finish('c.jpg');
    expect(drawn.at(-1)).toBe('c');
  });

  it('marks a group of one as single, with no counter', () => {
    const { viewer, counters, single } = setup();
    viewer.open([photos[0]], 0);
    expect(counters).toEqual(['']);
    expect(single()).toBe(true);
  });
});
