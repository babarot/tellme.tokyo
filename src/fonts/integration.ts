// Serves the body font from the site itself, cut down to the characters the
// site uses (see ./subset.ts).
//
// - build: after the pages are written, collect the characters of every page
//   and script in dist/, subset each weight to them as WOFF2, write
//   dist/fonts/<name>.<hash>.woff2 and point the pages at those files.
// - dev: answer the placeholder URLs with the whole font, so pages being
//   written show every character.
//
// The whole font comes from Google Fonts the first time and is kept in
// .cache/fonts/ (loadFont in src/og/fonts.ts).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import subsetFont from 'subset-font';
import { loadFont } from '../og/fonts';
import { addCharacters, baseCharacters, family, fontUrl, hashedUrl, rewriteUrls, weights } from './subset';

const wholeFont = async (weight: (typeof weights)[number]) => (await loadFont({ name: family, weight, google: family })).data;

function filesIn(dir: string, ext: RegExp): string[] {
  return fs.readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => ext.test(f)).map((f) => path.join(dir, f));
}

export default function bodyFont(): AstroIntegration {
  return {
    name: 'body-font',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const weight = weights.find((w) => req.url?.split('?')[0] === fontUrl(w));
          if (!weight) return next();
          try {
            res.setHeader('Content-Type', 'font/ttf');
            res.end(await wholeFont(weight));
          } catch (err) {
            next(err);
          }
        });
      },

      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const pages = filesIn(out, /\.html$/);

        const chars = baseCharacters();
        for (const file of [...pages, ...filesIn(out, /\.js$/)]) addCharacters(chars, fs.readFileSync(file, 'utf8'));
        const text = [...chars].join('');

        const urls = new Map<string, string>();
        fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
        for (const weight of weights) {
          const data = await subsetFont(await wholeFont(weight), text, { targetFormat: 'woff2' });
          const url = hashedUrl(weight, data);
          fs.writeFileSync(path.join(out, url), data);
          urls.set(fontUrl(weight), url);
          logger.info(`${url}: ${chars.size} characters, ${Math.round(data.length / 1024)} KB`);
        }

        for (const file of pages) {
          const html = fs.readFileSync(file, 'utf8');
          const rewritten = rewriteUrls(html, urls);
          if (rewritten !== html) fs.writeFileSync(file, rewritten);
        }
      },
    },
  };
}
