// Serves a production build (dist/ride/browser, or the folder given) for the Playwright behaviour specs, falling back to
// index.html for the app's routes, with the security headers the API sends (ADR 0026, L2-131), read from the file it
// embeds, so every spec runs the app under its Content Security Policy. Usage: node scripts/serve-dist.mjs [port] [folder]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(
  new URL(`../${(process.argv[3] ?? 'dist/ride/browser').replace(/\/?$/, '/')}`, import.meta.url),
);
const port = Number(process.argv[2] ?? 4300);
const security = Object.fromEntries(
  Object.entries(
    JSON.parse(
      await readFile(
        new URL('../../backend/src/Telo.Ride.Api/Hosting/security-headers.json', import.meta.url),
        'utf8',
      ),
    ),
  ).map(([name, value]) => [
    name,
    typeof value === 'string'
      ? value
      : Object.entries(value)
          .map(([directive, sources]) => [directive, ...sources].join(' '))
          .join('; '),
  ]),
);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.webmanifest': 'application/manifest+json',
};

async function file(path) {
  try {
    return (await stat(path)).isFile() ? path : null;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const candidate = normalize(join(root, pathname));
  const path =
    (candidate.startsWith(root) || candidate + sep === root ? await file(candidate) : null) ??
    join(root, 'index.html');
  try {
    const body = await readFile(path);
    res.writeHead(200, {
      ...security,
      'content-type': types[extname(path)] ?? 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} on http://127.0.0.1:${port}`));
