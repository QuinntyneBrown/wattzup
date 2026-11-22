// The course bench: a race on one course in the real app, timed frame by frame (README.md here).
import { type ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
  workoutFrame,
} from "../../frontend/e2e/fixtures/echelon";
import { maps } from "../../frontend/e2e/fixtures/maps";
import { veteranProgress } from "../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../frontend/e2e/fixtures/test";
import { RacePage } from "../../frontend/e2e/pages/race.page";

const map = process.env["WZ_BENCH_MAP"] ?? "neon-docklands";
const out =
  process.env["WZ_BENCH_OUT"] ??
  path.resolve(__dirname, "..", "..", ".cache", "course-bench-out");
const label = process.env["WZ_BENCH_LABEL"] ?? "run";
const tier = process.env["WZ_BENCH_TIER"] ?? "ultra";
const uncapped = process.env["WZ_BENCH_UNCAPPED"] === "1";
/** Seconds ridden before the frames are timed, and seconds timed. */
const SETTLE = Number(process.env["WZ_BENCH_SETTLE"] ?? 12);
const TIMED = 10;
/** Metres up the road the ride starts from: to film and time a climb or a bend, not the start line. */
const FROM = Number(process.env["WZ_BENCH_FROM"] ?? 0);

interface Frames {
  count: number;
  fps: number;
  meanMs: number;
  p95Ms: number;
  p99Ms: number;
  worstMs: number;
  over20Ms: number;
}

test(`bench ${map}`, async ({ page, bluetooth, api }) => {
  fs.mkdirSync(out, { recursive: true });
  await page.addInitScript(
    ([t, from]) => {
      (window as unknown as Record<string, unknown>)["__wzWorldRide"] = {
        tier: t,
        from,
      };
    },
    [tier, FROM] as const,
  );
  api.answer("GET", "/api/maps", () => ({ body: maps }));
  // A rider with every map open, so any course can be benched.
  api.answer("GET", "/api/progress", {
    ...veteranProgress,
    openMapIds: [...veteranProgress.openMapIds, "col-du-granit"],
  });
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(map, process.env["WZ_BENCH_QUERY"] ?? "mode=bots&pack=medium");
  await expect
    .poll(() => bluetooth.writes().map((write) => write.hex), {
      timeout: 30_000,
    })
    .toContain(targetResistanceWrite(8));
  await expect(race.backend).toBeVisible({ timeout: 90_000 });

  // The rider pedals at 90 rpm for the whole bench.
  let riding = true;
  const pedal = (async () => {
    while (riding) {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(14));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  })();
  await page.waitForTimeout(SETTLE * 1000);

  // A 10-second film of the window's page, taken off the screen while the frames are timed.
  let film: ChildProcess | null = null;
  if (!uncapped) {
    const at = await page.evaluate(() => {
      const edge = (window.outerWidth - window.innerWidth) / 2;
      return {
        x: window.screenX + edge,
        y: window.screenY + window.outerHeight - window.innerHeight - edge,
        w: window.innerWidth,
        h: window.innerHeight,
      };
    });
    const even = (n: number) => Math.floor(n / 2) * 2;
    film = spawn(
      "ffmpeg",
      [
        ...["-y", "-f", "gdigrab", "-framerate", "60", "-draw_mouse", "0"],
        ...["-offset_x", String(Math.max(Math.round(at.x), 0))],
        ...["-offset_y", String(Math.max(Math.round(at.y), 0))],
        ...[
          "-video_size",
          `${even(at.w)}x${even(at.h)}`,
          "-t",
          String(TIMED),
          "-i",
          "desktop",
        ],
        ...[
          "-vf",
          "scale=1280:-2",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "26",
        ],
        ...["-pix_fmt", "yuv420p", path.join(out, `${label}.mp4`)],
      ],
      { stdio: "ignore" },
    );
  }

  const frames = await page.evaluate(
    (ms) =>
      new Promise<Frames>((resolve) => {
        const gaps: number[] = [];
        let last = performance.now();
        const start = last;
        const tick = (now: number) => {
          gaps.push(now - last);
          last = now;
          if (now - start < ms) requestAnimationFrame(tick);
          else {
            const sorted = [...gaps].sort((a, b) => a - b);
            const at = (q: number) =>
              sorted[
                Math.min(Math.floor(sorted.length * q), sorted.length - 1)
              ]!;
            const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
            resolve({
              count: gaps.length,
              fps: 1000 / mean,
              meanMs: mean,
              p95Ms: at(0.95),
              p99Ms: at(0.99),
              worstMs: sorted[sorted.length - 1]!,
              over20Ms: gaps.filter((gap) => gap > 20).length,
            });
          }
        };
        requestAnimationFrame(tick);
      }),
    TIMED * 1000,
  );
  const drawn = await page.evaluate(
    () =>
      (window as unknown as Record<string, { course?: unknown }>)[
        "__wzWorldRide"
      ]?.course ?? null,
  );
  if (film) await new Promise((resolve) => film!.on("exit", resolve));
  if (!uncapped)
    await page.screenshot({ path: path.join(out, `${label}.png`) });
  riding = false;
  await pedal;

  const size = await page.evaluate(() => [
    window.innerWidth,
    window.innerHeight,
  ]);
  const result = { label, map, uncapped, window: size, drawn, frames };
  fs.writeFileSync(
    path.join(out, `${label}${uncapped ? "-uncapped" : ""}.json`),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
});
