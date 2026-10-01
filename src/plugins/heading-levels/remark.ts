// Keeps the post title the only h1 on the page without touching the post's
// source (posts are also edited in Obsidian, so the build never rewrites them).
//
// 1. A leading `# heading` that repeats the title (Obsidian notes often start
//    with one) is dropped from the output.
// 2. If the body still has an h1, every heading is rendered one level lower
//    (# -> h2, ## -> h3, ...), so a post written from `#` keeps its structure.
//    Posts written from `##` are left as they are.
const textOf = (node: any): string =>
  node.value ?? (node.children ?? []).map(textOf).join('');

function headings(node: any, out: any[] = []): any[] {
  if (node.type === 'heading') out.push(node);
  for (const child of node.children ?? []) headings(child, out);
  return out;
}

export default function remarkHeadingLevels() {
  return (tree: any, file: any) => {
    const title = file.data?.astro?.frontmatter?.title;
    const first = tree.children.find((n: any) => n.type !== 'yaml' && n.type !== 'mdxjsEsm');
    if (first?.type === 'heading' && first.depth === 1 && textOf(first).trim() === title?.trim()) {
      tree.children.splice(tree.children.indexOf(first), 1);
    }

    const all = headings(tree);
    if (all.some((h) => h.depth === 1)) {
      for (const h of all) h.depth = Math.min(h.depth + 1, 6);
    }
  };
}
