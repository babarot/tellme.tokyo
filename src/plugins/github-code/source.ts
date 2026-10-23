// What a GitHub file URL points at, and the lines it asks for. Pure.
//
//   https://github.com/<owner>/<repo>/blob/<ref>/<path>?plain=1#L9-L19
//
// A ref with a slash in it (a branch like "feature/x") cannot be told apart
// from the path; the raw URL works either way, and only the label shows the
// first segment as the ref.

export type Source = {
  url: string;
  owner: string;
  repo: string;
  ref: string;
  path: string;
  /** where the file's text is */
  raw: string;
  /** the first and last line asked for (1-based); none for the whole file */
  start?: number;
  end?: number;
};

export function parseSource(url: string): Source | null {
  const m = /^https:\/\/github\.com\/([^/?#]+)\/([^/?#]+)\/blob\/([^/?#]+)\/([^?#]+)(?:\?[^#]*)?(#.*)?$/.exec(url);
  if (!m) return null;
  const [, owner, repo, ref, path, hash] = m;
  const source: Source = { url, owner, repo, ref, path, raw: `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}` };
  if (!hash) return source;
  // #L9, #L9-L19, and the column forms GitHub also writes (#L9C3-L19C5)
  const lines = /^#L(\d+)(?:C\d+)?(?:-L(\d+)(?:C\d+)?)?$/.exec(hash);
  if (!lines) return null;
  const start = Number(lines[1]);
  const end = Number(lines[2] ?? lines[1]);
  if (start < 1 || end < start) return null;
  return { ...source, start, end };
}

// The lines asked for out of the file's text; null when the file is shorter.
export function selectLines(text: string, start?: number, end?: number): string | null {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
  if (start === undefined || end === undefined) return lines.join('\n');
  if (end > lines.length) return null;
  return lines.slice(start - 1, end).join('\n');
}

// The highlighting language from the file name: its extension, or the whole
// name when it has none (Makefile, Dockerfile).
export function languageOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1).toLowerCase();
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1) : name;
}
