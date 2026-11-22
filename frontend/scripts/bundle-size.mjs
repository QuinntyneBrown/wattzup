// Checks L2-136 AC1 on a production build: the initial bundle, the scripts and stylesheets the built index.html loads
// before the first screen renders, is at most 300 KB gzipped. Angular's budgets in angular.json measure raw bytes;
// this measures what a rider's browser downloads. Prints each file and the total; exits 1 over the limit.
// Usage: node scripts/bundle-size.mjs [folder] [limit in kB]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { constants, gzipSync } from 'node:zlib';

const folder = fileURLToPath(
  new URL(`../${(process.argv[2] ?? 'dist/ride/browser').replace(/\/?$/, '/')}`, import.meta.url),
);
const limit = Number(process.argv[3] ?? 300);
const index = readFileSync(join(folder, 'index.html'), 'utf8');

/** The files index.html loads at once: its scripts, stylesheets and module preloads, in order. */
const initial = [
  ...index.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g),
  ...index.matchAll(/<link\b[^>]*\brel="(?:stylesheet|modulepreload)"[^>]*\bhref="([^"]+)"/g),
].map((match) => match[1]);

const kB = (bytes) => (bytes / 1000).toFixed(2).padStart(8) + ' kB';
let total = 0;
for (const file of initial) {
  const gzipped = gzipSync(readFileSync(join(folder, file)), {
    level: constants.Z_BEST_COMPRESSION,
  }).length;
  total += gzipped;
  console.log(`${kB(gzipped)}  ${file}`);
}
console.log(`${kB(total)}  initial bundle, gzipped (limit ${limit} kB)`);
if (total > limit * 1000) {
  console.error(
    `The initial bundle is ${kB(total).trim()} gzipped, over its ${limit} kB (L2-136 AC1).`,
  );
  process.exit(1);
}
