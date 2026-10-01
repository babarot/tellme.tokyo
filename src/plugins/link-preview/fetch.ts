// Fetches a page and reads its preview (parse.ts). Network only here.
import { detectCharset, parsePreview, type Preview } from './parse';

export type Fetch = typeof fetch;

const HEADERS = {
  // Some sites answer bots with a bare page or not at all; look like a browser.
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  accept: 'text/html,application/xhtml+xml',
  'accept-language': 'ja,en;q=0.8',
};

export async function fetchPreview(url: string, { fetch: get = fetch, timeout = 10_000 } = {}): Promise<Preview | null> {
  const res = await get(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
  if (!res.ok) return null;
  const type = res.headers.get('content-type');
  if (type && !/html/i.test(type)) return null;
  const bytes = new Uint8Array(await res.arrayBuffer());
  let html: string;
  try {
    html = new TextDecoder(detectCharset(type, bytes)).decode(bytes);
  } catch {
    html = new TextDecoder().decode(bytes); // unknown charset name
  }
  const preview = parsePreview(html, res.url || url);
  if (!preview) return null;
  // The preview is for the URL the post links to, wherever it redirected.
  preview.url = url;
  if (preview.icon && !(await reachable(preview.icon, get))) preview.icon = '';
  return preview;
}

// Whether an icon really is there, so a card never shows a broken image.
async function reachable(url: string, get: Fetch): Promise<boolean> {
  try {
    const res = await get(url, { headers: HEADERS, signal: AbortSignal.timeout(5_000) });
    return res.ok && /^image\//i.test(res.headers.get('content-type') ?? 'image/');
  } catch {
    return false;
  }
}
