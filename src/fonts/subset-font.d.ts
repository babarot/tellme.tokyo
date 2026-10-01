// subset-font ships no types.
declare module 'subset-font' {
  export default function subsetFont(
    font: Uint8Array,
    text: string,
    options?: { targetFormat?: 'sfnt' | 'woff' | 'woff2' },
  ): Promise<Buffer>;
}
