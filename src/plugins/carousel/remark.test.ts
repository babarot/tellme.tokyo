import { describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkCarousel from './remark';

const carousel = (source: string, options = {}) => render(source, { remark: [[remarkCarousel, options]] });
const three = ':::carousel\n![a](a.jpg)\n![b](b.jpg)\n![c](c.jpg)\n:::';

describe('remarkCarousel', () => {
  it('puts each image in a slide, the first one active', async () => {
    const html = await carousel(three);
    expect(html).toContain('<div class="carousel-slides"><div class="carousel-slide active"><img src="a.jpg" alt="a"></div><div class="carousel-slide"><img src="b.jpg" alt="b"></div>');
  });

  it('adds prev/next buttons and one indicator per slide', async () => {
    const html = await carousel(three);
    expect(html).toContain('class="carousel-prev"');
    expect(html).toContain('class="carousel-next"');
    expect(html.match(/class="carousel-indicator( active)?"/g)).toHaveLength(3);
    expect(html).toContain('class="carousel-indicator active"');
  });

  it('writes the options as data attributes and CSS variables (defaults)', async () => {
    const html = await carousel(three);
    expect(html).toContain('<div class="carousel" data-lightbox="" data-interval="7000" data-autoplay="true" style="--carousel-ratio:16/9">');
    expect(html).toContain('carousel-indicators carousel-indicators-dot');
  });

  it('takes options from the plugin and from directive attributes, attributes winning', async () => {
    const html = await carousel(
      ':::carousel{interval=3000 indicator=bar autoplay=false}\n![a](a.jpg)\n![b](b.jpg)\n:::',
      { interval: 5000, ratio: '4/3' },
    );
    expect(html).toContain('data-interval="3000" data-autoplay="false" style="--carousel-ratio:4/3"');
    expect(html).toContain('carousel-indicators-bar');
  });

  it('has no controls for a single image', async () => {
    const html = await carousel(':::carousel\n![a](a.jpg)\n:::');
    expect(html).not.toContain('carousel-prev');
    expect(html).not.toContain('carousel-indicator');
  });

  it('writes SVG attributes the way HTML spells them', async () => {
    expect(await carousel(three)).toContain('stroke-linecap="round"');
  });
});
