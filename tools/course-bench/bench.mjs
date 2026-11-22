#!/usr/bin/env node
// Times a course's frames in the real app, on this machine's GPU, and films ten seconds of it.
//
//   node tools/course-bench/bench.mjs <label> [map id] [out dir]
//
// Two runs: one at the display's pace (the frame rate a rider sees, the film and a picture), one with the frame
// rate limit off (how much room is left). Build the app first: `npx ng build ride` in frontend/.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const [label = 'run', map = 'neon-docklands', out] = process.argv.slice(2);
const modules = path.join(root, 'frontend', 'node_modules');
let status = 0;
for (const uncapped of ['0', '1']) {
  const run = spawnSync(
    process.execPath,
    [
      path.join(modules, '@playwright', 'test', 'cli.js'),
      'test',
      '-c',
      path.join(here, 'playwright.config.ts'),
    ],
    {
      cwd: path.join(root, 'frontend'),
      env: {
        ...process.env,
        NODE_PATH: modules,
        WZ_BENCH_LABEL: label,
        WZ_BENCH_MAP: map,
        WZ_BENCH_UNCAPPED: uncapped,
        ...(out ? { WZ_BENCH_OUT: path.resolve(out) } : {}),
      },
      stdio: 'inherit',
    },
  );
  status ||= run.status ?? 1;
}
process.exit(status);
