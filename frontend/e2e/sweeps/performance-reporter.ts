// Writes the performance sweep's numbers (#676): every result the sweep attaches as
// `performance` goes into performance-reports/<timestamp>.json and a Markdown table beside it.
// The folder is git-ignored and, unlike test-results/, survives the next run, so two runs can be
// compared: `node scripts/compare-performance.mjs <before>.json <after>.json`.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

interface Result {
  scene: string;
  tier: string;
  drawnAt: string;
  backend: string;
  frames: number;
  medianMs: number | null;
  p95Ms: number | null;
  gpuMedianMs: number | null;
  drawCalls: number;
  programs: number;
  compiledDuringRide: number;
  stalls: number;
  materials: Record<string, number>;
}

const ms = (v: number | null) => (v === null ? 'n/a' : v.toFixed(1));

function commit(): string | null {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export default class PerformanceReporter implements Reporter {
  private readonly results: Result[] = [];

  onTestEnd(_: TestCase, result: TestResult): void {
    for (const a of result.attachments) {
      if (a.name === 'performance' && a.body) this.results.push(JSON.parse(a.body.toString()));
    }
  }

  onEnd(): void {
    if (this.results.length === 0) return;
    const createdAt = new Date().toISOString();
    const report = { createdAt, commit: commit(), results: this.results };
    const dir = join(__dirname, '..', '..', 'performance-reports');
    const name = createdAt.replace(/[:.]/g, '-');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${name}.json`), JSON.stringify(report, null, 2) + '\n');
    const rows = this.results.map(
      (r) =>
        `| ${r.scene} | ${r.tier} | ${r.drawnAt} | ${r.backend} | ${r.frames} | ${ms(r.medianMs)} | ${ms(r.p95Ms)} | ${ms(r.gpuMedianMs)} | ${r.drawCalls} | ${r.programs} | ${r.compiledDuringRide} | ${r.stalls} |`,
    );
    writeFileSync(
      join(dir, `${name}.md`),
      [
        `# Performance sweep, ${createdAt}`,
        '',
        `Commit ${report.commit ?? 'unknown'}.`,
        '',
        '| Scene | Tier | Drawn at | Backend | Frames | Median (ms) | p95 (ms) | GPU median (ms) | Draw calls | Programs | Compiled during ride | Stalls in first 5 s |',
        '|---|---|---|---|---|---|---|---|---|---|---|---|',
        ...rows,
        '',
        '## Material variants',
        '',
        'Distinct materials by type and features, most shared first: where programs come from.',
        '',
        ...this.results.flatMap((r) => [
          `- **${r.scene} at ${r.tier} (${r.backend})**: ` +
            Object.entries(r.materials)
              .slice(0, 5)
              .map(([v, n]) => `${v} × ${n}`)
              .join(', '),
        ]),
        '',
      ].join('\n'),
    );
    console.log(`Performance report: ${join(dir, `${name}.md`)}`);
  }
}
