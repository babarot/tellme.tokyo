// RSS at /feed.xml, the path Hugo used, so existing subscriptions keep working.
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postDescription, postPath } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: 'tellme.tokyo',
    description: 'babarot のブログ',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      link: postPath(post),
      pubDate: new Date(post.data.date),
      description: postDescription(post),
    })),
    customData: '<language>ja</language>',
  });
}
