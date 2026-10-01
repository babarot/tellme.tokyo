import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkCarousel from './remark';

let dir: string;
let post: string;

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'carousel-'));
  post = path.join(dir, 'index.md');
  // a "screenshot": dark background, a light block of content in the middle
  await sharp({ create: { width: 40, height: 30, channels: 3, background: '#1a1b26' } })
    .composite([{ input: { create: { width: 20, height: 10, channels: 3, background: '#c0caf5' } }, left: 10, top: 10 }])
    .png()
    .toFile(path.join(dir, 'shot.png'));
});

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

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
    expect(html).toContain('<div class="carousel" data-lightbox="" data-interval="7000" data-autoplay="true" style="--carousel-ratio:16/9;--carousel-fit:cover">');
    expect(html).toContain('carousel-indicators carousel-indicators-dot');
  });

  it('takes options from the plugin and from directive attributes, attributes winning', async () => {
    const html = await carousel(
      ':::carousel{interval=3000 indicator=bar autoplay=false fit=contain}\n![a](a.jpg)\n![b](b.jpg)\n:::',
      { interval: 5000, ratio: '4/3' },
    );
    expect(html).toContain('data-interval="3000" data-autoplay="false" style="--carousel-ratio:4/3;--carousel-fit:contain"');
    expect(html).toContain('carousel-indicators-bar');
  });

  it('has no caption when no image has a title', async () => {
    const html = await carousel(three);
    expect(html).not.toContain('figure');
    expect(html).toMatch(/^<div class="carousel"/);
  });

  it('shows image titles as captions under the frame, one per slide', async () => {
    const html = await carousel(':::carousel\n![a](a.jpg "A")\n![b](b.jpg)\n:::');
    expect(html).toMatch(/^<figure class="carousel-figure"><div class="carousel"/);
    expect(html).toContain('<figcaption class="carousel-captions"><span class="carousel-caption active">A</span><span class="carousel-caption"></span></figcaption></figure>');
    expect(html).not.toContain('title=');
  });

  it('paints each slide in its photo\'s edge color with backdrop=edge', async () => {
    const html = await render(':::carousel{fit=contain backdrop=edge}\n![a](shot.png)\n![b](missing.png)\n:::', {
      remark: [remarkCarousel],
      path: post,
    });
    expect(html).toContain('<div class="carousel-slide active" style="--carousel-backdrop:#1a1b26">');
    // a file that cannot be read keeps the placeholder
    expect(html).toContain('<div class="carousel-slide"><img src="missing.png"');
  });

  it('has no backdrop by default', async () => {
    const html = await render(':::carousel\n![a](shot.png)\n:::', { remark: [remarkCarousel], path: post });
    expect(html).not.toContain('--carousel-backdrop');
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
