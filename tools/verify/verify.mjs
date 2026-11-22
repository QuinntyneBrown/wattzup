#!/usr/bin/env node
// Builds and checks everything CI checks, as fast as this machine allows: install, then format, lint, unit tests
// and the production build with its budget side by side, then its gzipped initial bundle and the Playwright
// behaviour specs; beside them, the backend's format check, then its build and tests. Prints each step's time and
// the total; exits non-zero on the first failure, with that step's output.
//
//   node tools/verify/verify.mjs
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const frontend = join(root, 'frontend');
const started = performance.now();
const seconds = (from) => ((performance.now() - from) / 1000).toFixed(1).padStart(6) + 's';

function step(name, command, cwd = root) {
  const from = performance.now();
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd, shell: true, env: { ...process.env, FORCE_COLOR: '0' } });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`${seconds(from)}  ${name}`);
        resolve();
      } else {
        console.error(`\n✘ ${name} failed (exit ${code}):\n${output}`);
        reject(new Error(name));
      }
    });
  });
}

/** npm ci only when package-lock.json changed since the last install this script made. */
async function install() {
  const lock = readFileSync(join(frontend, 'package-lock.json'));
  const hash = createHash('sha256').update(lock).digest('hex');
  const stamp = join(frontend, 'node_modules', '.verify-lock-hash');
  if (existsSync(stamp) && readFileSync(stamp, 'utf8') === hash) {
    console.log('   0.0s  npm ci (package-lock.json unchanged, skipped)');
    return;
  }
  await step('npm ci', 'npm ci --no-audit --no-fund', frontend);
  writeFileSync(stamp, hash);
}

/** The unit-test builder refuses to run with no spec files, so until the first one lands the step says so. */
function unitTests() {
  const specs = readdirSync(join(frontend, 'projects'), { recursive: true }).filter(
    (path) => String(path).endsWith('.spec.ts') && !String(path).includes('node_modules'),
  );
  if (specs.length > 0) return step('unit tests', 'npm test', frontend);
  console.log('   0.0s  unit tests (no *.spec.ts under frontend/projects yet, none to run)');
  return Promise.resolve();
}

const backend = join(root, 'backend');

/** dotnet format as the backend's lint, then its build and every test (acceptance tests through the API). */
const api = async () => {
  if (!existsSync(join(backend, 'Telo.Ride.slnx'))) return;
  await step('backend format', 'dotnet format Telo.Ride.slnx --verify-no-changes', backend);
  await step('backend build and tests', 'dotnet test --solution Telo.Ride.slnx', backend);
};

const web = async () => {
  await install();
  await Promise.all([
    step('format', 'npm run format:check', frontend),
    step('lint', 'npm run lint', frontend),
    unitTests(),
    (async () => {
      await step('production build and budget', 'npm run build', frontend);
      await step('initial bundle gzipped', 'npm run bundle:size', frontend);
      await step('behaviour specs', 'npm run e2e', frontend);
    })(),
    step('marketing build and budget', 'npm run build:marketing', frontend),
  ]);
};

try {
  await Promise.all([web(), api()]);
  console.log(`${seconds(started)}  TOTAL — everything passed`);
} catch {
  console.error(`${seconds(started)}  TOTAL — failed`);
  process.exit(1);
}
