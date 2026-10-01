// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { initTweets, tweetTheme } from './client';

const scripts = () => document.querySelectorAll('script[src="https://platform.twitter.com/widgets.js"]');

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.className = '';
});

describe('tweetTheme', () => {
  it('follows the .dark class on <html>', () => {
    expect(tweetTheme()).toBe('light');
    document.documentElement.classList.add('dark');
    expect(tweetTheme()).toBe('dark');
  });
});

describe('initTweets', () => {
  it('loads X\'s script once and sets the theme on every tweet', () => {
    document.documentElement.classList.add('dark');
    document.body.innerHTML = '<blockquote class="embed-tweet"></blockquote><blockquote class="embed-tweet"></blockquote>';
    initTweets();
    initTweets();
    expect(scripts()).toHaveLength(1);
    expect([...document.querySelectorAll<HTMLElement>('.embed-tweet')].map((t) => t.dataset.theme)).toEqual(['dark', 'dark']);
  });

  it('loads nothing on a page without tweets', () => {
    document.body.innerHTML = '<p>no tweets</p>';
    initTweets();
    expect(scripts()).toHaveLength(0);
  });
});
