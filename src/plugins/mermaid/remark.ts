// ```mermaid code blocks become <pre class="mermaid"> holding the diagram
// source, which client.ts draws. Done on the Markdown tree, before syntax
// highlighting would turn the source into colored code.
export default function remarkMermaid() {
  return (tree: any) => {
    const walk = (node: any) => {
      node.children?.forEach((child: any, i: number) => {
        if (child.type === 'code' && child.lang === 'mermaid') {
          node.children[i] = {
            type: 'mermaid',
            data: {
              hName: 'pre',
              hProperties: { className: ['mermaid'] },
              hChildren: [{ type: 'text', value: child.value }],
            },
          };
        } else {
          walk(child);
        }
      });
    };
    walk(tree);
  };
}
