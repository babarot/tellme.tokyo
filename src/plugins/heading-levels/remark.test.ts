import { describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkHeadingLevels from './remark';

const headings = async (source: string, title?: string) => {
  const html = await render(source, {
    remark: [remarkHeadingLevels],
    data: title ? { astro: { frontmatter: { title } } } : undefined,
  });
  return [...html.matchAll(/<h(\d)>(.*?)<\/h\d>/g)].map(([, level, text]) => `h${level} ${text}`);
};

describe('remarkHeadingLevels', () => {
  it('leaves a post written from ## as it is', async () => {
    expect(await headings('## A\n\n### B')).toEqual(['h2 A', 'h3 B']);
  });

  it('moves every heading one level down when the body has an h1', async () => {
    expect(await headings('# A\n\n## B\n\n### C')).toEqual(['h2 A', 'h3 B', 'h4 C']);
  });

  it('does not go past h6', async () => {
    expect(await headings('# A\n\n###### F')).toEqual(['h2 A', 'h6 F']);
  });

  it('drops a leading h1 that repeats the title', async () => {
    expect(await headings('# Title\n\nbody\n\n## A', 'Title')).toEqual(['h2 A']);
  });

  it('keeps a leading h1 that differs from the title, and shifts', async () => {
    expect(await headings('# Intro\n\n## A', 'Title')).toEqual(['h2 Intro', 'h3 A']);
  });

  it('ignores # inside code blocks', async () => {
    const html = await render('```sh\n# comment\n```\n\n## A', { remark: [remarkHeadingLevels] });
    expect(html).toContain('# comment');
    expect(html).toContain('<h2>A</h2>');
  });
});
