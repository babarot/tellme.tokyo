// Leaf directives for embeds (::tweet, ::youtube, ::spotify, ::slideshare);
// see providers.ts for each one's attributes. Needs remark-directive before it.
// A directive with a missing attribute fails the build, naming the line.
import { EmbedError, providers } from './providers';

export type EmbedOptions = {
  /** directive names to handle; default: all of providers.ts */
  only?: string[];
};

export default function remarkEmbed({ only }: EmbedOptions = {}) {
  const names = new Set(only ?? Object.keys(providers));
  return (tree: any, file: any) => {
    const walk = (node: any) => {
      node.children?.forEach((child: any, i: number) => {
        if (child.type === 'leafDirective' && names.has(child.name)) {
          try {
            const hast = providers[child.name](child.attributes ?? {});
            // An mdast node standing for the hast element, children and all.
            node.children[i] = {
              type: 'embed',
              data: { hName: (hast as any).tagName, hProperties: (hast as any).properties, hChildren: (hast as any).children },
            };
          } catch (e) {
            if (e instanceof EmbedError) {
              throw new Error(`${file.path ?? 'post'}:${child.position?.start.line ?? '?'}: ${e.message}`);
            }
            throw e;
          }
        } else {
          walk(child);
        }
      });
    };
    walk(tree);
  };
}
