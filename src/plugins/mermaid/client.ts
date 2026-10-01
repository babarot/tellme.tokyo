// Draws every <pre class="mermaid"> (remark.ts) with mermaid, loaded only on
// pages that have a diagram. Follows the page's color scheme (a .dark class on
// <html>) and draws again when it changes.

export type MermaidApi = {
  initialize(config: Record<string, unknown>): void;
  render(id: string, source: string): Promise<{ svg: string }>;
};

// The mermaid theme for the page's color scheme.
export function mermaidTheme(dark: boolean): 'dark' | 'default' {
  return dark ? 'dark' : 'default';
}

const isDark = () => document.documentElement.classList.contains('dark');

export async function initMermaid(
  root: ParentNode = document,
  load: () => Promise<MermaidApi> = async () => (await import('mermaid')).default as unknown as MermaidApi,
) {
  const blocks = [...root.querySelectorAll<HTMLElement>('pre.mermaid')];
  if (!blocks.length) return;
  const mermaid = await load();

  // Keep each diagram's source, since drawing replaces the element's content.
  const sources = blocks.map((block) => block.textContent ?? '');
  let drawing = 0;
  const draw = async () => {
    const run = ++drawing;
    mermaid.initialize({ startOnLoad: false, theme: mermaidTheme(isDark()) });
    for (const [i, block] of blocks.entries()) {
      try {
        const { svg } = await mermaid.render(`mermaid-${i}-${run}`, sources[i]);
        if (run !== drawing) return; // the scheme changed again meanwhile
        block.innerHTML = svg;
        block.dataset.rendered = 'true';
      } catch {
        // leave the source visible rather than an empty box
        block.textContent = sources[i];
        block.dataset.rendered = 'error';
      }
    }
  };

  await draw();
  let dark = isDark();
  new MutationObserver(() => {
    if (isDark() === dark) return;
    dark = isDark();
    draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}
