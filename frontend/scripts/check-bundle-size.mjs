// Fails the build when the initial bundle exceeds the 300 KB gzipped budget (AGENTS.md), or when
// the whole site exceeds the 250 MB of app content its host takes (ADR 0022), which would
// otherwise fail only at deploy. Angular's own budgets measure raw bytes, so they stay as an
// early warning only.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMIT = 300 * 1024;
const SITE_LIMIT = 250 * 1024 * 1024;
const dir = process.argv[2] ?? 'dist/wattzup/browser';
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const files = [
  ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+rel="(?:stylesheet|modulepreload)"[^>]+href="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+href="([^"]+)"[^>]+rel="(?:stylesheet|modulepreload)"/g),
]
  .map((m) => m[1])
  .filter((f, i, all) => !f.startsWith('http') && all.indexOf(f) === i);
let total = 0;
for (const file of files) {
  const size = gzipSync(readFileSync(join(dir, file))).length;
  total += size;
  console.log(`${file.padEnd(32)} ${(size / 1024).toFixed(1)} KB gzipped`);
}
console.log(`Initial total ${(total / 1024).toFixed(1)} KB gzipped (budget 300 KB)`);
if (total > LIMIT) {
  console.error('Initial bundle exceeds the 300 KB gzipped budget.');
  process.exit(1);
}

const siteBytes = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).reduce((sum, name) => sum + siteBytes(join(path, name)), 0)
    : statSync(path).size;
const site = siteBytes(dir);
console.log(`Site total ${(site / 1024 / 1024).toFixed(1)} MB (host limit 250 MB)`);
if (site > SITE_LIMIT) {
  console.error('The site exceeds the 250 MB of app content its host takes.');
  process.exit(1);
}
