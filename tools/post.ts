// Lists the posts in content/post by their front matter, and opens the ones
// picked with fzf in $EDITOR. Usage: mise run post --help
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const USAGE = `Usage:
  mise run post ls    [filters] [--format tsv|json|path]
  mise run post edit  [filters] [--no-fzf] [query...]
  mise run post tags  [filters]
  mise run post check [filters] [--fix]

ls prints the posts that pass the filters, and tags their tags. edit lets you
pick them with fzf (Tab for several) and opens them in $EDITOR (nvim when
unset); the query is fzf's first input, and --no-fzf opens every post that
passes the filters.

check reports what is wrong with the posts' front matter (missing keys, keys
not in the schema, keys out of order) and exits 1 if anything is; it looks at
every state unless one is asked for. --fix adds the missing keys with their
defaults and puts the keys in order, keeping each value as written.

Filters:
  --draft, --published, --hidden   by state (any of them); default: draft and published (check: all)
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

// The keys a post's front matter has, in this order: those of the schema in
// src/content.config.ts. slug is optional (the folder name otherwise); title
// and date have no default; the others get the schema's default when missing.
export const KEYS = ['title', 'date', 'slug', 'description', 'draft', 'hidden', 'toc', 'tags'] as const;
const DEFAULTS: Record<string, string> = {
  description: 'description: ""',
  draft: 'draft: false',
  hidden: 'hidden: false',
  toc: 'toc: false',
  tags: 'tags: []',
};

// What is wrong with a post's front matter, and the source with what can be
// fixed fixed: missing keys added with their defaults, and the keys put in
// order. Each key keeps its lines as written; unknown keys go last. What is
// left in lint(fixed).problems needs a person (a key twice is never fixed).
export function lint(source: string): { problems: string[]; fixed: string } {
  const m = source.match(/^---\n([\s\S]*?)\n---(\n|$)/);
  if (!m) return { problems: ['no front matter'], fixed: source };
  const problems: string[] = [];
  const blocks = new Map<string, string[]>();
  const lead: string[] = []; // lines before the first key
  let last = lead;
  for (const line of m[1].split('\n')) {
    const key = line.match(/^([A-Za-z_]\w*):/)?.[1];
    if (!key) last.push(line); // a list item, or a blank line
    else if (blocks.has(key)) problems.push(`${key}: twice`);
    else blocks.set(key, (last = [line]));
  }
  // an unknown key ranks after every known one
  const rank = (k: string) => {
    const i = (KEYS as readonly string[]).indexOf(k);
    return i < 0 ? KEYS.length : i;
  };
  const written = [...blocks.keys()];
  written.filter((k) => rank(k) === KEYS.length).forEach((k) => problems.push(`${k}: not in the schema`));
  if (written.some((k, i) => i > 0 && rank(k) < rank(written[i - 1])))
    problems.push(`keys out of order (${KEYS.join(', ')}, then the others)`);
  for (const k of KEYS) {
    if (blocks.has(k) || k === 'slug') continue;
    problems.push(DEFAULTS[k] ? `${k}: missing` : `${k}: missing (no default)`);
    if (DEFAULTS[k]) blocks.set(k, [DEFAULTS[k]]);
  }
  if (problems.some((p) => p.endsWith(': twice'))) return { problems, fixed: source };
  const order = [...KEYS.filter((k) => blocks.has(k)), ...written.filter((k) => rank(k) === KEYS.length)];
  const lines = [...lead, ...order.flatMap((k) => blocks.get(k)!)];
  return { problems, fixed: `---\n${lines.join('\n')}\n---${m[2]}${source.slice(m[0].length)}` };
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

// What fzf gets for a post: the path (hidden, handed back for the editor),
// then the date and, on a second line, the title
export const fzfItem = (p: Post) => `${p.path}\t${p.date}\n${p.title}`;

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
  fix: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
} as const;

export type Args = {
  command?: string;
  query: string[];
  help: boolean;
  format: string;
  noFzf: boolean;
  fix: boolean;
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
    fix: o.fix ?? false,
    grep: o.grep,
    filter: {
      states: new Set(o.all || (command === 'check' && !picked.length) ? STATES : picked.length ? picked : ['draft', 'published']),
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

    case 'tags':
      [...new Set(posts.flatMap((p) => p.tags))].sort().forEach((t) => console.log(t));
      break;

    case 'edit': {
      if (!posts.length) fail('no posts match');
      let files = posts.map((p) => p.path);
      if (!args.noFzf) {
        const fzf = spawnSync(
          'fzf',
          [
            '--multi',
            '--read0',
            '--delimiter=\t',
            '--with-nth=2..',
            '--accept-nth=1',
            '--gap',
            // a bar down both lines of the current post
            '--pointer=▌',
            `--query=${query.join(' ')}`,
            '--preview=bat --color=always --style=plain {1} 2>/dev/null || cat {1}',
            '--preview-window=right,60%,wrap',
          ],
          { input: posts.map(fzfItem).join('\0'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] },
        );
        if (fzf.error) fail(`fzf: ${fzf.error.message}`);
        // 1: nothing matched, 130: cancelled
        if (fzf.status !== 0) process.exit(0);
        files = fzf.stdout.split('\n').filter(Boolean);
      }
      const editor = process.env.EDITOR || 'nvim';
      spawnSync(editor, files, { stdio: 'inherit' });
      break;
    }

    case 'check': {
      let bad = 0;
      for (const p of posts) {
        const source = fs.readFileSync(p.path, 'utf8');
        let { problems, fixed } = lint(source);
        if (args.fix && fixed !== source) {
          fs.writeFileSync(p.path, fixed);
          console.log(`${p.path}: fixed`);
          problems = lint(fixed).problems;
        }
        problems.forEach((problem) => console.log(`${p.path}: ${problem}`));
        if (problems.length) bad++;
      }
      if (bad) {
        console.error(`post: ${bad} of ${posts.length} posts need a fix${args.fix ? ' by hand' : ' (--fix for what it can)'}`);
        process.exit(1);
      }
      break;
    }

    default:
      console.error(USAGE);
      process.exit(2);
  }
}

if (import.meta.main) main();
