import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkGitHubCode from './remark';

let dir: string;
let cacheFile: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'github-code-'));
  cacheFile = path.join(dir, 'github-code.json');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const FILE = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join('\n') + '\n';
const URL = 'https://github.com/o/r/blob/main/docs/a.md#L9-L11';

const show = (source: string, fetchText: (raw: string) => Promise<string | null> = async () => FILE) =>
  render(source, { remark: [[remarkGitHubCode, { cacheFile, fetchText }]], path: 'post.md' });

describe('remarkGitHubCode', () => {
  it('shows the lines under a header linking to the file, numbered from the first', async () => {
    const html = await show(`::github{url="${URL}"}`);
    expect(html).toContain('<div class="github-code" style="counter-reset:github-code-line 8;--github-code-digits:2">');
    expect(html).toContain(`<a class="github-code-path" href="${URL}" target="_blank" rel="noopener noreferrer">o/r/docs/a.md</a>`);
    expect(html).toContain('<span class="github-code-ref">main</span>');
    expect(html).toContain('<pre><code class="language-md">line 9\nline 10\nline 11\n</code></pre>');
  });

  it('reads the file from raw.githubusercontent.com', async () => {
    let asked = '';
    await show(`::github{url="${URL}"}`, async (raw) => ((asked = raw), FILE));
    expect(asked).toBe('https://raw.githubusercontent.com/o/r/main/docs/a.md');
  });

  it('takes the language from lang=', async () => {
    expect(await show('::github{url="https://github.com/o/r/blob/v1/a.md#L2" lang=markdown}')).toContain('class="language-markdown"');
  });

  it('keeps the lines it read, and shows them without GitHub', async () => {
    await show(`::github{url="${URL}"}`);
    expect(JSON.parse(fs.readFileSync(cacheFile, 'utf8'))[URL].code).toBe('line 9\nline 10\nline 11');
    const html = await show(`::github{url="${URL}"}`, async () => null);
    expect(html).toContain('line 9\nline 10');
  });

  it('leaves a file it cannot read as a link, and tries it again next time', async () => {
    expect(await show(`::github{url="${URL}"}`, async () => null)).toBe(`<p><a href="${URL}">${URL}</a></p>`);
    expect(await show(`::github{url="${URL}"}`)).toContain('github-code');
  });

  it('fails the build on a URL that is not a GitHub file, or lines past its end, naming the line', async () => {
    await expect(show('text\n\n::github{}')).rejects.toThrow('post.md:3: ::github needs url=...');
    await expect(show('::github{url="https://github.com/o/r"}')).rejects.toThrow('post.md:1: ::github needs the URL of a file');
    await expect(show('::github{url="https://github.com/o/r/blob/main/a.md#L10-L20"}')).rejects.toThrow('post.md:1: a.md has fewer than 20 lines');
  });
});
