// :::img gives one image options that plain Markdown has no room for.
//
//   :::img{width=300 scheme=dark}
//   ![alt](shot.png "caption")
//   :::
//
//   width   most it is shown at, in px; it still shrinks on narrow screens
//   scheme  light or dark: shown only in that color scheme (pair two blocks
//           for an image with a light and a dark version)
//   frame   a thin line around the image, for one whose edges are the page's
//           own background color (a white screenshot on a white page)
//
// The image's title becomes the caption. The image stays a Markdown image, so
// it is optimized like any other. Needs remark-directive before it.
import { eachContainer, element, imagesIn } from '../shared/directive';

export type ImgOptions = {
  /** directive name, default "img" */
  name?: string;
};

const SCHEMES = new Set(['light', 'dark']);

export default function remarkImg({ name = 'img' }: ImgOptions = {}) {
  return async (tree: any, file: any) => {
    await eachContainer(tree, name, (node) => {
      const where = `${file.path ?? 'post'}:${node.position?.start.line ?? '?'}`;
      const images = imagesIn(node);
      if (images.length !== 1) throw new Error(`${where}: :::${name} holds one image, found ${images.length}`);

      const { width, scheme, frame } = node.attributes ?? {};
      if (width !== undefined && !/^\d+$/.test(width)) throw new Error(`${where}: :::${name} width must be a number of px, got "${width}"`);
      if (scheme !== undefined && !SCHEMES.has(scheme)) throw new Error(`${where}: :::${name} scheme must be light or dark, got "${scheme}"`);
      if (frame !== undefined && frame !== '') throw new Error(`${where}: :::${name} frame takes no value, got "${frame}"`);

      const [image] = images;
      const caption = image.title;
      image.title = null;
      const children: any[] = [image];
      if (caption) children.push(element('figcaption', {}, [{ type: 'text', value: caption }]));
      return element(
        'figure',
        {
          className: ['img'],
          dataScheme: scheme,
          dataFrame: frame === undefined ? undefined : '',
          style: width ? `max-width:${width}px` : undefined,
        },
        children,
      );
    });
  };
}
