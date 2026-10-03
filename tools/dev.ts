// `mise run dev`: astro dev, building the posts in the states asked for, as
// `mise run post` picks them: --published, --draft, --hidden (any of them) or
// --all; published and draft when none is given. Any other argument goes to
// astro dev as is, so `mise run dev stop`, `status` and `logs` are astro's own.
//
// astro dev relaunches itself in the background and drops arguments it does
// not know, so the states are handed on as POST_STATES (src/lib/posts.ts).
import path from 'node:path';
import { spawn } from 'node:child_process';

const STATES = ['published', 'draft', 'hidden'];

const args: string[] = [];
const states = new Set<string>();

for (const arg of process.argv.slice(2)) {
  const state = arg.replace(/^--/, '');
  if (arg === '--all') STATES.forEach((s) => states.add(s));
  else if (arg.startsWith('--') && STATES.includes(state)) states.add(state);
  else args.push(arg);
}

const env = { ...process.env };
if (states.size) env.POST_STATES = STATES.filter((s) => states.has(s)).join(',');

// mise runs this outside pnpm, so node_modules/.bin is not on PATH
const bin = path.resolve(import.meta.dirname, '../node_modules/.bin/astro');
const astro = spawn(bin, ['dev', ...args], { stdio: 'inherit', env });
astro.on('exit', (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 0)));
