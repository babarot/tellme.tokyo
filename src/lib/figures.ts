// HTML figures (figures/<name>.part.html next to a post). Shared by <Partial>
// and the figure catalog at /dev/figures/.
const sources = import.meta.glob(['/content/post/**/figures/*.part.html'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export type Figure = {
  // "content/post/2026/foo/figures/zsh-startup": unique across the blog, used
  // as the @scope key so figures with the same name in two posts never mix
  key: string;
  // "content/post/2026/foo"
  postDir: string;
  name: string;
  source: string;
};

function toFigure(path: string, source: string): Figure {
  const key = path.replace(/^\//, '').replace(/\.part\.html$/, '');
  const [postDir, name] = key.split('/figures/');
  return { key, postDir, name, source };
}

export function allFigures(): Figure[] {
  return Object.entries(sources)
    .map(([path, source]) => toFigure(path, source))
    .sort((a, b) => b.key.localeCompare(a.key));
}

export function getFigure(postDir: string, name: string): Figure {
  const path = `/${postDir}/figures/${name}.part.html`;
  const source = sources[path];
  if (source === undefined) {
    throw new Error(`Figure not found: ${path}`);
  }
  return toFigure(path, source);
}

// Pulls the figure's own <style> blocks out and scopes them to the figure, so
// a plain `.box { }` in one figure never leaks into another.
export function renderFigure(figure: Figure): { html: string; css: string } {
  const styles: string[] = [];
  const html = figure.source.replace(/<style>([\s\S]*?)<\/style>/g, (_, css: string) => {
    styles.push(css);
    return '';
  });
  const css = styles.length ? `@scope ([data-fig="${figure.key}"]) {${styles.join('\n')}}` : '';
  return { html, css };
}
