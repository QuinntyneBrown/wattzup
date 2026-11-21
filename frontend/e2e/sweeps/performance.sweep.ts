// Performance sweep (#664). Runs only when a person asks:
//
//   npm run e2e:sweeps -- performance --workers=1
//   WZ_SCENES=docklands,galibier WZ_TIERS=low,high npm run e2e:sweeps -- performance --workers=1
//
// One worker: scenes drawn side by side slow each other down. On a real GPU, run headed
// (`--headed`) so Chromium draws with it; headless Chromium may draw in software.
//
// For each scene and tier it rides that scene's first class against the simulated bike, with
// the tier pinned by the test-only hook (#672), skips the first 3 s, records 20 s of frames and
// attaches the numbers to the run; the reporter writes them to performance-reports/ (#676).
// They compare runs on one machine: no frame time is a pass or a fail. A page error or a request off localhost still fails the run, as the fixture says.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '../fixtures/wz-test';
import type { Tier } from '../fixtures/world-ride-probe';
import { WorldRidePage } from '../pages/world-ride.page';

/** A scene can take a while to build and start on a slow GPU. */
const STARTED = { timeout: 60_000 };
const WARM_UP_MS = 3_000;
const RECORD_MS = 20_000;
const TIERS: readonly Tier[] = ['low', 'medium', 'high', 'ultra'];
/** A frame this long in the first 5 s is a first-use stall, most often a program compile. */
const STALL_MS = 50;
const FIRST_MS = 5_000;

// A slow GPU builds a scene slowly and the sweep rides for real time: allow it.
test.describe.configure({ timeout: 180_000 });

interface ClassEntry {
  id: string;
  world: string;
  title: string;
}

/** The first class of each world, in catalogue order: the same route and segments every run. */
function sceneClasses(): ClassEntry[] {
  const file = join(__dirname, '..', '..', 'public', 'classes.json');
  const { classes } = JSON.parse(readFileSync(file, 'utf8')) as { classes: ClassEntry[] };
  const first = new Map<string, ClassEntry>();
  for (const c of classes) if (!first.has(c.world)) first.set(c.world, c);
  return [...first.values()];
}

const list = (value: string | undefined) =>
  value
    ?.split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const wanted = list(process.env['WZ_SCENES']);
const scenes = sceneClasses().filter((c) => !wanted || wanted.includes(c.world));
const tiers = (list(process.env['WZ_TIERS']) as Tier[] | undefined) ?? TIERS;
/** `auto` draws with WebGPU where offered; `webgl2` forces the fallback (#679). */
const backends = (list(process.env['WZ_BACKENDS']) as ('auto' | 'webgl2')[] | undefined) ?? [
  'auto',
];

/** Frames over 50 ms within the first 5 s of frames. */
function stalls(frames: readonly number[]): number {
  let elapsed = 0;
  let count = 0;
  for (const ms of frames) {
    if (elapsed >= FIRST_MS) break;
    elapsed += ms;
    if (ms > STALL_MS) count++;
  }
  return count;
}

