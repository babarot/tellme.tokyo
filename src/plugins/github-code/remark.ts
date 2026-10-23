// ::github{url="https://github.com/<owner>/<repo>/blob/<ref>/<path>#L9-L19"}
// shows those lines of the file, numbered as in the file, under a one-line
// header with the file's path linking to it and the ref (the line numbers say
// which lines). The lines are read at build time and cached
// (cache.ts); they go on as a plain code block, so the site's highlighting
// and code-block plugin apply. `lang=` overrides the language guessed from
// the file name. A file that cannot be read stays a link; a URL that is not a
// GitHub file, or lines past the end of the file, fail the build, naming the
// line. Needs remark-directive before it; run it before code-block.
//
//   <div class="github-code" style="counter-reset:github-code-line 8;--github-code-digits:2">
//     <div class="github-code-header not-prose">
//       <svg class="github-code-icon"/>
//       <a class="github-code-path" href=…>owner/repo/path</a>
//       <span class="github-code-ref">main</span>
//     </div>
//     <pre>…</pre>
//   </div>
import path from 'node:path';
import { createCache } from './cache';
import { fetchText } from './fetch';
import { languageOf, parseSource, selectLines, type Source } from './source';

export type GitHubCodeOptions = {
  /** where the lines are cached. Default ".cache/github-code.json" */
  cacheFile?: string;
  /** for tests: how to read a file's text */
  fetchText?: (raw: string) => Promise<string | null>;
};

// GitHub's mark (Octicons mark-github, 16px)
const MARK =
  'M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z';

class GitHubCodeError extends Error {}

const el = (tagName: string, properties: Record<string, unknown>, children: any[] = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const text = (value: string) => ({ type: 'text', value });

function header(s: Source) {
  return [
    el('svg', { className: ['github-code-icon'], viewBox: '0 0 16 16', ariaHidden: 'true' }, [el('path', { d: MARK })]),
    el('a', { className: ['github-code-path'], href: s.url, target: '_blank', rel: 'noopener noreferrer' }, [text(`${s.owner}/${s.repo}/${s.path}`)]),
    el('span', { className: ['github-code-ref'] }, [text(s.ref)]),
  ];
}

function block(s: Source, code: string, lang: string) {
  const first = s.start ?? 1;
  const last = first + code.split('\n').length - 1;
  return {
    type: 'githubCode',
    data: {
      hName: 'div',
      hProperties: { className: ['github-code'], style: `counter-reset:github-code-line ${first - 1};--github-code-digits:${String(last).length}` },
    },
    children: [
      { type: 'githubCodeHeader', children: [], data: { hName: 'div', hProperties: { className: ['github-code-header', 'not-prose'] }, hChildren: header(s) } },
      { type: 'code', lang, value: code },
    ],
  };
}

const link = (url: string) => ({ type: 'paragraph', children: [{ type: 'link', url, children: [{ type: 'text', value: url }] }] });

export default function remarkGitHubCode(options: GitHubCodeOptions = {}) {
  const cache = createCache({ file: path.resolve(options.cacheFile ?? '.cache/github-code.json') });
  const get = options.fetchText ?? ((raw: string) => fetchText(raw));

  return async (tree: any, file: any) => {
    const jobs: Promise<void>[] = [];
    const show = async (parent: any, i: number, node: any) => {
      const attrs = node.attributes ?? {};
      if (!attrs.url) throw new GitHubCodeError('::github needs url=...');
      const s = parseSource(attrs.url);
      if (!s) throw new GitHubCodeError(`::github needs the URL of a file on GitHub (…/blob/<ref>/<path>#L<n>-L<m>): ${attrs.url}`);
      const code = await cache.get(s.url, async () => {
        const whole = await get(s.raw);
        if (whole === null) return null;
        const lines = selectLines(whole, s.start, s.end);
        if (lines === null) throw new GitHubCodeError(`${s.path} has fewer than ${s.end} lines`);
        return lines;
      });
      if (code === null) console.warn(`[github-code] could not read ${s.raw}; left as a link`);
      parent.children[i] = code === null ? link(s.url) : block(s, code, attrs.lang || languageOf(s.path));
    };
    const walk = (node: any) => {
      node.children?.forEach((child: any, i: number) => {
        if (child.type === 'leafDirective' && child.name === 'github') {
          jobs.push(
            show(node, i, child).catch((e) => {
              if (e instanceof GitHubCodeError) throw new Error(`${file.path ?? 'post'}:${child.position?.start.line ?? '?'}: ${e.message}`);
              throw e;
            }),
          );
        } else {
          walk(child);
        }
      });
    };
    walk(tree);
    await Promise.all(jobs);
  };
}
