import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkGallery from './remark';

let dir: string;
let post: string;

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-'));
  post = path.join(dir, 'index.md');
  const blank = (width: number, height: number) =>
    sharp({ create: { width, height, channels: 3, background: '#888' } }).jpeg();
  await blank(300, 200).toFile(path.join(dir, 'wide.jpg'));
  await blank(200, 300).toFile(path.join(dir, 'tall.jpg'));
  await blank(1500, 1000).toFile(path.join(dir, 'large.jpg'));
  // stored 300x200 but marked "rotate 90°" in EXIF: displayed 200x300
  await blank(300, 200).withMetadata({ orientation: 6 }).toFile(path.join(dir, 'rotated.jpg'));
});

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

const gallery = (body: string, options = {}) =>
  render(`:::gallery\n${body}\n:::`, { remark: [[remarkGallery, options]], path: post });

describe('remarkGallery', () => {
  it('wraps each image in an item carrying its size, read from the file', async () => {
    const html = await gallery('![](wide.jpg)\n![](tall.jpg)');
    expect(html).toContain('<span class="gallery-item" style="--w:300;--h:200"><img src="wide.jpg" alt=""></span>');
    expect(html).toContain('<span class="gallery-item" style="--w:200;--h:300"><img src="tall.jpg" alt=""></span>');
  });

  it('asks for smaller copies of a large photo, and how wide it shows', async () => {
    const html = await gallery('![](large.jpg)', { rowHeight: 150 });
    // Astro reads these from the <img> and makes the srcset
    expect(html).toContain('<img src="large.jpg" alt="" widths="300 600 900 1200" sizes="338px">');
  });

  it('asks for no copies of a photo too small to shrink, or of a remote one', async () => {
    const html = await gallery('![](wide.jpg)\n![](https://example.com/a.jpg)');
    expect(html).not.toContain('widths=');
  });

  it('uses the displayed size of an image rotated by EXIF', async () => {
    expect(await gallery('![](rotated.jpg)')).toContain('style="--w:200;--h:300"');
  });

  it('falls back to 3:2 for remote or missing images', async () => {
    const html = await gallery('![](https://example.com/a.jpg)\n![](missing.jpg)');
    expect(html.match(/--w:3;--h:2/g)).toHaveLength(2);
  });

  it('marks the gallery for the lightbox and passes the layout options as CSS variables', async () => {
    const html = await gallery('![](wide.jpg)', { rowHeight: 120, gap: 8 });
    expect(html).toMatch(/<div class="gallery" data-lightbox="" style="--gallery-row-height:120px;--gallery-gap:8px">/);
  });

  it('lets a directive attribute override the options', async () => {
    const html = await render(':::gallery{rowHeight=200}\n![](wide.jpg)\n:::', { remark: [remarkGallery], path: post });
    expect(html).toContain('--gallery-row-height:200px;--gallery-gap:5px');
  });

  it('passes minRows on to the client, only when more than one row is asked for', async () => {
    const html = await render(':::gallery{minRows=2}\n![](wide.jpg)\n:::', { remark: [remarkGallery], path: post });
    expect(html).toContain('data-min-rows="2"');
    expect(await gallery('![](wide.jpg)')).not.toContain('data-min-rows');
  });

  it('keeps the alt text and the order of the images', async () => {
    const html = await gallery('![first](tall.jpg)\n![second](wide.jpg)');
    expect(html.indexOf('alt="first"')).toBeLessThan(html.indexOf('alt="second"'));
  });

  it('leaves other directives and plain images alone', async () => {
    const html = await render('![](wide.jpg)\n\n:::note\ntext\n:::', { remark: [remarkGallery], path: post });
    expect(html).not.toContain('gallery');
  });
});
