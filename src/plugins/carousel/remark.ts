// :::carousel → one photo at a time in a fixed frame, with prev/next buttons,
// indicators and autoplay (behavior in ./client.ts).
//
// Options can be set per carousel as directive attributes:
//   :::carousel{interval=5000 indicator=bar ratio=4/3 autoplay=false fit=contain backdrop=edge}
//
// With fit=contain, a photo of another shape than the frame leaves bands;
// backdrop=edge paints them the color of the photo's edge, so a screenshot's
// background runs on to the frame's sides.
//
// An image's title, ![alt](src "caption"), is shown under the frame while its
// slide is active.
import { eachContainer, edgeColor, element, imagesIn } from '../shared/directive';

export type CarouselOptions = {
  /** directive name, default "carousel" */
  name?: string;
  /** ms between slides when autoplaying. Default 7000 */
  interval?: number;
  /** default true */
  autoplay?: boolean;
  /** frame aspect ratio, "w/h". Default "16/9" */
  ratio?: string;
  /** "dot" or "bar". Default "dot" */
  indicator?: 'dot' | 'bar';
  /** how a photo fills the frame: "cover" (cropped) or "contain" (whole). Default "cover" */
  fit?: 'cover' | 'contain';
  /** what fills the bands fit=contain leaves: "none" (the placeholder) or "edge" (each photo's edge color). Default "none" */
  backdrop?: 'none' | 'edge';
};

const chevron = (points: string) => ({
  type: 'element',
  tagName: 'svg',
  // attribute names as written in HTML; hast passes unknown names through as-is
  properties: { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' },
  children: [{ type: 'element', tagName: 'polyline', properties: { points }, children: [] }],
});

// A hast element inside the mdast tree (no mdast children to convert).
const raw = (tagName: string, properties: Record<string, unknown>, hChildren: any[] = []) => ({
  type: 'directiveElement',
  data: { hName: tagName, hProperties: properties, hChildren },
});

export default function remarkCarousel(options: CarouselOptions = {}) {
  const { name = 'carousel', interval = 7000, autoplay = true, ratio = '16/9', indicator = 'dot', fit = 'cover', backdrop = 'none' } = options;

  return async (tree: any, file: any) => {
    await eachContainer(tree, name, async (node) => {
      const attrs = node.attributes ?? {};
      const images = imagesIn(node);
      const captions = images.map((img) => img.title ?? '');
      // the caption replaces the title, which would otherwise show as a tooltip
      for (const img of images) img.title = null;
      const backdrops = await Promise.all(
        images.map((img) => ((attrs.backdrop ?? backdrop) === 'edge' ? edgeColor(img.url, file.path) : undefined)),
      );
      const slides = images.map((img, i) =>
        element(
          'div',
          {
            className: i === 0 ? ['carousel-slide', 'active'] : ['carousel-slide'],
            ...(backdrops[i] && { style: `--carousel-backdrop:${backdrops[i]}` }),
          },
          [img],
        ),
      );
      const controls =
        images.length > 1
          ? [
              raw('button', { type: 'button', className: ['carousel-prev'], ariaLabel: '前の写真' }, [chevron('15 18 9 12 15 6')]),
              raw('button', { type: 'button', className: ['carousel-next'], ariaLabel: '次の写真' }, [chevron('9 18 15 12 9 6')]),
              raw(
                'div',
                { className: ['carousel-indicators', `carousel-indicators-${attrs.indicator ?? indicator}`] },
                images.map((_, i) => ({
                  type: 'element',
                  tagName: 'button',
                  properties: { type: 'button', className: i === 0 ? ['carousel-indicator', 'active'] : ['carousel-indicator'], ariaLabel: `${i + 1} 枚目` },
                  children: [],
                })),
              ),
            ]
          : [];
      const frame = element(
        'div',
        {
          className: ['carousel'],
          dataLightbox: '',
          dataInterval: String(attrs.interval ?? interval),
          dataAutoplay: String(attrs.autoplay ?? autoplay),
          style: `--carousel-ratio:${attrs.ratio ?? ratio};--carousel-fit:${attrs.fit ?? fit}`,
        },
        [element('div', { className: ['carousel-slides'] }, slides), ...controls],
      );
      if (!captions.some(Boolean)) return frame;
      return element('figure', { className: ['carousel-figure'] }, [
        frame,
        raw(
          'figcaption',
          { className: ['carousel-captions'] },
          captions.map((text, i) => ({
            type: 'element',
            tagName: 'span',
            properties: { className: i === 0 ? ['carousel-caption', 'active'] : ['carousel-caption'] },
            children: [{ type: 'text', value: text }],
          })),
        ),
      ]);
    });
  };
}
