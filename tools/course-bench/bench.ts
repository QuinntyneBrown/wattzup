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
import { ibizaCourseMap, sellaRondaCourseMap } from "../../frontend/e2e/fixtures/course";
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
// WZ_BENCH_SECONDS=<n> times and films for n seconds where the bench's ten are too few (a film to watch).
const TIMED = Number(process.env["WZ_BENCH_SECONDS"] ?? 10);
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
  /** When each frame over 20 ms came, in ms from the start of the timing. */
  slowAt: number[];
  /** Frames over 12 ms: at 120 Hz, each is a frame the display showed twice. */
  over12Ms: number;
  /** The JavaScript heap, in MB, at the start and the end of the timing, and how much was made in between. */
  heapStartMb: number;
  heapEndMb: number;
  allocatedMb: number;
  /** How many times the heap was collected (it fell by over 1 MB), and how many slow frames came with one. */
  collections: number;
  slowWithCollection: number;
  /** What the browser says each long frame was spent on: its length, and each script's caller, function and time. */
  longFrames: string[];
  /**
   * For each frame over 20 ms: how late its callback ran after the display's own tick, and how long the frame before
   * it spent in script, in ms. Both small means the page was on time and the display skipped a frame.
   */
  slowLateMs: number[];
  slowScriptMs: number[];
}

