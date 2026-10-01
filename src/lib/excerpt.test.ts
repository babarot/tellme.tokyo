import { describe, expect, it } from 'vitest';
import { excerpt } from './excerpt';

describe('excerpt', () => {
  it('joins the prose and drops Markdown syntax', () => {
    expect(excerpt('Hello **world**, see [the docs](https://x.y) and `code`.\n\nNext *one*.')).toBe(
      'Hello world, see the docs and code. Next one.',
    );
  });

  it('skips headings, code, directives, embeds, images, lone URLs and HTML', () => {
    const md = [
      "import Foo from './foo';",
      '# Title',
      '```sh\necho hi\n\necho there\n```',
      ':::gallery\n![](a.jpg)\n:::',
      '::tweet{id=1 user=x}',
      '![photo](a.jpg)',
      'https://example.com/',
      '<Partial name="tree" />',
      '<!-- note -->',
      '<iframe src="https://player.vimeo.com/video/1"></iframe>\n<p><a href="https://vimeo.com/1">A video</a> on Vimeo.</p>',
      '> quoted',
      '| a | b |\n|---|---|',
      'Body text.',
    ].join('\n\n');
    expect(excerpt(md)).toBe('Body text.');
  });

  it('keeps the text of inline tags', () => {
    expect(excerpt('Press <kbd>Ctrl</kbd> twice.')).toBe('Press Ctrl twice.');
  });

  it('cuts long text by characters, not bytes', () => {
    expect(excerpt('あ'.repeat(130), 120)).toBe('あ'.repeat(120) + '…');
    expect(excerpt('短い文。')).toBe('短い文。');
  });

  it('keeps list items as text and drops footnotes', () => {
    expect(excerpt('- one\n- two[^1]\n\n[^1]: note')).toBe('one two');
  });
});
