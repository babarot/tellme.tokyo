import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkLinkPreview from './remark';
import type { Preview } from './parse';

let dir: string;
let cacheFile: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-preview-'));
  cacheFile = path.join(dir, 'previews.json');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const full = (url: string): Preview => ({
  url,
  title: 'Title & more',
  description: 'Desc',
  image: 'https://example.com/og.png',
  icon: 'https://example.com/favicon.ico',
  siteName: 'Example',
});

const card = (source: string, fetchPreview: (url: string) => Promise<Preview | null> = async (u) => full(u), gfm = false) =>
  render(source, { remark: [[remarkLinkPreview, { cacheFile, fetchPreview }]], gfm });

describe('remarkLinkPreview', () => {
  it('turns a paragraph that is only a URL into a card', async () => {
    const html = await card('https://www.example.com/post');
    expect(html).toContain('<a class="link-preview not-prose" href="https://www.example.com/post" target="_blank" rel="noopener noreferrer">');
    expect(html).toContain('<span class="link-preview-title">Title &#x26; more</span>');
    expect(html).toContain('<span class="link-preview-description">Desc</span>');
    expect(html).toContain('<img class="link-preview-icon" src="https://example.com/favicon.ico"');
    expect(html).toContain('<span class="link-preview-host">example.com</span>');
    expect(html).toContain('<span class="link-preview-image"><img src="https://example.com/og.png"');
  });

  it('also takes a GFM autolink', async () => {
    expect(await card('https://example.com/', undefined, true)).toContain('class="link-preview not-prose"');
  });

  it('leaves out the parts a page does not have', async () => {
    const html = await card('https://example.com/', async (url) => ({ ...full(url), description: '', image: '', icon: '' }));
    expect(html).not.toContain('link-preview-description');
    expect(html).not.toContain('link-preview-image');
    expect(html).not.toContain('<img');
  });

  it('keeps a plain link when the page cannot be read', async () => {
    const html = await card('https://example.com/', async () => null);
    expect(html).toBe('<p>https://example.com/</p>');
  });

  it('leaves URLs inside text, lists and labeled links alone', async () => {
    const html = await card('see https://example.com/\n\n- https://example.com/\n\n[label](https://example.com/)');
    expect(html).not.toContain('link-preview');
  });
});
