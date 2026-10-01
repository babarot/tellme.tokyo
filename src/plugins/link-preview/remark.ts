// A paragraph that holds nothing but a URL (an autolink with GFM, or plain
// text without) becomes a preview card. Only top-level paragraphs, so URLs in
// lists and quotes stay links. A URL whose page cannot be read stays a link.
import path from 'node:path';
import { createCache } from './cache';
import { fetchPreview as fetchFromWeb } from './fetch';
import { previewHast } from './html';
import type { Preview } from './parse';

export type LinkPreviewOptions = {
  /** where previews are cached. Default ".cache/link-previews.json" */
  cacheFile?: string;
  /** days before a failed fetch is tried again. Default 30 */
  retryAfterDays?: number;
  /** for tests: how to get a preview */
  fetchPreview?: (url: string) => Promise<Preview | null>;
};

export function bareUrl(node: any): string | undefined {
  if (node.type !== 'paragraph' || node.children.length !== 1) return;
  const [child] = node.children;
  if (child.type === 'text') {
    const value = child.value.trim();
    return /^https?:\/\/\S+$/.test(value) ? value : undefined;
  }
  if (child.type === 'link' && /^https?:\/\//.test(child.url)) {
    const label = child.children.length === 1 && child.children[0].type === 'text' ? child.children[0].value : '';
    return label === child.url ? child.url : undefined;
  }
}

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
