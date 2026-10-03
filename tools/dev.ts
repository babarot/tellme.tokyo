// `mise run dev`: astro dev, plus --no-draft to leave drafts out as production
// does (dev shows them by default). Any other argument goes to astro dev as is,
// so `mise run dev stop`, `status` and `logs` are astro's own.
//
// astro dev relaunches itself in the background and drops arguments it does
// not know, so the flag is handed on as SHOW_DRAFTS (src/lib/posts.ts).
import path from 'node:path';
import { spawn } from 'node:child_process';

const args: string[] = [];
const env = { ...process.env };

for (const arg of process.argv.slice(2)) {
  if (arg === '--no-draft') env.SHOW_DRAFTS = '0';
  else args.push(arg);
}

// mise runs this outside pnpm, so node_modules/.bin is not on PATH
const bin = path.resolve(import.meta.dirname, '../node_modules/.bin/astro');
const astro = spawn(bin, ['dev', ...args], { stdio: 'inherit', env });
astro.on('exit', (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 0)));
