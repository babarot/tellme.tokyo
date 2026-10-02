import { describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkGallery from '../gallery/remark';
import remarkRevision, { type RevisionOptions } from './remark';

const run = async (source: string, options: RevisionOptions = {}) => {
  const data: any = {};
  const html = await render(source, { remark: [[remarkRevision, options]], path: 'post.md', data });
  return { html, frontmatter: data.astro?.frontmatter };
};
const html = async (source: string, options?: RevisionOptions) => (await run(source, options)).html;

const versions = (attrs = '', ...bodies: [string, string][]) =>
  [`::::revisions${attrs}`, ...bodies.map(([date, body]) => `:::version{date=${date}}\n${body}\n:::`), '::::'].join('\n');
const twoVersions = (attrs = '') => versions(attrs, ['2026-10-02', 'new'], ['2026-02-09', 'old']);

describe('addendum', () => {
  it('becomes an aside led by its dated label', async () => {
    expect(await html(':::addendum{date=2026-10-02}\nNow it is **Workers**.\n:::')).toBe(
      '<aside class="addendum"><p class="addendum-label">Added <time datetime="2026-10-02">2026-10-02</time></p>' +
        '<p>Now it is <strong>Workers</strong>.</p></aside>',
    );
  });

  it('takes its label from the options', async () => {
    expect(await html(':::addendum{date=2026-10-02}\nx\n:::', { labels: { addendum: '{date} 追記' } })).toContain(
      '<p class="addendum-label"><time datetime="2026-10-02">2026-10-02</time> 追記</p>',
    );
  });
});

describe('revisions (details)', () => {
  it('shows the latest version and folds the previous one under <details>', async () => {
    expect(await html(twoVersions())).toBe(
      '<div class="revisions" data-view="details">' +
        '<section class="revision" data-current><p class="revision-label">Latest</p><p>new</p></section>' +
        '<details class="revision"><summary class="revision-label">Previous</summary><p>old</p></details>' +
        '</div>',
    );
  });

  it('tells previous versions apart by their dates when there are more than one', async () => {
    expect(await html(versions('', ['2026-10-02', 'new'], ['2026-05-01', 'mid'], ['2026-02-09', 'old']))).toBe(
      '<div class="revisions" data-view="details">' +
        '<section class="revision" data-current><p class="revision-label">Latest</p><p>new</p></section>' +
        '<details class="revision"><summary class="revision-label">Previous (<time datetime="2026-05-01">2026-05-01</time>)</summary><p>mid</p></details>' +
        '<details class="revision"><summary class="revision-label">Previous (<time datetime="2026-02-09">2026-02-09</time>)</summary><p>old</p></details>' +
        '</div>',
    );
  });

  it('takes its labels from the options', async () => {
    const out = await html(twoVersions(), { labels: { latest: '最新の文章', previous: '前の文章' } });
    expect(out).toContain('<p class="revision-label">最新の文章</p>');
    expect(out).toContain('<summary class="revision-label">前の文章</summary>');
  });

  it('uses the date where a label places it, adding none of its own', async () => {
    const out = await html(versions('', ['2026-10-02', 'new'], ['2026-05-01', 'mid'], ['2026-02-09', 'old']), {
      labels: { latest: '最新 ({date})', previous: '{date} の文章' },
    });
    expect(out).toContain('<p class="revision-label">最新 (<time datetime="2026-10-02">2026-10-02</time>)</p>');
    expect(out).toContain('<summary class="revision-label"><time datetime="2026-05-01">2026-05-01</time> の文章</summary>');
  });

  it('is the default view', async () => {
    expect(await html(twoVersions('{view=details}'))).toBe(await html(twoVersions()));
  });

  it('allows versions of the same day', async () => {
    await expect(html(versions('', ['2026-10-02', 'b'], ['2026-10-02', 'a']))).resolves.toContain('<details');
  });
});

describe('revisions (tabs)', () => {
  it('pairs a radio and a tab per version, the current one checked, and marks each version with its radio', async () => {
    expect(await html(twoVersions('{view=tabs}'), { labels: { tabs: '版' } })).toBe(
      '<div class="revisions" data-view="tabs">' +
        '<div class="revision-tabs" role="radiogroup" aria-label="版">' +
        '<input type="radio" name="revision-1" id="revision-1-0" checked><label for="revision-1-0">Latest</label>' +
        '<input type="radio" name="revision-1" id="revision-1-1"><label for="revision-1-1">Previous</label>' +
        '</div>' +
        '<section class="revision" data-current data-shown-by="revision-1-0"><p>new</p></section>' +
        '<section class="revision" data-shown-by="revision-1-1"><p>old</p></section>' +
        '</div>',
    );
  });

  it('numbers each block of a post apart, so their radios never share a name', async () => {
    const out = await html(`${twoVersions('{view=tabs}')}\n\n${twoVersions('{view=tabs}')}`);
    expect(out.match(/name="revision-\d+"/g)).toEqual(['name="revision-1"', 'name="revision-1"', 'name="revision-2"', 'name="revision-2"']);
  });
});

describe('headings in past versions', () => {
  it('get ids of their own, listed for the table of contents to leave out', async () => {
    const source = versions('', ['2026-10-02', '## Setup\nnew'], ['2026-02-09', '## Setup\nold\n### Details\nmore']);
    const { html, frontmatter } = await run(source);
    expect(html).toContain('<h2>Setup</h2><p>new</p>');
    expect(html).toContain('<h2 id="was-2026-02-09-1">Setup</h2>');
    expect(html).toContain('<h3 id="was-2026-02-09-2">Details</h3>');
    expect(frontmatter.revisionHiddenHeadings).toEqual(['was-2026-02-09-1', 'was-2026-02-09-2']);
  });

  it('lists nothing when no past version has a heading', async () => {
    expect((await run(twoVersions())).frontmatter.revisionHiddenHeadings).toBeUndefined();
  });
});

describe('updated', () => {
  it('is the newest date of an addendum or a current version', async () => {
    const source = `:::addendum{date=2026-07-01}\nx\n:::\n\n${versions('', ['2026-09-01', 'b'], ['2026-02-09', 'a'])}`;
    expect((await run(source)).frontmatter.updated).toBe('2026-09-01');
  });

  it('is not set for a post without updates', async () => {
    expect((await run('text')).frontmatter).toBeUndefined();
  });
});

describe('nesting', () => {
  it('converts an addendum inside a version', async () => {
    const source = ':::::revisions\n::::version{date=2026-10-02}\nnew\n::::\n::::version{date=2026-02-09}\n:::addendum{date=2026-03-01}\nnote\n:::\n::::\n:::::';
    expect(await html(source)).toContain('<details class="revision"><summary class="revision-label">Previous</summary><aside class="addendum">');
  });

  it('leaves a gallery inside, with more colons around it, to the gallery plugin', async () => {
    const source = ':::::revisions\n::::version{date=2026-10-02}\n:::gallery\n![](a.jpg)\n:::\n::::\n::::version{date=2026-02-09}\nold\n::::\n:::::';
    const out = await render(source, { remark: [remarkRevision, remarkGallery], path: 'post.md' });
    expect(out).toContain('class="gallery');
    expect(out).not.toContain(':::');
  });
});

describe('mistakes fail the build, naming the line', () => {
  it.each([
    [':::addendum\nx\n:::', ':::addendum needs a date (date=YYYY-MM-DD)'],
    [':::addendum{date=2026/10/02}\nx\n:::', ':::addendum date must be YYYY-MM-DD, got "2026/10/02"'],
    [twoVersions('{view=slides}'), '::::revisions view must be details or tabs, got "slides"'],
    [versions('', ['2026-10-02', 'only']), '::::revisions needs at least two :::version blocks, found 1'],
    [':::version{date=2026-10-02}\nx\n:::', ':::version belongs inside ::::revisions'],
  ])('%s', async (source, message) => {
    await expect(html(`text\n\n${source}`)).rejects.toThrow(`post.md:3: ${message}`);
  });

  it('a version without a date', async () => {
    await expect(html('::::revisions\n:::version\nnew\n:::\n:::version{date=2026-02-09}\nold\n:::\n::::')).rejects.toThrow(
      'post.md:2: :::version needs a date',
    );
  });

  it('something other than versions inside', async () => {
    await expect(html('::::revisions\nstray text\n\n:::version{date=2026-10-02}\nx\n:::\n::::')).rejects.toThrow(
      'post.md:2: ::::revisions holds only :::version blocks',
    );
  });

  it('versions out of order', async () => {
    await expect(html(versions('', ['2026-02-09', 'old'], ['2026-10-02', 'new']))).rejects.toThrow(
      'post.md:5: :::version blocks go newest first; 2026-10-02 comes after 2026-02-09',
    );
  });

  it('more versions than the tabs view has room for', async () => {
    const many = Array.from({ length: 6 }, (_, i): [string, string] => [`2026-0${9 - i}-01`, 'x']);
    await expect(html(versions('{view=tabs}', ...many))).rejects.toThrow('::::revisions{view=tabs} holds at most 5 versions, found 6');
  });

  it.each([
    ['a version', '::::revisions\n:::version{date=2026-10-02}\n:::gallery\n![](a.jpg)\n:::\nnew\n:::\n:::version{date=2026-02-09}\nold\n:::\n::::', 7],
    ['an addendum', ':::addendum{date=2026-10-02}\n:::gallery\n![](a.jpg)\n:::\nmore\n:::\n\nafter', 6],
  ])('a directive inside %s with as many colons, which closes it early', async (_, source, line) => {
    await expect(html(source)).rejects.toThrow(`post.md:${line}: a stray ":::" closes nothing; a directive inside another needs fewer colons`);
  });

  it('but not ::: in inline code', async () => {
    await expect(html(':::addendum{date=2026-10-02}\nx\n:::\n\n`:::`')).resolves.toContain('<code>:::</code>');
  });
});
