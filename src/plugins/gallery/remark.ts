// :::gallery → a justified gallery: photos keep their aspect ratio and fill
// each row, with rows about `rowHeight` tall (like justifiedGallery).
import { eachContainer, element, imageSize, imagesIn } from '../shared/directive';
import { thumbnailSizes, thumbnailWidths } from './thumbnails';

export type GalleryOptions = {
  /** directive name, default "gallery" */
  name?: string;
  /** target row height in px; rows stretch a little to fill the width. Default 150 */
  rowHeight?: number;
  /** gap between photos in px. Default 5 */
  gap?: number;
  /** the fewest rows to use, whatever the width (client.ts only). Default 1 */
  minRows?: number;
  /** widths of the smaller copies to make of each photo; see thumbnails.ts */
  thumbnailWidths?: number[];
};

export default function remarkGallery(options: GalleryOptions = {}) {
  const { name = 'gallery', rowHeight = 150, gap = 5, minRows = 1, thumbnailWidths: candidates } = options;

  return async (tree: any, file: any) => {
    await eachContainer(tree, name, async (node) => {
      const attrs = node.attributes ?? {};
      const height = Number(attrs.rowHeight ?? rowHeight);
      const rows = Number(attrs.minRows ?? minRows);
      const items = await Promise.all(
        imagesIn(node).map(async (img) => {
          const known = await imageSize(img.url, file.path);
          const size = known ?? { width: 3, height: 2 };
          // A photo in the post's folder (one whose size could be read) gets
          // smaller copies: Astro passes an image's properties to getImage(),
          // which makes the srcset. Remote photos are left as they are.
          if (known) {
            const widths = thumbnailWidths(known.width, candidates);
            if (widths.length) {
              img.data = {
                ...img.data,
                hProperties: { ...img.data?.hProperties, widths, sizes: thumbnailSizes(known.width / known.height, height) },
              };
            }
          }
          // An item's share of the row is proportional to its aspect ratio, so
          // every item in a row ends up the same height.
          return element('span', { className: ['gallery-item'], style: `--w:${size.width};--h:${size.height}` }, [img]);
        }),
      );
      return element(
        'div',
        {
          className: ['gallery'],
          dataLightbox: '',
          ...(rows > 1 && { dataMinRows: String(rows) }),
          style: `--gallery-row-height:${height}px;--gallery-gap:${Number(attrs.gap ?? gap)}px`,
        },
        items,
      );
    });
  };
}
