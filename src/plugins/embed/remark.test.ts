import { describe, expect, it } from 'vitest';
import { render } from '../shared/test-utils';
import remarkEmbed from './remark';

const embed = (source: string, options = {}) => render(source, { remark: [[remarkEmbed, options]], path: 'post.md' });

describe('remarkEmbed', () => {
  it('turns ::tweet into a quote linking to the tweet, for X to replace', async () => {
    expect(await embed('::tweet{id=123 user=babarot}')).toBe(
      '<blockquote class="embed-tweet twitter-tweet" data-dnt="true"><a href="https://twitter.com/babarot/status/123">https://twitter.com/babarot/status/123</a></blockquote>',
    );
  });

  it('turns ::youtube into a 16:9 iframe on youtube-nocookie.com', async () => {
    const html = await embed('::youtube{id=GPdLEKzHd1g}');
    expect(html).toContain('<div class="embed embed-youtube" style="aspect-ratio:16/9">');
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/GPdLEKzHd1g"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('allowfullscreen');
  });

  it('turns ::spotify into a fixed-height iframe, with the dark theme and small size as asked', async () => {
    const big = await embed('::spotify{type=episode id=abc theme=dark}');
    expect(big).toContain('style="height:232px"');
    expect(big).toContain('src="https://open.spotify.com/embed/episode/abc?theme=0"');
    const small = await embed('::spotify{id=abc size=small}');
    expect(small).toContain('style="height:152px"');
    expect(small).toContain('src="https://open.spotify.com/embed/track/abc"');
  });

  it('turns ::slideshare into the deck with a "title from author" caption', async () => {
    const html = await embed('::slideshare{key=K url="user/deck" title="My deck" author="@me"}');
    expect(html).toContain('src="https://www.slideshare.net/slideshow/embed_code/key/K"');
    expect(html).toContain('<figcaption><a href="https://www.slideshare.net/user/deck">My deck</a> from @me</figcaption>');
  });

  it('leaves out the SlideShare caption without a url', async () => {
    expect(await embed('::slideshare{key=K}')).not.toContain('figcaption');
  });

  it('fails the build on a missing attribute, naming the line', async () => {
    await expect(embed('text\n\n::youtube{}')).rejects.toThrow('post.md:3: ::youtube needs id=...');
  });

  it('handles only the names given', async () => {
    const html = await embed('::tweet{id=1}\n\n::youtube{id=x}', { only: ['youtube'] });
    expect(html).toContain('embed-youtube');
    expect(html).not.toContain('embed-tweet');
  });

  it('encodes attribute values into the URL', async () => {
    expect(await embed('::youtube{id="a b&c<d"}')).toContain('src="https://www.youtube-nocookie.com/embed/a%20b%26c%3Cd"');
  });
});
