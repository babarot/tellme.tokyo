import { describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import rehypeFigureCaption from './rehype';

const figure = (source: string) => render(source, { rehype: [rehypeFigureCaption] });

describe('rehypeFigureCaption', () => {
  it('turns an image with a title, alone in a paragraph, into a figure', async () => {
    expect(await figure('![alt](a.png "Caption")')).toBe(
      '<figure><img src="a.png" alt="alt"><figcaption>Caption</figcaption></figure>',
    );
  });

  it('leaves an image without a title as it is', async () => {
    expect(await figure('![alt](a.png)')).toBe('<p><img src="a.png" alt="alt"></p>');
  });

  it('leaves an image with text around it as it is', async () => {
    expect(await figure('see ![alt](a.png "Caption") here')).toContain('<p>see <img');
  });

  it('works inside other elements', async () => {
    expect(await figure('> ![alt](a.png "Caption")')).toContain('<blockquote>\n<figure>');
  });
});
