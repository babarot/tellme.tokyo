// A paragraph that holds nothing but a URL becomes a preview card (which ones:
// urls.ts). A URL whose page cannot be read stays a link. The page's image is
// saved into `imageDir` (commit it with the cache) and served from `imageBase`.
import path from 'node:path';
import { createCache } from './cache';
import { fetchPreview as fetchFromWeb } from './fetch';
import { previewHast } from './html';
import { saveImage as saveFromWeb, type SavedImage } from './image';
import type { Preview } from './parse';
import { bareUrl } from './urls';

export type LinkPreviewOptions = {
  /** where previews are cached. Default ".cache/link-previews.json" */
  cacheFile?: string;
  /** where the saved images go. Default "public/link-previews" */
  imageDir?: string;
  /** the URL `imageDir` is served under. Default "/link-previews/" */
  imageBase?: string;
  /** days before a failed fetch is tried again. Default 30 */
  retryAfterDays?: number;
  /** for tests: how to get a preview */
  fetchPreview?: (url: string) => Promise<Preview | null>;
  /** for tests: how to save an image */
  saveImage?: (url: string) => Promise<SavedImage | null>;
};

export default function remarkLinkPreview(options: LinkPreviewOptions = {}) {
  const imageDir = path.resolve(options.imageDir ?? 'public/link-previews');
  const imageBase = options.imageBase ?? '/link-previews/';
  const cache = createCache({
    file: path.resolve(options.cacheFile ?? '.cache/link-previews.json'),
    imageDir,
    retryAfterDays: options.retryAfterDays,
  });
  const get = options.fetchPreview ?? ((url: string) => fetchFromWeb(url));
  const save = options.saveImage ?? ((url: string) => saveFromWeb(url, { dir: imageDir }));

  return async (tree: any) => {
    await Promise.all(
      tree.children.map(async (node: any) => {
        const url = bareUrl(node);
        if (!url) return;
        const preview = await cache.get(url, get);
        if (!preview) return;
        const card = previewHast(preview, await cache.image(url, save), imageBase);
        node.data = { hName: card.tagName, hProperties: card.properties, hChildren: card.children };
      }),
    );
  };
}
