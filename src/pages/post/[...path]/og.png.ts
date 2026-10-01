// A post's Open Graph image, next to the post: /post/2025/01/29/gomi/og.png.
// None when the design in use has one image for the whole site.
import type { APIContext } from 'astro';
import { getPosts, postPath, formatDate, type Post } from '../../../lib/posts';
import { perPostOg, renderOg } from '../../../og/render';

export async function getStaticPaths() {
  if (!perPostOg) return [];
  const posts = await getPosts();
  return posts.map((post) => ({
    params: { path: postPath(post).replace(/^\/post\/|\/$/g, '') },
    props: { post },
  }));
}

export async function GET({ props }: APIContext) {
  const { post } = props as { post: Post };
  const png = await renderOg({ title: post.data.title, date: formatDate(post.data.date) });
  return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
}
