// The card for a preview, as hast. Pure.
//
//   <a class="link-preview not-prose" href=...>
//     <span class="link-preview-body">
//       <span class="link-preview-title">…</span>
//       <span class="link-preview-description">…</span>   (when there is one)
//       <span class="link-preview-site"><img icon> host</span>
//     </span>
//     <span class="link-preview-image"><img></span>       (when one is saved)
//   </a>
//
// The image is the saved copy (image.ts), never the page's own URL, so a card
// does not depend on the linked site to show it.
// `not-prose` keeps article typography (margins on images, underlined links)
// out of the card.
import type { SavedImage } from './image';
import type { Preview } from './parse';

const el = (tagName: string, properties: Record<string, unknown>, children: any[] = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const text = (value: string) => ({ type: 'text', value });

/** `imageBase`: the URL the saved images are served under, ending in "/" */
export function previewHast(p: Preview, image?: SavedImage | null, imageBase = '/') {
  const host = new URL(p.url).hostname.replace(/^www\./, '');
  const site = [
    ...(p.icon ? [el('img', { className: ['link-preview-icon'], src: p.icon, alt: '', width: 16, height: 16, loading: 'lazy', decoding: 'async' })] : []),
    el('span', { className: ['link-preview-host'] }, [text(host)]),
  ];
  const body = el('span', { className: ['link-preview-body'] }, [
    el('span', { className: ['link-preview-title'] }, [text(p.title)]),
    ...(p.description ? [el('span', { className: ['link-preview-description'] }, [text(p.description)])] : []),
    el('span', { className: ['link-preview-site'] }, site),
  ]);
  const picture = image
    ? [
        el('span', { className: ['link-preview-image'] }, [
          el('img', { src: imageBase + image.file, alt: '', width: image.width, height: image.height, loading: 'lazy', decoding: 'async' }),
        ]),
      ]
    : [];
  return el('a', { className: ['link-preview', 'not-prose'], href: p.url, target: '_blank', rel: 'noopener noreferrer' }, [body, ...picture]);
}
