import { getCollection, type CollectionEntry } from 'astro:content';
import { excerpt } from './excerpt';

export type Post = CollectionEntry<'post'>;

export const STATES = ['published', 'draft', 'hidden'] as const;
export type State = (typeof STATES)[number];

// Which posts are built, by state. `astro dev` and Workers Builds of any
// branch but main (preview URLs; wrangler.jsonc) build published posts and
// drafts; any other build only published ones. POST_STATES, a comma-separated
// list of states, overrides that (`mise run dev --all`, a local build with
// drafts), except in the production build: hidden posts never go out.
const productionBuild = process.env.WORKERS_CI === '1' && process.env.WORKERS_CI_BRANCH === 'main';
const previewBuild = process.env.WORKERS_CI === '1' && !productionBuild;

function shownStates(): Set<State> {
  if (productionBuild) return new Set(['published']);
  const listed = process.env.POST_STATES?.split(',').map((s) => s.trim()).filter(Boolean);
  if (listed?.length) {
    const unknown = listed.filter((s) => !(STATES as readonly string[]).includes(s));
    if (unknown.length) throw new Error(`POST_STATES: unknown state ${unknown.join(', ')} (${STATES.join(', ')})`);
    return new Set(listed as State[]);
  }
  return new Set(import.meta.env.DEV || previewBuild ? ['published', 'draft'] : ['published']);
}

export const shown = shownStates();

// Anything but what production shows: the site marks itself as not for
// search engines and offers the theme switch
export const unpublishedShown = [...shown].some((s) => s !== 'published');

// hidden wins over draft, as it is never built
export function stateOf(post: Post): State {
  return post.data.hidden ? 'hidden' : post.data.draft ? 'draft' : 'published';
}

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('post', (post) => shown.has(stateOf(post)));
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
