import { describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkImg from './remark';

const img = (source: string) => render(source, { remark: [remarkImg], path: 'post.md' });

describe('remarkImg', () => {
  it('wraps the image in a figure, its title becoming the caption', async () => {
    expect(await img(':::img\n![alt](a.png "Caption")\n:::')).toBe(
      '<figure class="img"><img src="a.png" alt="alt"><figcaption>Caption</figcaption></figure>',
    );
  });

  it('limits the width', async () => {
    expect(await img(':::img{width=300}\n![](a.png)\n:::')).toBe('<figure class="img" style="max-width:300px"><img src="a.png" alt=""></figure>');
  });

  it('marks the color scheme the image is for', async () => {
    expect(await img(':::img{scheme=dark}\n![](d.png)\n:::')).toContain('<figure class="img" data-scheme="dark">');
    expect(await img(':::img{scheme=light width=200}\n![](l.png)\n:::')).toContain(
      '<figure class="img" data-scheme="light" style="max-width:200px">',
    );
  });

  it('marks an image to be framed', async () => {
    expect(await img(':::img{frame}\n![](a.png)\n:::')).toBe('<figure class="img" data-frame=""><img src="a.png" alt=""></figure>');
    expect(await img(':::img\n![](a.png)\n:::')).not.toContain('data-frame');
  });

  it('turns a light/dark pair into two independent figures', async () => {
    const html = await img(':::img{scheme=light}\n![](l.png "Run")\n:::\n\n:::img{scheme=dark}\n![](d.png "Run")\n:::');
    expect(html.match(/<figure/g)).toHaveLength(2);
  });

  it.each([
    [':::img\n![](a.png)\n![](b.png)\n:::', ':::img holds one image, found 2'],
    [':::img\ntext\n:::', ':::img holds one image, found 0'],
    [':::img{width=wide}\n![](a.png)\n:::', ':::img width must be a number of px, got "wide"'],
    [':::img{scheme=sepia}\n![](a.png)\n:::', ':::img scheme must be light or dark, got "sepia"'],
    [':::img{frame=thick}\n![](a.png)\n:::', ':::img frame takes no value, got "thick"'],
  ])('fails the build on a mistake, naming the line: %s', async (source, message) => {
    await expect(img(`text\n\n${source}`)).rejects.toThrow(`post.md:3: ${message}`);
  });
});
