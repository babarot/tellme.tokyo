import { describe, expect, it } from 'vitest';
import { swipeDirection } from './swipe';

describe('swipeDirection', () => {
  it('reads a swipe to the left as next and to the right as previous', () => {
    expect(swipeDirection(-100)).toBe(1);
    expect(swipeDirection(100)).toBe(-1);
  });

  it('ignores a movement up to the threshold', () => {
    expect(swipeDirection(50)).toBe(0);
    expect(swipeDirection(-50)).toBe(0);
    expect(swipeDirection(0)).toBe(0);
    expect(swipeDirection(-51)).toBe(1);
  });

  it('takes a custom threshold', () => {
    expect(swipeDirection(-80, 100)).toBe(0);
  });
});
