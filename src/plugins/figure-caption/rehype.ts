// A paragraph holding a single image with a title becomes a figure with the
// title as its caption: ![alt](src "caption"). The image may be wrapped in a
// link, [![alt](src "caption")](href); the link stays around the image.
const meaningful = (nodes: any[] = []) => nodes.filter((c: any) => !(c.type === 'text' && !c.value.trim()));

// The paragraph's only content: an image, or a link holding only an image
function soleImage(p: any): { content: any; img: any } | undefined {
  const [only, ...rest] = meaningful(p.children);
  if (!only || rest.length) return;
  if (only.tagName === 'img') return { content: only, img: only };
  if (only.tagName === 'a') {
    const [img, ...more] = meaningful(only.children);
    if (img?.tagName === 'img' && !more.length) return { content: only, img };
  }
}

export default function rehypeFigure() {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node.children) return;
      node.children = node.children.map((child: any) => {
        const found = child.tagName === 'p' ? soleImage(child) : undefined;
        if (found?.img.properties?.title) {
          const caption = String(found.img.properties.title);
          delete found.img.properties.title;
          return {
            type: 'element',
            tagName: 'figure',
            properties: {},
            children: [found.content, { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] }],
          };
        }
        visit(child);
        return child;
      });
    };
    visit(tree);
  };
}
