# tellme.tokyo

babarot's personal blog: Astro, built into static files and served from Cloudflare Workers. It was a Hugo site until 2026-10. The code explains how things work; this file says what the author wants from them, so you can decide as the author would when the code does not tell you.

Japanese belongs only in content: posts and the UI text readers see. Code, comments, commits and docs are in English.

## Committing and deploying

There are no pull requests for ordinary work. Changes are committed to `main` (from a worktree: rebased onto `main` and fast-forwarded), and pushing `main` is the deploy: Workers Builds builds it and publishes it at once, without drafts.

- Push only when asked.
- Before pushing: `pnpm check:posts` and `pnpm build`; `pnpm test` after a plugin change, `pnpm check:figures` after a figure change.
- A pull request is opened only to see a draft post on a preview. Workers Builds builds every other branch at a preview URL, with drafts and `noindex`. Preview URLs are behind Cloudflare Access, so the author has to open them.
- One change per commit, the subject an imperative sentence (see `git log`). The author often asks for several changes to be collected and committed together; leave them staged until asked.

## What the author cares about

- A post is what its author wrote. The build never rewrites a post's source; anything about layout or structure is done at render time. Do not touch a post's wording unless asked.
- Old readers are respected. A post that has gone out of date gets an `addendum` or `revisions` (`src/plugins/revision/`) so the old text can still be found. Rewording that does not change what a post says (typos, style, the current voice) is done in place. Text in a past `version` is never edited.
- Links out there keep working. Every URL the Hugo site had (`tools/old-urls.txt`) must still answer, as a page or a redirect in `public/_redirects`: `SHOW_DRAFTS=1 pnpm build && pnpm check:urls`.
- Reading comes first. A page never shifts while it is read (the body font is `font-display: optional`), works without JavaScript (the carousel's no-script view is the model), and looks right in both color schemes.
- Colors are roles, not values (`--c-*`, Tailwind role names), so a theme can be swapped or compared with `?theme=` and `?scheme=`. Never write a color literal or split with `dark:`.
- Pieces stay portable. A plugin in `src/plugins/<name>/` imports nothing from the site, so the folder can move to another project as is (rules: `src/plugins/README.md`).
- Figures keep one tone across the blog, and a change made for one post never breaks an older post's figure. That is why the shared components in `src/styles/figures/components.css` may be added to freely but an existing class only changes together with every figure that uses it, and why `pnpm check:figures` forbids literals and inline styles. Reuse a component first; promote a pattern only after it shows up in two or three figures.

## Writing posts

Posts are written in Japanese. The author may ask for a post to be reworded in the voice of the recent published posts; read a few of them first and follow them.

- Posts live only in this repository, one folder each: `content/post/<year>/<slug>/`. New posts are `index.mdx`; the ones migrated from Hugo are `index.md`.
- `draft: true` is still being written: shown in dev and previews, not in production (`mise run dev --no-draft` hides it locally). `hidden: true` is withdrawn: built nowhere, as if it never existed.
- Front matter has the schema's keys in its order; `mise run post check --fix` puts them right. `mise run post ls` / `edit` / `open` find posts by state, tag, date or text, and list them, open them in the editor or in the browser on the dev server.
- Headings: the title is the h1. A post may start its headings at `#` (then `#` is a chapter and `##` a section, all rendered one level lower) or at `##`.
- Directives in use: `gallery`, `carousel`, `img`, `addendum`, `revisions`/`version`, `tweet`, `youtube`, `spotify`, `slideshare`; their options are in `src/plugins/<name>/`. Do not invent others: unknown `foo:bar` text is shown as written. Anything else can be raw HTML.
- Figures are `<post>/figures/<name>.part.html`, embedded in an `.mdx` post with `<Partial name="<name>" />`.

## Not obvious from the code

- After changing a remark/rehype plugin, the Markdown settings or the post schema, delete `.astro` and `node_modules/.astro` and restart the dev server: it keeps the old schema and Astro does not convert an unchanged post again. The first start after that may report `The collection "post" does not exist or is empty`; restart once more.
- URLs end with a slash. The dev server answers 404 without it; production redirects.
- A directive inside another needs more colons than its parent (`:::::revisions` > `::::version` > `:::gallery`), or the inner fence closes the outer one.
- A bare URL becomes a link card only as a top-level paragraph, not inside a directive. Cards are cached in `.cache/link-previews.json`, which is committed: the dev server or a build adds entries, so commit them with the post that added the link. After removing links, `pnpm prune:link-previews`.
- The OG and header fonts `PixelifySans-tellme.tokyo.ttf` and `Sixtyfour-tellme.tokyo.ttf` hold only the letters of "tellme.tokyo". For other text, fetch a subset from `https://fonts.googleapis.com/css2?family=<Family+Name>&text=<letters>` without a browser user agent (Google Fonts then answers with TrueType).
- With `mise run dev` running, `/dev/og/` shows every OG design and `/dev/figures/` every figure, light and dark side by side. Use them to check a change by eye. `pnpm build && pnpm exec wrangler dev` serves what Workers serves (redirects, the 404 page, trailing slashes).
