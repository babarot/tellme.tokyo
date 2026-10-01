// Checks every figures/*.part.html against the rules in CLAUDE.md ("Figures").
// Run with `pnpm check:figures`.
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['content/post'];

function findFigures(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /(^|\/)figures\/[^/]+\.part\.html$/.test(f))
    .map((f) => path.join(dir, f));
}

const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;

function check(file: string): string[] {
  const src = fs.readFileSync(file, 'utf8');
  const errors: string[] = [];
  const lineOf = (index: number) => src.slice(0, index).split('\n').length;

  for (const m of src.matchAll(/<(html|head|body|script)\b/gi)) {
    errors.push(`${lineOf(m.index!)}: <${m[1]}> is not allowed; a figure is an HTML fragment without JavaScript`);
  }
  for (const m of src.matchAll(/\sstyle\s*=/gi)) {
    errors.push(`${lineOf(m.index!)}: style="" is not allowed; use a class and put the rule in the figure's <style>`);
  }

  for (const block of src.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
    const start = block.index! + '<style>'.length;
    for (const decl of block[1].matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)) {
      const [, prop, value] = decl;
      const line = lineOf(start + decl.index!);
      if (prop === '--c') {
        // the hue variable read by .tag and .note; it may only point at a hue token
        if (!/^\s*var\(--fig-[\w-]+\)\s*$/.test(value)) {
          errors.push(`${line}: "--c: ${value.trim()}"; set it to a --fig-* hue token`);
        }
      } else if (prop.startsWith('--')) {
        errors.push(`${line}: defining custom properties (${prop}) is not allowed; tokens live in src/styles/figures/tokens.css`);
      } else if (COLOR_LITERAL.test(value)) {
        errors.push(`${line}: color literal in "${prop}: ${value.trim()}"; use a --fig-* color token`);
      } else if (prop === 'font-size' && !/^\s*(var\(--fig-text[\w-]*\)|inherit)\s*$/.test(value)) {
        errors.push(`${line}: "font-size: ${value.trim()}"; use a --fig-text* token`);
      } else if (prop === 'font-family' && !/^\s*(var\(--font-(sans|mono)\)|inherit)\s*$/.test(value)) {
        errors.push(`${line}: "font-family: ${value.trim()}"; use var(--font-sans) or var(--font-mono)`);
      }
    }
  }
  return errors;
}

let failed = 0;
const files = ROOTS.flatMap(findFigures);
for (const file of files) {
  const errors = check(file);
  if (errors.length) {
    failed++;
    for (const e of errors) console.error(`${file}:${e}`);
  }
}
console.log(`${files.length} figure(s) checked, ${failed} with errors`);
process.exit(failed ? 1 : 0);