/** The value at `p` (0 to 1) of the sorted frame times. */
const percentile = (sorted: readonly number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? null;

test.describe('the test-only tier hook (#672)', () => {
  test('draws at low from the first frame when asked for low', async ({ page, worldRide }) => {
    await worldRide.pin('low');
    await new WorldRidePage(page).startFromClass();
    await expect.poll(() => worldRide.report(), STARTED).toMatchObject({ tier: 'low' });
  });

  test('pins ultra, drawn at high on a WebGL2 screen', async ({ page, worldRide }) => {
    await worldRide.pin('ultra');
    await new WorldRidePage(page).startFromClass();
    await expect.poll(() => worldRide.report(), STARTED).not.toBeNull();
    const report = await worldRide.report();
    expect(report?.tier).toBe(report?.backend === 'webgpu' ? 'ultra' : 'high');
  });
});

test.describe('compiles ahead (L2-111 AC10)', () => {
  test('compiles every program before the first frame, at a pinned tier', async ({
    page,
    worldRide,
  }) => {
    await worldRide.pin('high');
    await new WorldRidePage(page).startFromClass();
    await expect
      .poll(async () => (await worldRide.report())?.programsBeforeRide ?? null, STARTED)
      .not.toBeNull();
    await page.waitForTimeout(RECORD_MS);
    const report = await worldRide.report();
    expect(report?.programs).toBe(report?.programsBeforeRide);
  });
});

test.describe('compiles the next-lower tier ahead (#882)', () => {
  for (const scene of scenes) {
    for (const backend of backends) {
      for (const tier of tiers.filter((t) => t !== 'low')) {
        const on = backend === 'auto' ? '' : ` on ${backend}`;
        test(`${scene.world}: compiles nothing after a drop from ${tier}${on}`, async ({
          page,
          worldRide,
        }) => {
          await worldRide.pin(tier, backend);
          await new WorldRidePage(page).startClass(scene.id, scene.title);
          await expect
            .poll(async () => (await worldRide.report())?.programsBeforeRide ?? null, STARTED)
            .not.toBeNull();
          await page.waitForTimeout(WARM_UP_MS);
          const start = (await worldRide.report())!;
          await worldRide.dropTier();
          await expect.poll(async () => (await worldRide.report())?.tier).not.toBe(start.tier);
          await page.waitForTimeout(WARM_UP_MS);
          const after = (await worldRide.report())!;
          console.log(
            JSON.stringify({
              scene: scene.world,
              backend: after.backend,
              from: start.tier,
              to: after.tier,
              compiledAfterDrop: after.compiled - start.compiled,
            }),
          );
          expect(after.compiled).toBe(start.compiled);
        });
      }
    }
  }
});

test.describe('frame times per scene and tier (#674)', () => {
  for (const scene of scenes) {
    for (const backend of backends) {
      for (const tier of tiers) {
        const name =
          backend === 'auto'
            ? `${scene.world} at ${tier}`
            : `${scene.world} at ${tier} on ${backend}`;
        test(name, async ({ page, worldRide }, testInfo) => {
          await worldRide.pin(tier, backend);
          await new WorldRidePage(page).startClass(scene.id, scene.title);
          await expect.poll(() => worldRide.report(), STARTED).not.toBeNull();
          await page.waitForTimeout(WARM_UP_MS);
          const warm = await worldRide.report();
          const skipped = warm?.frames.length ?? 0;
          const skippedGpu = warm?.gpuMs?.length ?? 0;
          await page.waitForTimeout(RECORD_MS);
          const report = await worldRide.report();
          if (!report) throw new Error('the scene stopped reporting');

          const frames = report.frames.slice(skipped).sort((a, b) => a - b);
          const result = {
            scene: scene.world,
            class: scene.id,
            tier,
            drawnAt: report.tier,
            backend: report.backend,
            frames: frames.length,
            medianMs: percentile(frames, 0.5),
            p95Ms: percentile(frames, 0.95),
            // GPU time per frame from timer queries; null where the browser offers none (#675).
            gpuMedianMs: report.gpuMs
              ? percentile(
                  report.gpuMs.slice(skippedGpu).sort((a, b) => a - b),
                  0.5,
                )
              : null,
            drawCalls: report.drawCalls,
            programs: report.programs,
            // Programs compiled once the ride began: none at a pinned tier (L2-111 AC10).
            compiledDuringRide: report.programs - (report.programsBeforeRide ?? 0),
            stalls: stalls(report.frames),
            materials: report.materials,
          };
          await testInfo.attach('performance', {
            body: JSON.stringify(result, null, 2),
            contentType: 'application/json',
          });
          console.log(JSON.stringify(result));

          // Numbers were recorded; how fast they are is not judged.
          expect(frames.length).toBeGreaterThan(0);
          expect(report.drawCalls).toBeGreaterThan(0);
          expect(report.programs).toBeGreaterThan(0);
          expect(report.gpuMs === null || report.gpuMs.length > 0).toBe(true);
        });
      }
    }
  }
});
