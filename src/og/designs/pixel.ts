// "pixel": only the site's mark, in the middle; one image for the whole site.
// The name is set in a pixel font whose dots are the same size as the logo's:
// Pixelify Sans draws a dot as 1/10 em and the logo is 16 dots wide, so a 100px
// name goes with a 160px logo (10px dots).
// X lays the post title over the bottom left of a large card itself, and other
// services show it as text beside the image, so the image does not repeat it.
import { h, images, type OgDesign } from '../kit';
import type { FontSpec } from '../fonts';

const color = {
  page: '#fafaf9', // stone-50: off-white, so the card has an edge on white timelines
  ink: '#1c1917', // stone-900
};

const draw = () =>
  h(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // the logo has blank dots on its right, so the space looks wider than this
      gap: 10,
      width: '100%',
      height: '100%',
      background: color.page,
    },
    [
      h('img', { width: 160, height: 160 }, undefined, { src: images.logo, width: 160, height: 160 }),
      h('div', { fontFamily: 'Pixelify Sans', fontSize: 100, color: color.ink }, 'tellme.tokyo'),
    ],
  );

// Only the letters of "tellme.tokyo" (a Google Fonts ?text= subset)
const fonts = [{ name: 'Pixelify Sans', weight: 400, file: 'PixelifySans-tellme.tokyo.ttf' }] satisfies FontSpec[];

export default { perPost: false, fonts, draw } satisfies OgDesign;
