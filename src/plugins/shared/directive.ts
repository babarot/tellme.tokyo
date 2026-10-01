// Helpers shared by the directive-based plugins (gallery, carousel).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Image nodes inside a directive, in order.
export function imagesIn(node: any, out: any[] = []): any[] {
  if (node.type === 'image') out.push(node);
  for (const child of node.children ?? []) imagesIn(child, out);
  return out;
}

// Calls fn for every container directive named `name`, replacing it in place.
export async function eachContainer(tree: any, name: string, fn: (node: any) => Promise<any> | any) {
  const jobs: Promise<void>[] = [];
  const walk = (node: any) => {
    for (const [i, child] of (node.children ?? []).entries()) {
      if (child.type === 'containerDirective' && child.name === name) {
        jobs.push(Promise.resolve(fn(child)).then((out) => void (node.children[i] = out)));
      } else {
        walk(child);
      }
    }
  };
  walk(tree);
  await Promise.all(jobs);
}

// Width and height of an image referenced from a post, read from the file.
// Undefined for remote images or files that cannot be read.
export async function imageSize(url: string, postFile: string | undefined) {
  if (!postFile || /^[a-z]+:/i.test(url) || url.startsWith('/')) return undefined;
  const file = path.resolve(path.dirname(postFile), decodeURI(url));
  if (!fs.existsSync(file)) return undefined;
  try {
    const { width, height, orientation } = await sharp(file).metadata();
    if (!width || !height) return undefined;
    // EXIF orientations 5-8 are rotated by 90 degrees
    return orientation && orientation >= 5 ? { width: height, height: width } : { width, height };
  } catch {
    return undefined;
  }
}

// An mdast node that becomes the given hast element, keeping `children` as
// mdast (so images in it still go through Astro's image pipeline).
export function element(tagName: string, properties: Record<string, unknown>, children: any[]) {
  return { type: 'directiveElement', children, data: { hName: tagName, hProperties: properties } };
}
