import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Locator, Page } from "@playwright/test";

/**
 * Helpers for a video's `shots.ts`. A shot is a PNG of the running app at double density, saved
 * in the video folder's `shots/`; `film.js` then draws a phone, a tablet or a browser window
 * around it. See docs/videos/README.md, "Screenshots".
 */

/** Where the pictures go: `<video folder>/shots`. */
export const shotsDir = path.resolve(
  process.env["WZ_VIDEO_DIR"] ?? ".",
  "shots",
);

/** The four form factors a film shows. */
export const SIZES = {
  XS: { width: 390, height: 780 },
  M: { width: 768, height: 1024 },
  L: { width: 1024, height: 768 },
  XL: { width: 1440, height: 900 },
} as const;
export type Size = keyof typeof SIZES;
export type Theme = "light" | "dark";

/**
 * Sets the window and the device's colour scheme before a state is opened, with reduced motion.
 * Telo Ride is dark first (every page ships `data-theme="dark"`); the slice that adds the light
 * theme stores the rider's choice here before the app loads.
 */
export async function frame(
  page: Page,
  size: Size,
  theme: Theme = "dark",
): Promise<void> {
  await page.setViewportSize(SIZES[size]);
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
}

/** Waits until the bundled faces are drawn and stops whatever still moves. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
}

function file(name: string): string {
  mkdirSync(shotsDir, { recursive: true });
  return path.join(shotsDir, `${name}.png`);
}

/** Saves what the window shows as `shots/<name>.png`. */
export async function shot(page: Page, name: string): Promise<void> {
  await settle(page);
  await page.screenshot({
    path: file(name),
    animations: "disabled",
    caret: "hide",
  });
}

/** Saves one region with `pad` CSS pixels of air around it: the close-up of a scene. */
export async function detail(
  region: Locator,
  name: string,
  pad = 16,
): Promise<void> {
  const page = region.page();
  await region.scrollIntoViewIfNeeded();
  await settle(page);
  const box = await region.boundingBox();
  if (!box) throw new Error(`The region of "${name}" is not on the page.`);
  const view = page.viewportSize()!;
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  await page.screenshot({
    path: file(name),
    animations: "disabled",
    caret: "hide",
    clip: {
      x,
      y,
      width: Math.min(view.width - x, box.x + box.width + pad - x),
      height: Math.min(view.height - y, box.y + box.height + pad - y),
    },
  });
}

/** Brings a region to the top of the window, `offset` pixels down, before a shot. */
export async function bringToTop(region: Locator, offset = 96): Promise<void> {
  await region.evaluate((el, by) => {
    const top = el.getBoundingClientRect().top + window.scrollY - by;
    window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
  }, offset);
}

/**
 * A power history that follows a plan's segments, for `GET /api/workout/trace`: the trace a rider
 * would have drawn by `upTo` seconds. Seeded, so the same film always shows the same line.
 */
export function traceSamples(
  segments: readonly { kind: string; start: number; duration: number }[],
  upTo: number,
  {
    work = 320,
    rest = 150,
    warmup = 160,
    cooldown = 140,
    flat = 210,
    seed = 11,
  } = {},
): [number, number][] {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const aim: Record<string, number> = { work, rest, warmup, cooldown, flat };
  const out: [number, number][] = [];
  let power = warmup;
  for (let t = 1; t <= upTo; t++) {
    const seg =
      segments.find((x) => t >= x.start && t < x.start + x.duration) ??
      segments.at(-1)!;
    const goal = aim[seg.kind] ?? flat;
    power += (goal - power) * 0.35 + (rnd() - 0.5) * 18;
    out.push([t, Math.round(power)]);
  }
  return out;
}

/** Waits until every picture on the page has arrived. */
export async function pictures(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      [...document.images].map(
        (image) => image.complete || image.decode().catch(() => undefined),
      ),
    ),
  );
}

/** Saves the smallest region holding every one of `regions`, with `pad` CSS pixels of air. */
export async function detailAll(
  regions: Locator[],
  name: string,
  pad = 16,
): Promise<void> {
  const page = regions[0].page();
  await regions[0].scrollIntoViewIfNeeded();
  await settle(page);
  const boxes = await Promise.all(regions.map((r) => r.boundingBox()));
  if (boxes.some((b) => !b))
    throw new Error(`A region of "${name}" is not on the page.`);
  const b = boxes as { x: number; y: number; width: number; height: number }[];
  const view = page.viewportSize()!;
  const x = Math.max(0, Math.min(...b.map((r) => r.x)) - pad);
  const y = Math.max(0, Math.min(...b.map((r) => r.y)) - pad);
  const right = Math.min(
    view.width,
    Math.max(...b.map((r) => r.x + r.width)) + pad,
  );
  const bottom = Math.min(
    view.height,
    Math.max(...b.map((r) => r.y + r.height)) + pad,
  );
  await page.screenshot({
    path: file(name),
    animations: "disabled",
    caret: "hide",
    clip: { x, y, width: right - x, height: bottom - y },
  });
}
