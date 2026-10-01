// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initMermaid, mermaidTheme, type MermaidApi } from './client';

const flush = () => new Promise((r) => setTimeout(r, 0));

// A stand-in for mermaid: records the theme and draws the source as text.
function fakeMermaid(fail = new Set<string>()) {
  let theme = '';
  const api: MermaidApi & { themes: string[] } = {
    themes: [],
    initialize(config) {
      theme = String(config.theme);
      api.themes.push(theme);
    },
    async render(id, source) {
      if (fail.has(source)) throw new Error('parse error');
      return { svg: `<svg id="${id}" data-theme="${theme}">${source}</svg>` };
    },
  };
  return api;
}

beforeEach(() => {
  document.body.innerHTML = '<pre class="mermaid">graph A</pre><pre class="mermaid">graph B</pre>';
});
afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.className = '';
});

const svgs = () => [...document.querySelectorAll('pre.mermaid svg')].map((s) => `${s.textContent}:${s.getAttribute('data-theme')}`);

describe('mermaidTheme', () => {
  it('uses mermaid\'s dark theme in dark mode', () => {
    expect(mermaidTheme(true)).toBe('dark');
    expect(mermaidTheme(false)).toBe('default');
  });
});

describe('initMermaid', () => {
  it('draws every diagram with the theme of the page', async () => {
    await initMermaid(document, async () => fakeMermaid());
    expect(svgs()).toEqual(['graph A:default', 'graph B:default']);
  });

  it('draws again from the original source when the color scheme changes', async () => {
    await initMermaid(document, async () => fakeMermaid());
    document.documentElement.classList.add('dark');
    await flush();
    await flush();
    expect(svgs()).toEqual(['graph A:dark', 'graph B:dark']);
  });

  it('leaves the source visible when a diagram cannot be drawn', async () => {
    await initMermaid(document, async () => fakeMermaid(new Set(['graph B'])));
    const blocks = document.querySelectorAll<HTMLElement>('pre.mermaid');
    expect(blocks[1].textContent).toBe('graph B');
    expect(blocks[1].dataset.rendered).toBe('error');
    expect(blocks[0].dataset.rendered).toBe('true');
  });

  it('does not load mermaid on a page without diagrams', async () => {
    document.body.innerHTML = '<p>none</p>';
    const load = vi.fn(async () => fakeMermaid());
    await initMermaid(document, load);
    expect(load).not.toHaveBeenCalled();
  });
});
