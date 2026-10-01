// :::gallery → a justified gallery: photos keep their aspect ratio and fill
// each row, with rows about `rowHeight` tall (like justifiedGallery).
import { eachContainer, element, imageSize, imagesIn } from '../shared/directive';

export type GalleryOptions = {
  /** directive name, default "gallery" */
  name?: string;
  /** target row height in px; rows stretch a little to fill the width. Default 150 */
  rowHeight?: number;
  /** gap between photos in px. Default 5 */
  gap?: number;
};

export default function remarkGallery(options: GalleryOptions = {}) {
  const { name = 'gallery', rowHeight = 150, gap = 5 } = options;

  return async (tree: any, file: any) => {
    await eachContainer(tree, name, async (node) => {
      const attrs = node.attributes ?? {};
      const height = Number(attrs.rowHeight ?? rowHeight);
      const items = await Promise.all(
        imagesIn(node).map(async (img) => {
          const size = (await imageSize(img.url, file.path)) ?? { width: 3, height: 2 };
          // An item's share of the row is proportional to its aspect ratio, so
          // every item in a row ends up the same height.
          return element('span', { className: ['gallery-item'], style: `--w:${size.width};--h:${size.height}` }, [img]);
        }),
      );
      return element(
        'div',
        { className: ['gallery'], dataLightbox: '', style: `--gallery-row-height:${height}px;--gallery-gap:${Number(attrs.gap ?? gap)}px` },
        items,
      );
    });
  };
}
