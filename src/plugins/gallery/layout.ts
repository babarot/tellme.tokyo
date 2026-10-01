// Justified layout: how to split photos into rows. Pure, no DOM; used by
// client.ts.
//
//   Every row is scaled to fill the width, which gives it a height. Of all the
//   ways to split the photos into rows, the one whose row heights are closest
//   to the target overall is used (dynamic programming; a gallery has a few
//   dozen photos at most). Deciding row by row instead tends to leave one or
//   two photos stranded in the last row.
//   A last row that would have to be stretched past `maxStretch` times the
//   target (say, one tall photo) keeps the target height, aligned left.
//   `minRows` makes the split use at least that many rows: a few photos that
//   would all fit in one squat row are spread over two, whatever the width.

export type LayoutInput = {
  /** width / height of each photo, in order */
  ratios: number[];
  /** width of the gallery in px */
  width: number;
  /** target row height in px */
  target: number;
  /** gap between photos in px */
  gap: number;
  /** how much the last row may be stretched to fill the width. Default 2 */
  maxStretch?: number;
  /** the fewest rows to use (capped at the number of photos). Default 1 */
  minRows?: number;
};

export type Row = {
  /** index of the first photo in the row */
  start: number;
  /** index after the last photo in the row */
  end: number;
  height: number;
  /** false when the row keeps the target height instead of filling the width */
  filled: boolean;
  /** width of each photo in whole px; a filled row's widths and gaps add up to the gallery width */
  widths: number[];
};

export function layoutRows({ ratios, width, target, gap, maxStretch = 2, minRows = 1 }: LayoutInput): Row[] {
  const n = ratios.length;
  if (n === 0 || width <= 0) return [];
  const m = Math.min(Math.max(Math.floor(minRows), 1), n);

  // Height a row of photos [start, end) must have to fill the width exactly.
  const fit = (start: number, end: number) => {
    let sum = 0;
    for (let i = start; i < end; i++) sum += ratios[i];
    return (width - gap * (end - start - 1)) / sum;
  };
  // How far a row's height is from the target, as a ratio: half the target is
  // as bad as twice it. (A plain difference lets one squashed row beat two
  // rows that are a little tall.)
  const cost = (height: number) => Math.log(height / target) ** 2;
  const overStretched = (end: number, height: number) => end === n && height > target * maxStretch;

  // best[end][k]: the lowest cost of splitting photos [0, end) into k rows,
  // where k = m stands for "m rows or more"; from[end][k] is where the last
  // of those rows starts and the row count before it.
  const best = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(Infinity));
  const from = Array.from({ length: n + 1 }, () => new Array<[number, number]>(m + 1).fill([0, 0]));
  best[0][0] = 0;
  for (let end = 1; end <= n; end++) {
    for (let start = end - 1; start >= 0; start--) {
      const height = fit(start, end);
      // Rows only get shorter as photos are added; stop once far too short.
      // A single photo always stays a candidate (a very wide panorama).
      if (height < target / 3 && end - start > 1) break;
      const c = cost(overStretched(end, height) ? target * maxStretch : height);
      for (let k = 0; k <= m; k++) {
        const next = Math.min(k + 1, m);
        if (best[start][k] + c < best[end][next]) {
          best[end][next] = best[start][k] + c;
          from[end][next] = [start, k];
        }
      }
    }
  }

  const rows: Row[] = [];
  for (let end = n, k = m; end > 0; ) {
    const [start, before] = from[end][k];
    const fitted = fit(start, end);
    const filled = !overStretched(end, fitted);
    const height = filled ? fitted : target;
    // Round widths down and give the remainder to the last photo, so rounding
    // never pushes a filled row onto two lines.
    const widths = ratios.slice(start, end).map((r) => Math.floor(r * height));
    if (filled) {
      const used = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
      widths[widths.length - 1] += Math.round(width - used);
    }
    rows.unshift({ start, end, height, filled, widths });
    end = start;
    k = before;
  }
  return rows;
}
