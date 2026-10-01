import { describe, expect, it } from 'vitest';
import { layoutRows, type LayoutInput } from './layout';

const base = { width: 648, target: 150, gap: 5 };
const rows = (ratios: number[], extra: Partial<LayoutInput> = {}) => layoutRows({ ...base, ratios, ...extra });
const counts = (r: ReturnType<typeof layoutRows>) => r.map((row) => row.end - row.start);
const rowWidth = (row: ReturnType<typeof layoutRows>[number], gap = base.gap) =>
  row.widths.reduce((a, b) => a + b, 0) + gap * (row.widths.length - 1);

describe('layoutRows', () => {
  it('returns nothing for no photos or no width', () => {
    expect(rows([])).toEqual([]);
    expect(rows([1.5], { width: 0 })).toEqual([]);
  });

  it('fills every row to the exact gallery width', () => {
    const result = rows([1.5, 1, 1.33, 0.75, 1.5, 1.5, 0.67, 1]);
    for (const row of result.filter((r) => r.filled)) {
      expect(rowWidth(row)).toBe(base.width);
    }
  });

  it('gives every photo in a row the same height, keeping its aspect ratio', () => {
    const ratios = [1.5, 0.75, 1, 1.33];
    const [row] = rows(ratios, { width: 2000 });
    row.widths.forEach((w, i) => {
      // widths are floored to whole px (the last one takes the remainder)
      if (i < row.widths.length - 1) expect(Math.abs(w - ratios[row.start + i] * row.height)).toBeLessThan(1);
    });
  });

  // The two galleries of the 2024 recap post, at desktop and phone width.
  // Fixed here so a change to the layout shows up as a test failure.
  const bestBuy = [540 / 720, 1, 1200 / 1440, 1, 1, 1, 1500 / 1500];
  const travel = [3 / 2, 3 / 2, 3 / 2, 1.47, 2 / 3, 2 / 3];

  it('splits the recap galleries the same way on desktop', () => {
    expect(counts(rows(bestBuy))).toEqual([4, 3]);
    expect(counts(rows(travel))).toEqual([2, 4]);
  });

  it('keeps several photos per row on a phone instead of one per row', () => {
    const phone = { width: 358 };
    expect(counts(rows(bestBuy, phone)).every((n) => n >= 2)).toBe(true);
    expect(Math.max(...counts(rows(travel, phone)))).toBeGreaterThanOrEqual(2);
  });

  it('prefers balanced rows over squashing everything into one row', () => {
    const result = rows(bestBuy);
    for (const row of result) expect(row.height).toBeGreaterThan(base.target * 0.75);
  });

  it('avoids leaving one photo alone in the last row when it can', () => {
    // [3 landscape] + [1 portrait] would blow the portrait up; one row of all four is chosen
    expect(counts(rows([1.5, 1.5, 1.5, 0.67]))).toEqual([4]);
  });

  it('does not blow up a photo that has to stand alone', () => {
    // filling the width would make this portrait ~970px tall
    const [row] = rows([0.67]);
    expect(row.filled).toBe(false);
    expect(row.height).toBe(base.target);
    expect(row.widths).toEqual([Math.floor(0.67 * base.target)]);
  });

  it('stretches the last row when it stays within maxStretch', () => {
    const last = rows([1.5, 1.5, 1.5, 1.47, 0.67, 0.67]).at(-1)!;
    expect(last.filled).toBe(true);
    expect(last.height).toBeLessThanOrEqual(base.target * 2);
  });

  it('honors maxStretch', () => {
    const ratios = [2, 1];
    // one row of both would be (648-5)/3 = 214px tall
    expect(rows(ratios, { target: 150, maxStretch: 1.2 }).at(-1)!.filled).toBe(false);
    expect(rows(ratios, { target: 150, maxStretch: 1.5 }).at(-1)!.filled).toBe(true);
  });

  it('can place a very wide panorama on a row of its own', () => {
    const result = rows([8, 1.5, 1.5]);
    expect(result[0]).toMatchObject({ start: 0, end: 1 });
  });
});
