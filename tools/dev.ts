// `pnpm dev`: astro dev, plus --no-draft to leave drafts out as production
// does (dev shows them by default). Any other argument goes to astro dev as is.
//
// astro dev relaunches itself in the background and drops arguments it does
// not know, so the flag is handed on as SHOW_DRAFTS (src/lib/posts.ts).
import { spawn } from 'node:child_process';

const args: string[] = [];
const env = { ...process.env };

for (const arg of process.argv.slice(2)) {
  if (arg === '--no-draft') env.SHOW_DRAFTS = '0';
  else args.push(arg);
}

const astro = spawn('astro', ['dev', ...args], { stdio: 'inherit', env });
astro.on('exit', (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 0)));
