// Lists the posts in content/post by their front matter, and opens the ones
// picked with fzf in $EDITOR. Usage: mise run post -- --help
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const USAGE = `Usage:
  mise run post ls   [filters] [--format tsv|json|path]
  mise run post open [filters] [--no-fzf] [query...]

ls prints the posts that pass the filters. open lets you pick them with fzf
(Tab for several) and opens them in $EDITOR (nvim when unset); the query is
fzf's first input, and --no-fzf opens every post that passes the filters.

Filters:
  --draft, --published, --hidden   by state (any of them); default: draft and published
  --all                            every state, hidden too
  --tag <name>                     has the tag (repeatable: all of them)
  --since <date>, --until <date>   by date, as a prefix: 2020, 2023-06, 2023-06-01
  --grep <pattern>                 the source matches (rg)
  --sort date|title, --reverse     default: newest first

  -h, --help                       show this help`;

const ROOT = path.resolve(import.meta.dirname, '..');
const POSTS = path.join(ROOT, 'content/post');
const STATES = ['draft', 'published', 'hidden'] as const;

export type State = (typeof STATES)[number];

export type Post = {
  path: string; // relative to the working directory, as fzf and the editor get it
  date: string;
  title: string;
  state: State;
  tags: string[];
};

export type Filter = {
  states: Set<State>;
  tags: string[];
  since?: string;
  until?: string;
  matched?: Set<string>; // paths that --grep found
  sort: 'date' | 'title';
  reverse: boolean;
};

// Reads the subset of YAML that front matter uses here (see the schema in
// src/content.config.ts): scalars, quoted or not, and lists, inline
// (["a", "b"]) or one "- item" per line.
export function frontMatter(source: string): Record<string, string | string[]> {
  const block = source.match(/^---\n([\s\S]*?)\n---(\n|$)/)?.[1] ?? '';
  const data: Record<string, string | string[]> = {};
  let list: string[] | undefined;
  for (const line of block.split('\n')) {
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && list) {
      list.push(scalar(item[1]));
      continue;
    }
    const pair = line.match(/^([A-Za-z_]\w*):\s*(.*)$/);
    if (!pair) continue;
    const [, key, value] = pair;
    if (value === '') {
      list = data[key] = [];
    } else if (value.startsWith('[')) {
      list = undefined;
      data[key] = value
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((s) => scalar(s.trim()))
        .filter(Boolean);
    } else {
      list = undefined;
      data[key] = scalar(value);
    }
  }
  return data;
}

