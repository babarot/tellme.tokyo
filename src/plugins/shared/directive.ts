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
  const file = localImage(url, postFile);
  if (!file) return undefined;
  try {
    const { width, height, orientation } = await sharp(file).metadata();
    if (!width || !height) return undefined;
    // EXIF orientations 5-8 are rotated by 90 degrees
    return orientation && orientation >= 5 ? { width: height, height: width } : { width, height };
  } catch {
    return undefined;
  }
}

// The color most of an image's outermost pixels share, as "#rrggbb": for a
// screenshot, the background its content sits on. Undefined for remote images
// or files that cannot be read. An animated image is read from its first frame.
export async function edgeColor(url: string, postFile: string | undefined) {
  const file = localImage(url, postFile);
  if (!file) return undefined;
  try {
    const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    const counts = new Map<number, number>();
    const add = (x: number, y: number) => {
      const i = (y * width + x) * channels;
      const rgb = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
      counts.set(rgb, (counts.get(rgb) ?? 0) + 1);
    };
    for (let x = 0; x < width; x++) (add(x, 0), add(x, height - 1));
    for (let y = 1; y < height - 1; y++) (add(0, y), add(width - 1, y));
    const [rgb] = [...counts].reduce((a, b) => (b[1] > a[1] ? b : a));
    return `#${rgb.toString(16).padStart(6, '0')}`;
  } catch {
    return undefined;
  }
}

// The file of an image referenced from a post, if it is local and exists.
function localImage(url: string, postFile: string | undefined) {
  if (!postFile || /^[a-z]+:/i.test(url) || url.startsWith('/')) return undefined;
  const file = path.resolve(path.dirname(postFile), decodeURI(url));
  return fs.existsSync(file) ? file : undefined;
}

// An mdast node that becomes the given hast element, keeping `children` as
// mdast (so images in it still go through Astro's image pipeline).
export function element(tagName: string, properties: Record<string, unknown>, children: any[]) {
  return { type: 'directiveElement', children, data: { hName: tagName, hProperties: properties } };
}
