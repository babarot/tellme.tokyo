import { describe, expect, it } from 'vitest';
import { thumbnailSizes, thumbnailWidths } from './thumbnails';

describe('thumbnailWidths', () => {
  it('makes only copies narrower than the original', () => {
    expect(thumbnailWidths(1920)).toEqual([300, 600, 900, 1200]);
    expect(thumbnailWidths(700)).toEqual([300, 600]);
    expect(thumbnailWidths(600)).toEqual([300]);
  });

  it('makes none for a photo no wider than the smallest copy', () => {
    expect(thumbnailWidths(300)).toEqual([]);
  });

  it('takes custom candidates', () => {
    expect(thumbnailWidths(1000, [200, 800, 1600])).toEqual([200, 800]);
  });
});

describe('thumbnailSizes', () => {
  it('is the width at the row height, with room for rows stretched to fill', () => {
    expect(thumbnailSizes(1.5, 150)).toBe('338px');
    expect(thumbnailSizes(0.75, 200)).toBe('225px');
  });
});
