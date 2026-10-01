// Turns the tweet quotes (providers.ts) into X's own embed: loads X's script
// once, only on pages that have a tweet, with the theme matching the page.
const WIDGETS = 'https://platform.twitter.com/widgets.js';

// "dark" when the page is in dark mode (a .dark class on <html>, the
// Tailwind convention), "light" otherwise.
export function tweetTheme(root: Element = document.documentElement): 'dark' | 'light' {
  return root.classList.contains('dark') ? 'dark' : 'light';
}

export function initTweets(root: ParentNode = document) {
  const tweets = [...root.querySelectorAll<HTMLElement>('blockquote.embed-tweet')];
  if (!tweets.length) return;
  const theme = tweetTheme();
  for (const tweet of tweets) tweet.dataset.theme = theme;
  if (document.querySelector(`script[src="${WIDGETS}"]`)) return;
  const script = document.createElement('script');
  script.src = WIDGETS;
  script.async = true;
  script.charset = 'utf-8';
  document.head.append(script);
}
