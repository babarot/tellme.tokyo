// "default": the site name at the top, the post title large in the middle, and
// a rule above the author and the date. The default theme's light colors.
// Without a title (the top page), the logo and the site name in the middle.
import { h, images, phrases, titleSize, type OgDesign, type OgInput } from '../kit';
import type { FontSpec } from '../fonts';

const color = {
  page: '#ffffff',
  heading: '#171717', // neutral-900
  brand: '#525252', // neutral-600
  subtle: '#a1a1a1', // neutral-400
  line: '#e5e5e5', // neutral-200
};

// The top page: the header's logo and name, large, in the middle
const site = () =>
  h(
    'div',
    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, width: '100%', height: '100%', background: color.page },
    [
      h('img', { width: 96, height: 96 }, undefined, { src: images.logo, width: 96, height: 96 }),
      h('div', { fontSize: 76, fontWeight: 700, color: color.heading }, 'tellme.tokyo'),
    ],
  );

function draw({ title, date }: OgInput) {
  if (!title) return site();

  const brand = h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
    h('img', { width: 48, height: 48 }, undefined, { src: images.logo, width: 48, height: 48 }),
    h('div', { fontSize: 30, fontWeight: 700, color: color.brand }, 'tellme.tokyo'),
  ]);

  const main = h(
    'div',
    {
      display: 'flex',
      flexWrap: 'wrap',
      fontSize: titleSize(title),
      fontWeight: 700,
      lineHeight: 1.4,
      color: color.heading,
      // a title too long even at the smallest size is cut at four lines
      maxHeight: '5.6em',
      overflow: 'hidden',
    },
    phrases(title).map((phrase) => h('div', { whiteSpace: 'pre' }, phrase)),
  );

  const footer = h(
    'div',
    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32, borderTop: `2px solid ${color.line}` },
    [
      h('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
        h('img', { width: 48, height: 48, borderRadius: 9999 }, undefined, { src: images.face, width: 48, height: 48 }),
        h('div', { fontSize: 28, color: color.brand }, 'babarot'),
      ]),
      h('div', { fontSize: 28, color: color.subtle }, date ?? ''),
    ],
  );

  return h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: '64px 80px',
      background: color.page,
    },
    [brand, main, footer],
  );
}

// Noto Sans JP is fetched from Google Fonts when needed (fonts.ts), to keep
// ~10MB of fonts out of the repository while another design is in use. If
// this design becomes the site's, consider committing the fonts instead
// (`file` in src/assets/fonts/), so that builds do not depend on Google Fonts
// and do not download them every time.
const fonts = [
  { name: 'Noto Sans JP', weight: 400, google: 'Noto Sans JP' },
  { name: 'Noto Sans JP', weight: 700, google: 'Noto Sans JP' },
] satisfies FontSpec[];

export default { perPost: true, fonts, draw } satisfies OgDesign;
