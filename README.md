<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/astro-v2-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/screenshots/astro-v2-light.png">
  <img alt="tellme.tokyo" src="docs/screenshots/astro-v2-light.png">
</picture>

babarot's blog, at https://tellme.tokyo/. Built with [Astro](https://astro.build/) and served from Cloudflare Workers.

```sh
pnpm install
pnpm dev     # http://localhost:4321/
pnpm test
pnpm build   # into dist/
```

Posts are in `content/post/<year>/<slug>/`. How the site is put together, and how to write posts: [AGENTS.md](AGENTS.md).
