# plugins

Self-contained pieces of the Markdown pipeline and the article UI. Each folder
works on its own: it does not import site code (only `shared/`), and its CSS
takes colors from CSS variables with fallbacks, so a folder can be copied into
another Astro (or any unified) project as is.

| plugin | what it does | parts |
|---|---|---|
| `gallery` | `:::gallery` of images as a justified gallery (rows of equal height filling the width); smaller copies via srcset for the grid | remark, style, client, layout, thumbnails |
| `carousel` | `:::carousel` of images, one at a time with prev/next, indicators, autoplay, swipe | remark, style, client, state |
| `lightbox` | click a photo inside `[data-lightbox]` to see it large; prev/next, counter, keys, swipe | style, client, viewer |
| `toc` | table of contents from the headings; marks the section being read | style, client, toc |
| `embed` | `::tweet`, `::youtube`, `::spotify`, `::slideshare` | remark, style, client, providers |
| `mermaid` | ```` ```mermaid ```` code blocks drawn as diagrams; follows the color scheme | remark, style, client |
| `img` | `:::img` for one image with options: `width` (most px), `scheme` (light or dark only) | remark, style |
| `code-block` | a copy button on every code block; ```` ```json:package.json ```` shows the file name above the code | remark, style, client |
| `link-preview` | a paragraph that is only a URL becomes a card with the page's title, description, image and icon (cached; failed fetches are retried after 30 days) | remark, parse, fetch, cache, html, style |
| `heading-levels` | keeps the post title the only h1 without rewriting the source | remark |
| `figure-caption` | `![alt](src "caption")` alone in a paragraph becomes a figure with a caption | rehype |
| `directive-fallback` | turns directives nothing handled back into their text (`ratio:16` stays as written) | remark |
| `shared` | helpers shared by the plugins: directives, swipe, tests | |

## Parts

- `remark.ts` / `rehype.ts`: the unified plugin, default export, options as its argument
- `style.css`: plain CSS (no Tailwind), colors via `--<plugin>-*` variables with fallbacks
- `client.ts`: browser behavior, an exported `init*()` to call from a page `<script>`
- the decisions behind that behavior, without the DOM: `gallery/layout.ts`, `carousel/state.ts`, `lightbox/viewer.ts`. `client.ts` only feeds them events and draws what they return, so the rules can be tested without a browser
- `*.test.ts`: tests, next to what they test (Vitest; browser-side ones run in happy-dom)

## Tests

```sh
pnpm test          # run once
pnpm test:watch    # rerun on change
```

The tests fix the behavior in place, in three layers:

- the DOM-free decisions (`layout`, `state`, `viewer`, `swipe`): the rules
  themselves, e.g. wrapping, autoplay timing, loading order. Most tests live here.
- what each remark/rehype plugin outputs, as HTML
- `client.test.ts` (happy-dom): only that the page is wired to those decisions,
  written from what a reader sees (buttons by their label, the photo by its alt)

happy-dom does no layout or painting, so anything that depends on them (sizes
on screen, image decoding in a real browser) is checked in a browser. `gallery/layout.test.ts` also pins how the galleries of
a real post are split into rows, so a change to the layout algorithm shows up.
`shared/test-utils.ts` runs Markdown through a unified pipeline like Astro's
(`gfm: true` to turn on GFM autolinks).

## Wiring (this site)

- plugins and their options: `astro.config.ts`
- CSS and the color variables: `src/styles/global.css`
- client scripts: `src/pages/post/[...path].astro`

Directive plugins need `remark-directive` before them and `directive-fallback`
after them. `code-block` goes after `mermaid`, which takes its code blocks first.

## Options

```ts
[remarkGallery, { rowHeight: 150, gap: 5, thumbnailWidths: [300, 600, 900, 1200] }]
[remarkCarousel, { interval: 7000, autoplay: true, ratio: '16/9', indicator: 'dot' }]
[remarkLinkPreview, { cacheFile: '.cache/link-previews.json', retryAfterDays: 30 }]
```

Per use, as directive attributes:

```md
:::gallery{rowHeight=200}
:::carousel{interval=5000 indicator=bar ratio=4/3 autoplay=false}
```
