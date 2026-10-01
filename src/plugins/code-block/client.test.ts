// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { codeText, initCodeBlocks } from './client';

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

const plain = '<div class="code-block"><pre><code>echo hi\n</code></pre></div>';
const titled = '<div class="code-block"><div class="code-block-title">a.sh</div><pre><code>echo hi\n</code></pre></div>';
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('codeText', () => {
  it('is the code without the trailing newline', () => {
    document.body.innerHTML = '<div class="code-block"><pre><code><span>a</span>\n<span>b</span>\n</code></pre></div>';
    expect(codeText(document.querySelector('.code-block')!)).toBe('a\nb');
  });
});

describe('initCodeBlocks', () => {
  it('puts the button over the code, or in the title bar when there is one', () => {
    document.body.innerHTML = plain + titled;
    initCodeBlocks();
    const [a, b] = document.querySelectorAll('.code-block');
    expect(a.querySelector(':scope > .code-block-copy')).not.toBeNull();
    expect(b.querySelector('.code-block-title > .code-block-copy')).not.toBeNull();
  });

  it('adds one button per block even when run twice', () => {
    document.body.innerHTML = plain;
    initCodeBlocks();
    initCodeBlocks();
    expect(document.querySelectorAll('.code-block-copy')).toHaveLength(1);
  });

  it('copies the code and shows it copied for a while', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    document.body.innerHTML = plain;
    const write = vi.fn(async () => {});
    initCodeBlocks(document, { label: 'コピー', copiedLabel: 'コピーしました', resetAfter: 1000, write });
    const button = document.querySelector<HTMLButtonElement>('.code-block-copy')!;
    expect(button.getAttribute('aria-label')).toBe('コピー');

    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(write).toHaveBeenCalledWith('echo hi');
    expect(button.dataset.copied).toBe('');
    expect(button.getAttribute('aria-label')).toBe('コピーしました');

    await vi.advanceTimersByTimeAsync(1000);
    expect(button.dataset.copied).toBeUndefined();
    expect(button.getAttribute('aria-label')).toBe('コピー');
  });

  it('shows nothing when the clipboard refuses', async () => {
    document.body.innerHTML = plain;
    initCodeBlocks(document, { write: async () => Promise.reject(new Error('denied')) });
    const button = document.querySelector<HTMLButtonElement>('.code-block-copy')!;
    button.click();
    await flush();
    expect(button.dataset.copied).toBeUndefined();
  });
});
