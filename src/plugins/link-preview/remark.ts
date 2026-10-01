// A paragraph that holds nothing but a URL becomes a preview card (which ones:
// urls.ts). A URL whose page cannot be read stays a link.
import path from 'node:path';
import { createCache } from './cache';
import { fetchPreview as fetchFromWeb } from './fetch';
import { previewHast } from './html';
import type { Preview } from './parse';
import { bareUrl } from './urls';

export type LinkPreviewOptions = {
  /** where previews are cached. Default ".cache/link-previews.json" */
  cacheFile?: string;
  /** days before a failed fetch is tried again. Default 30 */
  retryAfterDays?: number;
  /** for tests: how to get a preview */
  fetchPreview?: (url: string) => Promise<Preview | null>;
};

export default function remarkLinkPreview(options: LinkPreviewOptions = {}) {
  const cache = createCache({
    file: path.resolve(options.cacheFile ?? '.cache/link-previews.json'),
    retryAfterDays: options.retryAfterDays,
  });
  const get = options.fetchPreview ?? ((url: string) => fetchFromWeb(url));

  return async (tree: any) => {
    await Promise.all(
      tree.children.map(async (node: any) => {
        const url = bareUrl(node);
        if (!url) return;
        const preview = await cache.get(url, get);
        if (!preview) return;
        const card = previewHast(preview);
        node.data = { hName: card.tagName, hProperties: card.properties, hChildren: card.children };
      }),
    );
  };
}
