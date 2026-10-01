// Test helper: runs Markdown through remark → (plugins) → rehype → HTML, the
// same shape of pipeline Astro uses.
import { unified, type PluggableList } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { VFile } from 'vfile';

export async function render(
  markdown: string,
  {
    remark = [],
    rehype = [],
    path,
    data,
    gfm = false,
  }: { remark?: PluggableList; rehype?: PluggableList; path?: string; data?: Record<string, unknown>; gfm?: boolean } = {},
) {
  const file = new VFile({ value: markdown, path, data });
  const out = await unified()
    .use(remarkParse)
    .use(gfm ? [remarkGfm] : [])
    .use(remarkDirective)
    .use(remark)
    .use(remarkRehype)
    .use(rehype)
    .use(rehypeStringify)
    .process(file);
  return String(out);
}
