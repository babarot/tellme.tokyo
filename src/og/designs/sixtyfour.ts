// "sixtyfour": "tellme.tokyo" alone in the middle, set in Sixtyfour (scan-line
// letters, like an old CRT), with ".tokyo" in Tokyo Tower red; one image for
// the whole site, like "pixel".
import { h, type OgDesign } from '../kit';
import type { FontSpec } from '../fonts';

const color = {
  page: '#fafaf9', // stone-50
  ink: '#1c1917', // stone-900
  red: '#c8312f', // Tokyo Tower
};

const draw = () =>
  h('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: color.page }, [
    h('div', { display: 'flex', fontFamily: 'Sixtyfour', fontSize: 64, color: color.ink }, [
      h('span', {}, 'tellme'),
      h('span', { color: color.red }, '.tokyo'),
    ]),
  ]);

// Only the letters of "tellme.tokyo" (a Google Fonts ?text= subset)
const fonts = [{ name: 'Sixtyfour', weight: 400, file: 'Sixtyfour-tellme.tokyo.ttf' }] satisfies FontSpec[];

export default { perPost: false, fonts, draw } satisfies OgDesign;