test(`bench ${map}`, async ({ page, bluetooth, api }) => {
  fs.mkdirSync(out, { recursive: true });
  await page.addInitScript(
    ([t, from, backend]) => {
      (window as unknown as Record<string, unknown>)["__wzWorldRide"] = {
        tier: t,
        from,
        // WZ_BENCH_BACKEND=webgl2 draws with WebGL 2 where WebGPU would be used.
        ...(backend ? { backend } : {}),
      };
    },
    [tier, FROM, process.env["WZ_BENCH_BACKEND"] ?? ""] as const,
  );
  // The maps the app is told of: the fixtures' list, Ibiza Sunset Strip, and Sella Ronda.
  api.answer("GET", "/api/maps", () => ({ body: [...maps, ibizaCourseMap, sellaRondaCourseMap] }));
  // A rider with every map open, so any course can be benched.
  api.answer("GET", "/api/progress", {
    ...veteranProgress,
    openMapIds: [...veteranProgress.openMapIds, "col-du-granit", ibizaCourseMap.id, sellaRondaCourseMap.id],
  });
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(
    map,
    process.env["WZ_BENCH_QUERY"] ?? "mode=bots&pack=medium",
  );
  await expect
    .poll(
      // The race has started once it sets the bike's resistance, whatever the map's first level is.
      () => bluetooth.writes().some((write) => write.hex.startsWith("F0 B1 01")),
      { timeout: 30_000 },
    )
    .toBe(true);
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
  // WZ_BENCH_PLAY=<minutes>: no timing and no film, just the ride left open in the window to be watched.
  const play = Number(process.env["WZ_BENCH_PLAY"] ?? 0);
  if (play > 0) {
    test.setTimeout((play + 2) * 60_000);
    await page.waitForTimeout(play * 60_000);
    riding = false;
    await pedal;
    return;
  }
  await page.waitForTimeout(SETTLE * 1000);

  // A 10-second film of the window's page, taken off the screen while the frames are timed.
  let film: ChildProcess | null = null;
  // WZ_BENCH_FILM=0 times the frames with no film being taken: the film's own work shows in them.
  if (!uncapped && process.env["WZ_BENCH_FILM"] !== "0") {
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

  // WZ_BENCH_HIDE_HUD=1 hides everything on the page but the canvas, to see what the panels over it cost.
  if (process.env["WZ_BENCH_HIDE_HUD"] === "1") {
    await page.addStyleTag({
      content: "body *:not(canvas):not(:has(canvas)) { display: none !important; }",
    });
  }
  // WZ_BENCH_CSS=<rules> adds style rules to the page, to try a change to the panels without building it.
  const css = process.env["WZ_BENCH_CSS"];
  if (css) await page.addStyleTag({ content: css });
  // WZ_BENCH_CPU=<n> slows the page's processor n times, as a stand-in for a slower device's. It does not slow the
  // graphics chip: a real device is the only true test.
  const slowed = Number(process.env["WZ_BENCH_CPU"] ?? 1);
  if (slowed > 1) {
    const throttle = await page.context().newCDPSession(page);
    await throttle.send("Emulation.setCPUThrottlingRate", { rate: slowed });
  }
  // WZ_BENCH_ALLOC=1 also samples what the page allocates while it is timed, and writes who made the most.
  const sampling = process.env["WZ_BENCH_ALLOC"] === "1";
  const cdp = sampling ? await page.context().newCDPSession(page) : null;
  await cdp?.send("HeapProfiler.startSampling", {
    samplingInterval: 8192,
    includeObjectsCollectedByMajorGC: true,
    includeObjectsCollectedByMinorGC: true,
  });
  // WZ_BENCH_PROFILE=1 also samples where the page's processor time goes while it is timed.
  const profiling = process.env["WZ_BENCH_PROFILE"] === "1";
  const profiler = profiling ? await page.context().newCDPSession(page) : null;
  await profiler?.send("Profiler.enable");
  await profiler?.send("Profiler.setSamplingInterval", { interval: 200 });
  await profiler?.send("Profiler.start");
  // The browser's own account of the page's main thread while it is timed: seconds in tasks, in script, in style
  // and in layout. Steadier than frames a second, which the machine's other work moves.
  const meter = await page.context().newCDPSession(page);
  await meter.send("Performance.enable");
  const measure = async (): Promise<Record<string, number>> =>
    Object.fromEntries(
      (await meter.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]),
    );
  const metricsBefore = await measure();
  // How often the page asks where an element is while it is timed: each such read can force the page's layout.
  await page.evaluate(() => {
    const counted = window as unknown as { __wzLayoutReads: number };
    counted.__wzLayoutReads = 0;
    const own = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetTop");
    if (own?.get) {
      const read = own.get;
      Object.defineProperty(HTMLElement.prototype, "offsetTop", {
        configurable: true,
        get(this: HTMLElement) {
          counted.__wzLayoutReads++;
          return read.call(this) as number;
        },
      });
    }
  });
  const frames = await page.evaluate(
    (ms) =>
      new Promise<Frames>((resolve) => {
        const gaps: number[] = [];
        const slow: number[] = [];
        const heap = (): number =>
          (performance as unknown as { memory?: { usedJSHeapSize: number } })
            .memory?.usedJSHeapSize ?? 0;
        const heapStart = heap();
        let heapLast = heapStart;
        let allocated = 0;
        let collections = 0;
        let slowWithCollection = 0;
        const slowLate: number[] = [];
        const slowScript: number[] = [];
        // How long the last frame's callbacks took: from this callback to a task queued behind them.
        let script = 0;
        const channel = new MessageChannel();
        let began = 0;
        channel.port1.onmessage = () => (script = performance.now() - began);
        // The browser's own account of a long frame: which script ran, what called it, and for how long.
        const longFrames: string[] = [];
        interface LongFrame extends PerformanceEntry {
          renderStart: number;
          styleAndLayoutStart: number;
          scripts: {
            invoker: string;
            invokerType: string;
            sourceFunctionName: string;
            sourceURL: string;
            duration: number;
          }[];
        }
        let watcher: PerformanceObserver | null = null;
        try {
          watcher = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as LongFrame[]) {
              const scripts = entry.scripts
                .map(
                  (script) =>
                    `${script.invokerType} ${script.invoker} ${script.sourceFunctionName} ${script.sourceURL.split("/").pop()} ${script.duration.toFixed(1)}ms`,
                )
                .join(" | ");
              longFrames.push(
                `at ${Math.round(entry.startTime - start)} ms: ${entry.duration.toFixed(1)} ms, render after ${(entry.renderStart - entry.startTime).toFixed(1)}, layout after ${(entry.styleAndLayoutStart - entry.startTime).toFixed(1)}: ${scripts}`,
              );
            }
          });
          watcher.observe({ type: "long-animation-frame", buffered: false });
        } catch {
          // A browser without long animation frames: the bench does without.
        }
        let last = performance.now();
        const start = last;
        const tick = (now: number) => {
          began = performance.now();
          channel.port2.postMessage(0);
          const used = heap();
          const collected = heapLast - used > 1048576;
          if (collected) collections++;
          else if (used > heapLast) allocated += used - heapLast;
          heapLast = used;
          if (now - last > 20) {
            slow.push(Math.round(now - start));
            slowLate.push(Math.round((performance.now() - now) * 10) / 10);
            slowScript.push(Math.round(script * 10) / 10);
            if (collected) slowWithCollection++;
          }
          gaps.push(now - last);
          last = now;
          if (now - start < ms) requestAnimationFrame(tick);
          else {
            watcher?.disconnect();
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
              slowAt: slow,
              over12Ms: gaps.filter((gap) => gap > 12).length,
              heapStartMb: heapStart / 1048576,
              heapEndMb: heapLast / 1048576,
              allocatedMb: allocated / 1048576,
              collections,
              slowWithCollection,
              longFrames,
              slowLateMs: slowLate,
              slowScriptMs: slowScript,
            });
          }
        };
        requestAnimationFrame(tick);
      }),
    TIMED * 1000,
  );
  if (cdp) {
    const { profile } = await cdp.send("HeapProfiler.stopSampling");
    interface Sampled {
      callFrame: { functionName: string; url: string; lineNumber: number };
      selfSize: number;
      children?: Sampled[];
    }
    const by = new Map<string, number>();
    const walk = (node: Sampled, caller: string): void => {
      const file = node.callFrame.url.split("/").pop() ?? "";
      const name = `${node.callFrame.functionName || "(anonymous)"} ${file}:${node.callFrame.lineNumber}`;
      if (node.selfSize) {
        const key = `${name}  <-  ${caller}`;
        by.set(key, (by.get(key) ?? 0) + node.selfSize);
      }
      for (const child of node.children ?? []) walk(child, name);
    };
    walk(profile.head as Sampled, "");
    const top = [...by.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([who, bytes]) => `${(bytes / 1048576).toFixed(2)} MB  ${who}`);
    fs.writeFileSync(path.join(out, `${label}-alloc.txt`), top.join(String.fromCharCode(10)) + String.fromCharCode(10));
  }
  if (profiler) {
    const { profile } = await profiler.send("Profiler.stop");
    const self = new Map<number, number>();
    const deltas = profile.timeDeltas ?? [];
    (profile.samples ?? []).forEach((id, i) =>
      self.set(id, (self.get(id) ?? 0) + (deltas[i] ?? 0)),
    );
    const by = new Map<string, number>();
    let total = 0;
    for (const node of profile.nodes) {
      const time = self.get(node.id) ?? 0;
      total += time;
      const file = node.callFrame.url.split("/").pop() ?? "";
      const name = `${node.callFrame.functionName || "(anonymous)"} ${file}:${node.callFrame.lineNumber}`;
      by.set(name, (by.get(name) ?? 0) + time);
    }
    const top = [...by.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([who, time]) => `${((time / total) * 100).toFixed(1)} %  ${(time / 1000).toFixed(0)} ms  ${who}`);
    fs.writeFileSync(
      path.join(out, `${label}-cpu.txt`),
      top.join(String.fromCharCode(10)) + String.fromCharCode(10),
    );
  }
  const metricsAfter = await measure();
  const spent = (name: string): number =>
    ((metricsAfter[name] ?? 0) - (metricsBefore[name] ?? 0)) * 1000;
  const mainThread = {
    taskMs: spent("TaskDuration"),
    scriptMs: spent("ScriptDuration"),
    styleMs: spent("RecalcStyleDuration"),
    layoutMs: spent("LayoutDuration"),
    styleCount: (metricsAfter["RecalcStyleCount"] ?? 0) - (metricsBefore["RecalcStyleCount"] ?? 0),
    layoutCount: (metricsAfter["LayoutCount"] ?? 0) - (metricsBefore["LayoutCount"] ?? 0),
  };
  // What on the page is animating as the timing ends: an animation that runs all ride long is work on every frame.
  const animating = await page.evaluate(() =>
    document.getAnimations().map((animation) => {
      const effect = animation.effect as KeyframeEffect | null;
      const target = effect?.target as Element | null;
      const what = effect?.getKeyframes().flatMap((frame) =>
        Object.keys(frame).filter(
          (key) => !["offset", "easing", "composite", "computedOffset"].includes(key),
        ),
      );
      return `${target?.tagName.toLowerCase() ?? "?"}.${target?.getAttribute("class") ?? ""} ${[...new Set(what)].join(",")} ${animation.playState} ${String(effect?.getTiming().duration)}ms x${String(effect?.getTiming().iterations)}`;
    }),
  );
  const layoutReads = await page.evaluate(
    () => (window as unknown as { __wzLayoutReads: number }).__wzLayoutReads,
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
    JSON.stringify({ ...result, layoutReads, animating, mainThread }, null, 2),
  );
  console.log(JSON.stringify(result));
});
