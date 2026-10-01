// Open Graph images (1200x630 PNG), drawn at build time: a design (designs/)
// lays the image out, satori turns it into SVG with the design's fonts
// (fonts.ts), and resvg into PNG. Which design the site uses is `ogDesign` in src/config.ts;
// /dev/og/ shows them all.
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { config, type OgDesignName } from '../config';
import { OG_HEIGHT, OG_WIDTH, type OgDesign, type OgInput } from './kit';
import { loadFont } from './fonts';
import defaultDesign from './designs/default';
import pixel from './designs/pixel';
import sixtyfour from './designs/sixtyfour';

export const designs: Record<OgDesignName, OgDesign> = { default: defaultDesign, pixel, sixtyfour };

/** whether the design in use draws an image for each post */
export const perPostOg = designs[config.ogDesign].perPost;

/** the OG image of a post page: its own, or the site's when the design has one image */
export function ogImagePath(postPath: string): string {
  return perPostOg ? `${postPath}og.png` : '/og.png';
}

export async function renderOg(input: OgInput, design: OgDesignName = config.ogDesign): Promise<Buffer> {
  const { fonts, draw } = designs[design];
  const root = draw(input);
  root.props.style = { fontFamily: fonts[0].name, ...(root.props.style as object) };
  const svg = await satori(root as any, { width: OG_WIDTH, height: OG_HEIGHT, fonts: await Promise.all(fonts.map((f) => loadFont(f))) });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}
