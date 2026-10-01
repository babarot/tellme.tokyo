// The fonts OG designs draw with. A design lists its fonts (`fonts` in
// kit.ts's OgDesign); only those are loaded, so a build reads only what the
// design in use needs.
//
// - `file`: a font in src/assets/fonts/ (committed; keep these small, e.g. a
//   Google Fonts ?text= subset of the few letters a design draws)
// - `google`: a font fetched from Google Fonts the first time it is needed and
//   kept in .cache/fonts/ (not committed). For large fonts such as Noto Sans
//   JP, which would add megabytes to the repository. A clean build machine
//   (Cloudflare's) fetches it on every build.
import fs from 'node:fs';
import path from 'node:path';

export type FontSpec = { name: string; weight: 400 | 700 } & ({ file: string } | { google: string });

export type LoadedFont = { name: string; data: Buffer; weight: 400 | 700; style: 'normal' };

const CACHE_DIR = '.cache/fonts';

// "Noto Sans JP", 700 -> https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700
export const googleCssUrl = (family: string, weight: number) =>
  `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}`;

// Google Fonts answers a request without a browser's user agent with
// TrueType, the format satori reads (it cannot read WOFF2).
async function fetchGoogleFont(family: string, weight: number, get: typeof fetch): Promise<Buffer> {
  const css = await (await get(googleCssUrl(family, weight))).text();
  const url = css.match(/src: url\((https:[^)]+)\) format\('truetype'\)/)?.[1];
  if (!url) throw new Error(`No TrueType font in Google Fonts' answer for ${family} ${weight}`);
  const res = await get(url);
  if (!res.ok) throw new Error(`Could not fetch ${family} ${weight}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const loaded = new Map<string, Promise<Buffer>>();

export async function loadFont(spec: FontSpec, { get = fetch, cacheDir = CACHE_DIR } = {}): Promise<LoadedFont> {
  const font = (data: Buffer): LoadedFont => ({ name: spec.name, data, weight: spec.weight, style: 'normal' });
  if ('file' in spec) return font(fs.readFileSync(path.resolve('src/assets/fonts', spec.file)));

  const file = path.resolve(cacheDir, `${spec.google.replace(/ /g, '')}-${spec.weight}.ttf`);
  if (!loaded.has(file)) {
    loaded.set(
      file,
      (async () => {
        if (fs.existsSync(file)) return fs.readFileSync(file);
        const data = await fetchGoogleFont(spec.google, spec.weight, get);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, data);
        return data;
      })(),
    );
  }
  return font(await loaded.get(file)!);
}
