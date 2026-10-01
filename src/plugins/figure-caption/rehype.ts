// A paragraph holding a single image with a title becomes a figure with the
// title as its caption: ![alt](src "caption")
export default function rehypeFigure() {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node.children) return;
      node.children = node.children.map((child: any) => {
        const kids = child.children?.filter((c: any) => !(c.type === 'text' && !c.value.trim()));
        if (child.tagName === 'p' && kids?.length === 1 && kids[0].tagName === 'img' && kids[0].properties?.title) {
          const img = kids[0];
          const caption = String(img.properties.title);
          delete img.properties.title;
          return {
            type: 'element',
            tagName: 'figure',
            properties: {},
            children: [img, { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] }],
          };
        }
        visit(child);
        return child;
      });
    };
    visit(tree);
  };
}
