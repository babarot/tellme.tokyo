import { describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkMermaid from './remark';

const mermaid = (source: string) => render(source, { remark: [remarkMermaid] });

describe('remarkMermaid', () => {
  it('turns a mermaid code block into <pre class="mermaid"> with the source', async () => {
    expect(await mermaid('```mermaid\nflowchart LR\n  a --> b\n```')).toBe(
      '<pre class="mermaid">flowchart LR\n  a --> b</pre>',
    );
  });

  it('leaves other code blocks alone', async () => {
    expect(await mermaid('```sh\necho hi\n```')).toBe('<pre><code class="language-sh">echo hi\n</code></pre>');
  });

  it('finds mermaid blocks inside lists and quotes', async () => {
    expect(await mermaid('> ```mermaid\n> graph TD\n> ```')).toContain('<pre class="mermaid">graph TD</pre>');
  });
});
