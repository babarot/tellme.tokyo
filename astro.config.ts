import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import remarkDirective from 'remark-directive';
import remarkGallery from './src/plugins/gallery/remark';
import remarkCarousel from './src/plugins/carousel/remark';
import remarkDirectiveFallback from './src/plugins/directive-fallback/remark';
import remarkHeadingLevels from './src/plugins/heading-levels/remark';
import remarkLinkCard from './src/plugins/link-card/remark';
import rehypeFigureCaption from './src/plugins/figure-caption/rehype';

export default defineConfig({
  site: 'https://tellme.tokyo',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    // unified instead of the default Sätteri, for the remark/rehype plugin ecosystem
    processor: unified({
      // Plugins live in src/plugins/ (see the README there). The directive ones
      // need remark-directive first and directive-fallback after them.
      remarkPlugins: [
        remarkDirective,
        [remarkGallery, { rowHeight: 150, gap: 5 }],
        [remarkCarousel, { interval: 7000, ratio: '16/9', indicator: 'dot' }],
        remarkDirectiveFallback,
        remarkHeadingLevels,
        [remarkLinkCard, { cacheFile: '.cache/link-cards.json' }],
      ],
      rehypePlugins: [rehypeFigureCaption],
      remarkRehype: { footnoteLabel: '脚注', footnoteBackLabel: '本文に戻る' },
      smartypants: false,
    }),
    shikiConfig: {
      // light/dark for every site theme; extra keys are used by one theme only
      // (see "Shiki per theme" in src/styles/global.css)
      themes: { light: 'github-light', dark: 'github-dark', 'tokyo-night': 'tokyo-night' },
    },
  },
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
