// What each embed directive turns into, as hast. Pure, no unified needed;
// remark.ts plugs these into the Markdown tree.
//
//   ::tweet{id=1171452762116091905 user=b4b4r07}
//   ::youtube{id=GPdLEKzHd1g}
//   ::spotify{type=episode id=368dieIZeYabeHAw2fH0Y7 theme=dark size=small}
//   ::slideshare{key=zrbK9wQkOA1j8K url="user/slug" title="Title" author="@name"}

export type Attributes = Record<string, string | undefined>;
export type Hast = { type: 'element'; tagName: string; properties: Record<string, unknown>; children: any[] } | { type: 'text'; value: string };

const el = (tagName: string, properties: Record<string, unknown>, children: Hast[] = []): Hast => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const text = (value: string): Hast => ({ type: 'text', value });

// An iframe in a box that keeps the given aspect ratio ("16/9") or height ("232px").
function frame(kind: string, src: string, title: string, size: { ratio?: string; height?: string }, allow = '') {
  return el(
    'div',
    {
      className: ['embed', `embed-${kind}`],
      style: size.ratio ? `aspect-ratio:${size.ratio}` : `height:${size.height}`,
    },
    [
      el('iframe', {
        src,
        title,
        loading: 'lazy',
        allow: allow || undefined,
        allowFullScreen: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
      }),
    ],
  );
}

export class EmbedError extends Error {}

const need = (attrs: Attributes, name: string, directive: string) => {
  const value = attrs[name];
  if (!value) throw new EmbedError(`::${directive} needs ${name}=...`);
  return value;
};

export const providers: Record<string, (attrs: Attributes) => Hast> = {
  // The tweet's own embed needs X's script (client.ts loads it). Until then,
  // and without JavaScript, this is a plain quote linking to the tweet.
  tweet(attrs) {
    const id = need(attrs, 'id', 'tweet');
    const url = `https://twitter.com/${attrs.user ?? 'i'}/status/${id}`;
    return el('blockquote', { className: ['embed-tweet', 'twitter-tweet'], dataDnt: 'true' }, [
      el('a', { href: url }, [text(url)]),
    ]);
  },

  // youtube-nocookie.com: no cookies until the reader plays the video
  youtube(attrs) {
    const id = need(attrs, 'id', 'youtube');
    return frame(
      'youtube',
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
      attrs.title ?? 'YouTube video',
      { ratio: '16/9' },
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
    );
  },

  spotify(attrs) {
    const id = need(attrs, 'id', 'spotify');
    const type = attrs.type ?? 'track';
    const query = attrs.theme === 'dark' ? '?theme=0' : '';
    return frame(
      'spotify',
      `https://open.spotify.com/embed/${encodeURIComponent(type)}/${encodeURIComponent(id)}${query}`,
      attrs.title ?? 'Spotify',
      { height: attrs.size === 'small' ? '152px' : '232px' },
      'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
    );
  },

  // The deck, then "title from author" linking to SlideShare, as their embed code does.
  slideshare(attrs) {
    const key = need(attrs, 'key', 'slideshare');
    const deck = frame('slideshare', `https://www.slideshare.net/slideshow/embed_code/key/${encodeURIComponent(key)}`, attrs.title ?? 'SlideShare', {
      ratio: '766/485',
    });
    if (!attrs.url) return deck;
    const page = `https://www.slideshare.net/${attrs.url}`;
    const caption: Hast[] = [el('a', { href: page }, [text(attrs.title ?? attrs.url)])];
    if (attrs.author) caption.push(text(` from ${attrs.author}`));
    return el('figure', { className: ['embed-figure'] }, [deck, el('figcaption', {}, caption)]);
  },
};
