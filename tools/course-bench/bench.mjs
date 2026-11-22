#!/usr/bin/env node
// Times a course's frames in the real app, on this machine's GPU, and films ten seconds of it.
//
//   node tools/course-bench/bench.mjs <label> [map id] [out dir]
//
// One run at the display's pace (the frame rate a rider sees, the film and a picture), then three with the frame
// rate limit off (how much room is left): one run to the next differs by a tenth or more on a laptop, so the
// median of the three is the number to compare, written to <label>-summary.json. Build the app first: `npx ng build ride` in frontend/.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const [label = 'run', map = 'neon-docklands', out] = process.argv.slice(2);
const modules = path.join(root, 'frontend', 'node_modules');
let status = 0;
const dir = path.resolve(out ?? path.join(root, '.cache', 'course-bench-out'));
const fps = [];
for (const uncapped of ['0', '1', '1', '1']) {
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
  if (uncapped === '1' && run.status === 0) {
    fps.push(JSON.parse(fs.readFileSync(path.join(dir, `${label}-uncapped.json`), 'utf8')).frames.fps);
  }
}
if (fps.length) {
  const sorted = [...fps].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const display = JSON.parse(fs.readFileSync(path.join(dir, `${label}.json`), 'utf8'));
  const summary = {
    label,
    map,
    displayFps: display.frames.fps,
    displayOver20Ms: display.frames.over20Ms,
    uncappedFps: fps,
    uncappedMedianFps: median,
    uncappedMedianMs: 1000 / median,
    drawn: display.drawn,
  };
  fs.writeFileSync(path.join(dir, `${label}-summary.json`), JSON.stringify(summary, null, 2));
  console.log(`SUMMARY ${JSON.stringify(summary)}`);
}
process.exit(status);
