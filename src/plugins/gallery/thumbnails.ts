// Which smaller copies of a gallery photo to make, and how wide it will show,
// so the browser can load a copy that fits instead of the full-size photo.
// Pure; remark.ts hands the result to Astro's image pipeline (widths, sizes).

/** widths of the copies to choose from, in px */
export const THUMBNAIL_WIDTHS = [300, 600, 900, 1200];

// The copies worth making for a photo `original` px wide: the candidates
// narrower than it (a copy wider than the original adds nothing).
export function thumbnailWidths(original: number, candidates = THUMBNAIL_WIDTHS): number[] {
  return candidates.filter((w) => w < original);
}

// How wide the photo shows, for the `sizes` attribute. A row is about
// `rowHeight` tall but is stretched to fill the width, up to twice the target
// on the last row (layout.ts); 1.5 times covers most rows without
// overshooting on the common ones.
export function thumbnailSizes(ratio: number, rowHeight: number): string {
  return `${Math.round(ratio * rowHeight * 1.5)}px`;
}
