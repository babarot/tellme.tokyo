// Adds a copy button to every code block (remark.ts): in the title bar when
// there is one, else over the code's top-right corner. Added here rather than
// in the HTML, since without JavaScript it could not work.

export type CodeBlockOptions = {
  /** the button's accessible name */
  label?: string;
  /** announced after copying */
  copiedLabel?: string;
  /** ms the button shows it copied */
  resetAfter?: number;
  /** for tests: how text reaches the clipboard */
  write?: (text: string) => Promise<void>;
};

const ICONS =
  '<svg class="code-block-icon-copy" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
  '<svg class="code-block-icon-copied" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

// The code as written: the text of <code>, without the newline Markdown leaves
// at the end.
export function codeText(block: Element): string {
  return (block.querySelector('pre code')?.textContent ?? '').replace(/\n$/, '');
}

export function initCodeBlocks(
  root: ParentNode = document,
  {
    label = 'Copy',
    copiedLabel = 'Copied',
    resetAfter = 2000,
    write = (text) => navigator.clipboard.writeText(text),
  }: CodeBlockOptions = {},
) {
  for (const block of root.querySelectorAll<HTMLElement>('.code-block')) {
    if (block.querySelector('.code-block-copy')) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-block-copy';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = ICONS;
    let timer: ReturnType<typeof setTimeout> | undefined;
    button.addEventListener('click', async () => {
      try {
        await write(codeText(block));
      } catch {
        return; // no clipboard access (an insecure page or a denied permission)
      }
      button.dataset.copied = '';
      button.setAttribute('aria-label', copiedLabel);
      clearTimeout(timer);
      timer = setTimeout(() => {
        delete button.dataset.copied;
        button.setAttribute('aria-label', label);
      }, resetAfter);
    });
    (block.querySelector(':scope > .code-block-title') ?? block).append(button);
  }
}
