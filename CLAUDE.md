# tellme.tokyo

babarot's personal blog, built as a static site with Astro and served from Cloudflare Workers. It was a Hugo site until 2026-10; its posts were migrated (see "Writing posts").

Japanese belongs only in content: posts and the UI text readers see (button labels, 脚注, 目次, font names). Code, comments and docs in the repository are written in English.

## Colors (themes)

- Every color on the site comes from a CSS variable for its role (`--c-*`: page background, body text, headings, links, rules, ...). The list of roles is at the top of `src/styles/themes/default.css`.
- A theme is a set of colors in `src/styles/themes/<name>.css`, with values for both color schemes, light and dark. There are `default` (neutral grays), `mini` (the colors of the Hugo-era babarot/mini theme) and `tokyo-night` (dark: the Night style of folke/tokyonight.nvim; light: Tokyo Night Light from enkia/tokyo-night-vscode-theme).
- The site's theme is `theme` in `src/config.ts`.
- In dev and previews, `?theme=mini` in the URL switches the theme and `?scheme=dark` (or `light`) the color scheme, for comparing. They combine.
- Never write a color directly. In Tailwind use the role names (`text-heading`, `border-line`, ...); in CSS use `var(--c-*)`. Do not split colors with `dark:`; the theme already holds the dark values.
- Code highlighting can differ per theme: add a Shiki theme to `shikiConfig.themes` in `astro.config.ts` and say when to use it under "Shiki per theme" in `src/styles/global.css` (tokyo-night's dark scheme is the example).
- To add a theme: copy default.css, change the values and the `[data-theme]` name, import it in `src/styles/global.css`, and add the name to `themes` in `src/config.ts`.

## Body font

The body font is 游ゴシック where the reader has it (Windows); elsewhere (Macs, iPhones) Zen Kaku Gothic New, served from the site (`src/fonts/`, `--font-sans` in `src/styles/global.css`).

- The build cuts Zen Kaku down to the characters in the built pages and scripts, plus kana, ASCII and punctuation, and writes `dist/fonts/zen-kaku-gothic-new-<weight>.<hash>.woff2` (about 120 KB each, 400 and 700). The hash changes with the characters, so `public/_headers` lets browsers cache the files for good.
- The whole font is fetched from Google Fonts on first use and kept in `.cache/fonts/`, as the OG fonts are. `pnpm dev` serves it whole, without subsetting.
- `font-display: optional`: a page never switches fonts while it is read. When the font does not arrive in time (a first visit on a slow phone), that page stays in the fallback and the next one uses the cached font.
- The font is preloaded only where 游ゴシック is missing (the inline script in `src/layouts/Base.astro`), so Windows never downloads it.
- The site name in the header is set in Sixtyfour, as on the OG image, from the same subset (`src/assets/fonts/Sixtyfour-tellme.tokyo.ttf`, `@font-face` in `src/styles/global.css`).

## OG images

Every page has an Open Graph image (the picture of its card on X, Slack, ...), drawn at build time. A design that shows the post (`perPost: true`) gives each post its own at `/post/.../og.png`; one that does not gives the whole site one, `/og.png`.

- A design is a file in `src/og/designs/` (`default`: the title and date; `pixel`: the logo and the site name in a pixel font; `sixtyfour`: the site name alone in Sixtyfour, ".tokyo" in red); `ogDesign` in `src/config.ts` picks the one in use. `src/og/kit.ts` has what designs build with (phrase-aware title wrapping, title sizes, the logo and face).
- With `pnpm dev` running, http://localhost:4321/dev/og/ shows every design with a few posts. The dark label at the bottom left there mimics what X draws over a large card.
- To add a design: copy one in `src/og/designs/`, change it, add its name to `ogDesigns` in `src/config.ts` and to `designs` in `src/og/render.ts`.
- Colors are written in the design itself: satori does not read the site's CSS.
- A design lists its fonts (`src/og/fonts.ts`): small ones are committed in `src/assets/fonts/`; large ones (Noto Sans JP for `default`) are fetched from Google Fonts when first needed and kept in `.cache/fonts/` (not committed). Only the design in use loads its fonts, so a build with `sixtyfour` never fetches.
- `PixelifySans-tellme.tokyo.ttf` and `Sixtyfour-tellme.tokyo.ttf` hold only the letters of "tellme.tokyo". For other text in those fonts, fetch a new subset: the `.ttf` URL in `https://fonts.googleapis.com/css2?family=<Family+Name>&text=<the letters>` (fetched without a browser's user agent, Google Fonts answers with TrueType).

## Development notes

- After changing a remark/rehype plugin, the Markdown settings or the post schema (front matter fields in `src/content.config.ts`), delete `.astro` and `node_modules/.astro` and restart the dev server. A running server keeps the old schema and drops fields it does not know. Astro does not convert a post again while its source is unchanged, so old results (failed ones included) stay.
- Right after clearing that cache, the first start can fail to load the posts and serve 404 for them (the log says `The collection "post" does not exist or is empty`). Restart once more.
- URLs end with a slash (`/post/2025/01/29/gomi/`), as on Hugo. The dev server answers 404 without it; in production Cloudflare redirects to the slashed URL.
- Every post URL the Hugo site had is listed in `tools/old-urls.txt` and must keep working, as a page or a redirect in `public/_redirects`: `SHOW_DRAFTS=1 pnpm build && pnpm check:urls`.
- Link cards are cached in `.cache/link-previews.json` (committed). After deleting a post or changing its links, `pnpm prune:link-previews` drops the entries no post uses (`--dry-run` to list them only). Builds never prune: they convert only the posts that changed.

## Deploying

The site runs on Cloudflare Workers as static files (`wrangler.jsonc`; no Worker code). Workers Builds, connected to the GitHub repository, builds every push:

- `main` → production (tellme.tokyo). Drafts are left out.
- any other branch → a preview URL, with drafts and `noindex` (`WORKERS_CI_BRANCH` in `src/lib/posts.ts`). Preview URLs are behind Cloudflare Access.

To check locally what Workers serves (redirects in `public/_redirects`, the 404 page, trailing slashes): `pnpm build && pnpm exec wrangler dev`.

## Plugins

Whatever in the Markdown pipeline or the article UI can stand on its own lives in `src/plugins/<name>/`, one folder each (gallery, carousel, lightbox, link card, table of contents, ...). The rules are in `src/plugins/README.md`; in short:

- No imports from site code (only `src/plugins/shared/`), so a folder can move to another project as is.
- Plain CSS, no Tailwind. Colors come in through `--<plugin>-*` variables with fallbacks; `src/styles/global.css` maps them to the site's theme.
- Options are plugin arguments, set in `astro.config.ts`.
- Tests sit next to the code (`*.test.ts`, Vitest). `pnpm test` must pass after any change to a plugin; when behavior changes on purpose, change the tests with it.

## Writing posts

Posts live in this repository and nowhere else (the Obsidian sync was dropped: directives and embedded HTML do not render there), one folder each: `content/post/<year>/<slug>/`. New posts are MDX (`index.mdx`); the posts migrated from Hugo are Markdown (`index.md`, converted by `tools/hugo-to-astro.py`). The slug is the folder name and the URL is `/post/<date>/<slug>/`.

- The build never rewrites a post's source; layout and structure are adjusted at render time. A post's source stays exactly what its author wrote.
- Body headings may start at `#` or at `##`. The post title is the page's h1, so when the body has a `#`, every heading is rendered one level lower (`#` → h2, `##` → h3); a post written from `##` is left as is. A leading `#` that repeats the title is not rendered (`src/plugins/heading-levels/`).
- A single `#` lowers every heading of that post. When mixing `#` and `##`, use `#` for chapters and `##` for sections.
- `draft: true`: still being written; built only in dev and previews (with a DRAFT label). `pnpm dev --no-draft` leaves drafts out, as production does. `hidden: true`: withdrawn; never built anywhere, as if the post did not exist (its old URL counts as hidden on purpose in `pnpm check:urls`).
- `mise run post ls` lists posts by front matter (state, tag, date, a pattern in the source); `mise run post edit` takes the same filters and opens the posts picked with fzf in `$EDITOR`. The options are at the top of `tools/post.ts`.
- Every post's front matter has the keys of the schema, in its order: `title`, `date`, (`slug`), `description`, `draft`, `hidden`, `toc`, `tags`. `pnpm check:posts` (`mise run post check`) must pass; `mise run post check --fix` adds the missing keys with their defaults and puts the keys in order, leaving each value as written.
- `toc: true` in the front matter shows a table of contents (h2 and h3): in the space right of the content column on wide screens, at the top of the post otherwise (`src/plugins/toc/`).

### Photos (directives)

```
:::gallery        rows of equal height filling the width, aspect ratios kept; click to enlarge
![](images/a.jpg)
![](images/b.jpg)
:::

:::carousel       one photo at a time in a 16:9 frame; < >, dots, advances every 7s; click to enlarge
![](images/a.jpg)
:::
```

- To change one use only, set attributes: `:::gallery{rowHeight=200 minRows=2}`, `:::carousel{interval=5000 indicator=bar ratio=4/3 autoplay=false fit=contain backdrop=edge}`. `fit=contain` shows each photo whole instead of cropping it to the frame (screenshots of different sizes); `backdrop=edge` then paints the bands left around it in the color of the photo's edge, so a screenshot's background runs on to the frame's sides. `minRows=2` keeps a gallery from squeezing a few photos into one low row on wide screens; narrow screens may still use more rows.
- In a carousel, an image's title (`![alt](a.jpg "caption")`) is shown under the frame while that photo is on show.
- Without JavaScript a carousel shows its photos side by side in a row that scrolls sideways, each with its caption (`@media (scripting: none)` in `src/plugins/carousel/style.css`).
- The photos inside are ordinary Markdown images, so Astro optimizes them.
- List the images one by one, not by pattern (`images/*`).
- `:::img` gives one image options (`src/plugins/img/`): `width` (the most it is shown at, in px; it still shrinks on narrow screens) and `scheme` (`light` or `dark`: shown only in that color scheme). For an image with a light and a dark version, write two blocks. Without options, a plain `![](...)` is enough.

```
:::img{scheme=light width=500}
![alt](shot-light.png "caption")
:::

:::img{scheme=dark width=500}
![alt](shot-dark.png "caption")
:::
```

### Updating an old post

When a post has gone out of date, update it without rewriting what it said: readers who saw it before must still find the old text (`src/plugins/revision/`).

```
:::addendum{date=2026-10-02}      a dated note; the text around it stays as it was
...
:::

::::revisions                     a rewritten part: versions newest first, the first is the current one;
:::version{date=2026-10-02}       past ones fold away under <details>
...
:::
:::version{date=2026-02-09}
...
:::
::::
```

- `::::revisions{view=tabs}` shows the versions as tabs instead (at most 5; CSS only).
- A directive inside another needs more colons around it: `:::::revisions` > `::::version` > `:::gallery`. Otherwise the inner closing fence closes the outer one too; the build fails at the stray `:::`.
- The header shows the newest date of an addendum or a current version ("2026-10-02 更新"); headings in past versions stay out of the table of contents.

### Embeds and diagrams

- `::tweet{id=... user=...}`, `::youtube{id=...}`, `::spotify{type=episode id=... theme=dark}`, `::slideshare{key=... url="user/slug" title="..." author="..."}` (`src/plugins/embed/`). A missing attribute fails the build.
- A ```` ```mermaid ```` code block is drawn as a diagram and follows the color scheme (`src/plugins/mermaid/`).
- A file name after a code block's language (```` ```json:package.json ````) is shown above the code. Every code block gets a copy button, shown on hover and not at all on touch screens (`src/plugins/code-block/`).
- Anything else can be raw HTML (an `<iframe>` from a site's embed code); iframes never overflow the column.
- No other directives are in use. Text like `foo:bar` in a post is shown as written (`src/plugins/directive-fallback/`).

## Figures

Rules for HTML figures embedded in posts. They keep figures in one tone across the blog, while a change made for one post never breaks the figures of older posts.

### Where they go

- A figure sits next to the post that uses it: `<post directory>/figures/<name>.part.html`.
- An `.mdx` post embeds it with `<Partial name="<name>" />` (no import needed).
- The name only has to be unique within the post.

### Three layers of CSS

| Layer | Where | Rule |
|---|---|---|
| Tokens | `src/styles/figures/tokens.css` | Colors, type sizes, spacing, radii. This sets the tone of every figure; change it rarely. |
| Shared components | `src/styles/figures/components.css` | `.tree`, `.tag`, `.note`, `.chip`, `.caption`, `.legend` and the hue modifiers (`.gray` `.blue` `.orange` `.green` `.red`). Adding is free; changing how an existing class looks is not. |
| Per-figure CSS | the `<style>` inside a `.part.html` | Layout and details only that figure has. `<Partial>` wraps it in `@scope`, so a plain `.box { }` never reaches outside the figure. The figure's root is `:scope`. |

### Catalog

With `pnpm dev` running, http://localhost:4321/dev/figures/ shows the shared components (with their HTML) and every figure of every post, light and dark side by side. It is not part of the production build.

### Writing a figure

1. First see whether the shared components can do it: check the catalog or components.css.
2. Write only what is missing, in the figure's own `<style>`.
3. When the same pattern shows up in two or three figures' `<style>`, promote it to a shared component. Do not design components up front.
4. If a shared component really must look different, update every figure that uses it in the same change.

### Not allowed (checked by `pnpm check:figures`)

- `<html>`, `<head>`, `<body>`, `<script>`. A figure is an HTML fragment without JavaScript.
- `style=""` attributes. Give the element a class and style it in `<style>`.
- Color literals (`#fff`, `rgb()`, `oklch()`, ...). Use the `--fig-*` color tokens.
- `font-size` other than the `--fig-text*` tokens; `font-family` other than `var(--font-sans)` or `var(--font-mono)`.
- Defining custom properties, except `--c` pointing at a color token (`.tag` and `.note` read it).

Spacing (margin, padding, gap) may use plain values, though `--fig-space-*` is preferred.

### Checking

- Look at both color schemes: the catalog shows them side by side; on a post page add `?scheme=dark` or `?scheme=light`.
- After changing a shared component, check in the catalog that older figures still look right.
- `pnpm check:figures` must pass.
