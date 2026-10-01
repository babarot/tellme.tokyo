import { describe, expect, it } from 'vitest';
import { frontMatter, parse, select, toPost, tsv, type Filter, type Post } from './post.ts';

describe('frontMatter', () => {
  it('reads scalars, quoted or not', () => {
    const fm = frontMatter('---\ntitle: "Hello"\ndate: 2026-09-27\ndraft: true\nslug: \'s\'\n---\nbody\n');
    expect(fm).toEqual({ title: 'Hello', date: '2026-09-27', draft: 'true', slug: 's' });
  });

  it('reads inline lists', () => {
    expect(frontMatter('---\ntags: ["go", \'zsh\', cli]\n---\n').tags).toEqual(['go', 'zsh', 'cli']);
    expect(frontMatter('---\ntags: []\n---\n').tags).toEqual([]);
  });

  it('reads block lists, indented or not', () => {
    const fm = frontMatter('---\ntags:\n- go\n  - "hcl"\ndraft: true\n---\n');
    expect(fm).toEqual({ tags: ['go', 'hcl'], draft: 'true' });
  });

  it('drops comments after unquoted values only', () => {
    const fm = frontMatter('---\ndraft: true # for now\ntitle: "Issue #1"\nslug: "s" # old\n---\n');
    expect(fm).toEqual({ draft: 'true', title: 'Issue #1', slug: 's' });
  });

  it('keeps colons inside values', () => {
    expect(frontMatter('---\ntitle: "Go: a tour"\ndate: "2018-07-23T14:35:00+09:00"\n---\n')).toEqual({
      title: 'Go: a tour',
      date: '2018-07-23T14:35:00+09:00',
    });
  });

  it('reads nothing without a front matter block', () => {
    expect(frontMatter('# title\n\ntitle: no\n')).toEqual({});
  });

  it('stops at the closing ---, at the end of the file too', () => {
    expect(frontMatter('---\ntitle: a\n---')).toEqual({ title: 'a' });
    expect(frontMatter('---\ntitle: a\n---\n\n---\ntitle: b\n')).toEqual({ title: 'a' });
  });
});

describe('toPost', () => {
  const post = (fm: string) => toPost('p/index.md', `---\ntitle: t\ndate: "2019-02-19T21:40:24+09:00"\n${fm}---\n`);

  it('takes the day from the date', () => {
    expect(post('').date).toBe('2019-02-19');
  });

  it('is published unless draft or hidden, and hidden wins over draft', () => {
    expect(post('').state).toBe('published');
    expect(post('draft: false\n').state).toBe('published');
    expect(post('draft: true\n').state).toBe('draft');
    expect(post('hidden: true\n').state).toBe('hidden');
    expect(post('draft: true\nhidden: true\n').state).toBe('hidden');
  });

  it('has no tags when tags is missing or not a list', () => {
    expect(post('').tags).toEqual([]);
    expect(post('tags: go\n').tags).toEqual([]);
  });
});

describe('select', () => {
  const posts: Post[] = [
    { path: 'a', date: '2019-02-15', title: 'B', state: 'draft', tags: ['go'] },
    { path: 'b', date: '2023-06-30', title: 'A', state: 'published', tags: ['go', 'hcl'] },
    { path: 'c', date: '2023-07-01', title: 'C', state: 'hidden', tags: ['hcl'] },
    { path: 'd', date: '2026-01-01', title: 'D', state: 'draft', tags: [] },
  ];
  const all: Filter = { states: new Set(['draft', 'published', 'hidden']), tags: [], sort: 'date', reverse: false };
  const paths = (f: Partial<Filter>) => select(posts, { ...all, ...f }).map((p) => p.path);

  it('sorts newest first by default, by title, and reversed', () => {
    expect(paths({})).toEqual(['d', 'c', 'b', 'a']);
    expect(paths({ sort: 'title' })).toEqual(['b', 'a', 'c', 'd']);
    expect(paths({ reverse: true })).toEqual(['a', 'b', 'c', 'd']);
  });

  it('keeps the posts in any of the states', () => {
    expect(paths({ states: new Set(['draft']) })).toEqual(['d', 'a']);
    expect(paths({ states: new Set(['published', 'hidden']) })).toEqual(['c', 'b']);
  });

  it('keeps the posts with every tag', () => {
    expect(paths({ tags: ['go'] })).toEqual(['b', 'a']);
    expect(paths({ tags: ['go', 'hcl'] })).toEqual(['b']);
  });

  it('compares dates as prefixes, so a year or a month covers all of it', () => {
    expect(paths({ since: '2023' })).toEqual(['d', 'c', 'b']);
    expect(paths({ until: '2023-06' })).toEqual(['b', 'a']);
    expect(paths({ since: '2023-06', until: '2023-07-01' })).toEqual(['c', 'b']);
  });

  it('keeps the posts --grep found', () => {
    expect(paths({ matched: new Set(['a', 'c']) })).toEqual(['c', 'a']);
    expect(paths({ matched: new Set() })).toEqual([]);
  });

  it('leaves the input as it was', () => {
    select(posts, all);
    expect(posts.map((p) => p.path)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('parse', () => {
  it('defaults to drafts and published posts, newest first, as TSV', () => {
    const args = parse(['ls']);
    expect(args.command).toBe('ls');
    expect(args.format).toBe('tsv');
    expect(args.filter).toEqual({
      states: new Set(['draft', 'published']),
      tags: [],
      since: undefined,
      until: undefined,
      sort: 'date',
      reverse: false,
    });
  });

  it('takes the states asked for, or all of them', () => {
    expect(parse(['ls', '--hidden']).filter.states).toEqual(new Set(['hidden']));
    expect(parse(['ls', '--draft', '--published']).filter.states).toEqual(new Set(['draft', 'published']));
    expect(parse(['ls', '--all', '--draft']).filter.states).toEqual(new Set(['draft', 'published', 'hidden']));
  });

  it('collects repeated tags and the query after the command', () => {
    const args = parse(['open', '--tag', 'go', 'nix', '--tag', 'hcl', 'zsh']);
    expect(args.filter.tags).toEqual(['go', 'hcl']);
    expect(args.query).toEqual(['nix', 'zsh']);
  });

  it('reads -h, --help and --no-fzf', () => {
    expect(parse(['-h']).help).toBe(true);
    expect(parse(['--help']).help).toBe(true);
    expect(parse(['open', '--no-fzf']).noFzf).toBe(true);
  });

  it('rejects unknown options and values', () => {
    expect(() => parse(['ls', '--bogus'])).toThrow(/--bogus/);
    expect(() => parse(['ls', '--sort', 'size'])).toThrow('unknown sort: size');
    expect(() => parse(['ls', '--format', 'csv'])).toThrow('unknown format: csv');
  });
});

describe('tsv', () => {
  it('puts the path first, for fzf to hide and hand back', () => {
    const p: Post = { path: 'a/index.md', date: '2026-01-01', title: 'T', state: 'draft', tags: ['go', 'nix'] };
    expect(tsv(p)).toBe('a/index.md\t2026-01-01\tdraft\tT\tgo,nix');
  });
});
