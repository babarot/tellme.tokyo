// Which way a horizontal swipe of dx px goes: +1 next, -1 previous, 0 too short.
export function swipeDirection(dx: number, threshold = 50): -1 | 0 | 1 {
  if (Math.abs(dx) <= threshold) return 0;
  return dx < 0 ? 1 : -1;
}