// A quoted value as written inside its quotes; an unquoted one up to a comment
function scalar(s: string): string {
  return s.match(/^(["'])(.*)\1\s*(#.*)?$/)?.[2] ?? s.replace(/\s+#.*$/, '');
}

// A post from its source; hidden wins over draft, as it is never built
export function toPost(file: string, source: string): Post {
  const fm = frontMatter(source);
  return {
    path: file,
    date: String(fm.date ?? '').slice(0, 10),
    title: String(fm.title ?? ''),
    state: fm.hidden === 'true' ? 'hidden' : fm.draft === 'true' ? 'draft' : 'published',
    tags: Array.isArray(fm.tags) ? fm.tags : [],
  };
}

export function select(posts: Post[], f: Filter): Post[] {
  const selected = posts
    .filter((p) => f.states.has(p.state))
    .filter((p) => f.tags.every((t) => p.tags.includes(t)))
    .filter((p) => !f.since || p.date.slice(0, f.since.length) >= f.since)
    .filter((p) => !f.until || p.date.slice(0, f.until.length) <= f.until)
    .filter((p) => !f.matched || f.matched.has(p.path));
  if (f.sort === 'date') selected.sort((a, b) => b.date.localeCompare(a.date));
  else selected.sort((a, b) => a.title.localeCompare(b.title));
  if (f.reverse) selected.reverse();
  return selected;
}

export const tsv = (p: Post) => [p.path, p.date, p.state, p.title, p.tags.join(',')].join('\t');

function readPosts(): Post[] {
  return fs
    .readdirSync(POSTS, { recursive: true, encoding: 'utf8' })
    .filter((f) => /(^|\/)index\.mdx?$/.test(f))
    .map((f) => {
      const file = path.join(POSTS, f);
      return toPost(path.relative(process.cwd(), file), fs.readFileSync(file, 'utf8'));
    });
}

// Files under content/post whose source matches the pattern
function grep(pattern: string): Set<string> {
  const rg = spawnSync('rg', ['--files-with-matches', '--glob', 'index.md', '--glob', 'index.mdx', '--regexp', pattern, POSTS], {
    encoding: 'utf8',
  });
  if (rg.error) fail(`rg: ${rg.error.message}`);
  if (rg.status === 2) fail(rg.stderr.trim());
  return new Set(rg.stdout.split('\n').filter(Boolean).map((f) => path.relative(process.cwd(), f)));
}

function fail(message: string): never {
  console.error(`post: ${message}`);
  process.exit(2);
}

const OPTIONS = {
  draft: { type: 'boolean' },
  published: { type: 'boolean' },
  hidden: { type: 'boolean' },
  all: { type: 'boolean' },
  tag: { type: 'string', multiple: true },
  since: { type: 'string' },
  until: { type: 'string' },
  grep: { type: 'string' },
  sort: { type: 'string', default: 'date' },
  reverse: { type: 'boolean' },
  format: { type: 'string', default: 'tsv' },
  'no-fzf': { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
} as const;

export type Args = {
  command?: string;
  query: string[];
  help: boolean;
  format: string;
  noFzf: boolean;
  grep?: string;
  filter: Filter;
};

// Throws on an unknown option or value, with a message for the user
export function parse(argv: string[]): Args {
  const { values: o, positionals } = parseArgs({ args: argv, allowPositionals: true, options: OPTIONS });
  if (o.sort !== 'date' && o.sort !== 'title') throw new Error(`unknown sort: ${o.sort}`);
  if (!['tsv', 'json', 'path'].includes(o.format)) throw new Error(`unknown format: ${o.format}`);
  const picked = STATES.filter((s) => o[s]);
  const [command, ...query] = positionals;
  return {
    command,
    query,
    help: o.help ?? false,
    format: o.format,
    noFzf: o['no-fzf'] ?? false,
    grep: o.grep,
    filter: {
      states: new Set(o.all ? STATES : picked.length ? picked : ['draft', 'published']),
      tags: o.tag ?? [],
      since: o.since,
      until: o.until,
      sort: o.sort,
      reverse: o.reverse ?? false,
    },
  };
}

function main() {
  let args: Args;
  try {
    args = parse(process.argv.slice(2));
  } catch (e) {
    fail(`${(e as Error).message}\n\n${USAGE}`);
  }
  const { command, query, filter } = args;
  if (args.help) {
    console.log(USAGE);
    process.exit(0);
  }
  if (args.grep !== undefined) filter.matched = grep(args.grep);
  const posts = select(readPosts(), filter);

  switch (command) {
    case 'ls':
      if (args.format === 'tsv') posts.forEach((p) => console.log(tsv(p)));
      else if (args.format === 'json') console.log(JSON.stringify(posts, null, 2));
      else posts.forEach((p) => console.log(p.path));
      break;

    case 'open': {
      if (!posts.length) fail('no posts match');
      let files = posts.map((p) => p.path);
      if (!args.noFzf) {
        const fzf = spawnSync(
          'fzf',
          [
            '--multi',
            '--delimiter=\t',
            '--with-nth=2..',
            '--tabstop=2',
            `--query=${query.join(' ')}`,
            '--preview=bat --color=always --style=plain {1} 2>/dev/null || cat {1}',
            '--preview-window=right,60%,wrap',
          ],
          { input: posts.map(tsv).join('\n'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] },
        );
        if (fzf.error) fail(`fzf: ${fzf.error.message}`);
        // 1: nothing matched, 130: cancelled
        if (fzf.status !== 0) process.exit(0);
        files = fzf.stdout
          .split('\n')
          .filter(Boolean)
          .map((line) => line.split('\t')[0]);
      }
      const editor = process.env.EDITOR || 'nvim';
      spawnSync(editor, files, { stdio: 'inherit' });
      break;
    }

    default:
      console.error(USAGE);
      process.exit(2);
  }
}

if (import.meta.main) main();
