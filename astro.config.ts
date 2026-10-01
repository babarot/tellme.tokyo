import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import remarkDirective from 'remark-directive';
import remarkGallery from './src/plugins/gallery/remark';
import remarkCarousel from './src/plugins/carousel/remark';
import remarkImg from './src/plugins/img/remark';
import remarkEmbed from './src/plugins/embed/remark';
import remarkMermaid from './src/plugins/mermaid/remark';
import remarkCodeBlock from './src/plugins/code-block/remark';
import remarkDirectiveFallback from './src/plugins/directive-fallback/remark';
import remarkHeadingLevels from './src/plugins/heading-levels/remark';
import remarkLinkPreview from './src/plugins/link-preview/remark';
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
        remarkImg,
        remarkEmbed,
        remarkDirectiveFallback,
        remarkHeadingLevels,
        remarkMermaid,
        remarkCodeBlock,
        [remarkLinkPreview, { cacheFile: '.cache/link-previews.json' }],
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
  // sitemap-index.xml (Hugo's /sitemap.xml redirects to it: public/_redirects)
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
