import { describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkCodeBlock, { splitLang } from './remark';

const code = (source: string) => render(source, { remark: [remarkCodeBlock] });

describe('splitLang', () => {
  it('splits the language and the file name at the first colon', () => {
    expect(splitLang('json:package.json')).toEqual({ lang: 'json', title: 'package.json' });
    expect(splitLang('txt:a:b.txt')).toEqual({ lang: 'txt', title: 'a:b.txt' });
  });

  it('takes a file name without a language', () => {
    expect(splitLang(':Makefile')).toEqual({ lang: null, title: 'Makefile' });
  });

  it('leaves a plain language, or none', () => {
    expect(splitLang('sh')).toEqual({ lang: 'sh', title: '' });
    expect(splitLang(null)).toEqual({ lang: null, title: '' });
  });
});

describe('remarkCodeBlock', () => {
  it('wraps a code block', async () => {
    expect(await code('```sh\necho hi\n```')).toBe(
      '<div class="code-block"><pre><code class="language-sh">echo hi\n</code></pre></div>',
    );
  });

  it('puts the file name in a title bar and passes on only the language', async () => {
    expect(await code('```vim:.vimrc\nset number\n```')).toBe(
      '<div class="code-block"><div class="code-block-title">.vimrc</div><pre><code class="language-vim">set number\n</code></pre></div>',
    );
  });

  it('wraps code blocks inside lists and quotes too', async () => {
    expect(await code('- item\n\n  ```js:a.js\n  x\n  ```')).toContain('<div class="code-block-title">a.js</div>');
  });

  it('leaves inline code alone', async () => {
    expect(await code('`a:b`')).toBe('<p><code>a:b</code></p>');
  });
});
