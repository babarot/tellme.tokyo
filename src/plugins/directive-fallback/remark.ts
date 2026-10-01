// remark-directive reads `:name`, `::name` and `:::name` as directives, which
// also catches ordinary text like `ratio:16` or `key:value`. Run this after the
// plugins that handle the directives you use: any directive still left in the
// tree is turned back into its source text, exactly as written.
export default function remarkDirectiveFallback() {
  return (tree: any, file: any) => {
    const source = String(file.value);
    const asText = (node: any) => {
      const text = { type: 'text', value: source.slice(node.position.start.offset, node.position.end.offset) };
      return node.type === 'textDirective' ? text : { type: 'paragraph', children: [text] };
    };
    const walk = (node: any) => {
      node.children?.forEach((child: any, i: number) => {
        if (child.type === 'textDirective' || child.type === 'leafDirective' || child.type === 'containerDirective') {
          node.children[i] = asText(child);
        } else {
          walk(child);
        }
      });
    };
    walk(tree);
  };
}
