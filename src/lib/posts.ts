import { getCollection, type CollectionEntry } from 'astro:content';
import { excerpt } from './excerpt';

export type Post = CollectionEntry<'post'>;

// Drafts are visible in `astro dev`, in builds with SHOW_DRAFTS=1, and in
// Workers Builds of any branch but main (preview URLs; wrangler.jsonc).
// Hidden posts are never visible.
const previewBuild = process.env.WORKERS_CI === '1' && process.env.WORKERS_CI_BRANCH !== 'main';
export const showDrafts = import.meta.env.DEV || process.env.SHOW_DRAFTS === '1' || previewBuild;

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('post', ({ data }) => !data.hidden && (showDrafts || !data.draft));
  return posts.sort((a, b) => b.data.date.localeCompare(a.data.date));
}

export function slugOf(post: Post): string {
  return post.data.slug ?? post.id.split('/').pop()!;
}

// "/post/2025/01/29/gomi/", same as Hugo's /post/:year/:month/:day/:filename/
export function postPath(post: Post): string {
  const [y, m, d] = post.data.date.slice(0, 10).split('-');
  return `/post/${y}/${m}/${d}/${slugOf(post)}/`;
}

// "2025-01-29", as the Hugo-era list showed it
export function formatDate(date: string): string {
  return date.slice(0, 10);
}

// The description for meta tags and the feed: the front matter's, else the
// opening of the post.
export function postDescription(post: Post): string {
  return post.data.description || excerpt(post.body ?? '');
}
