import type { Page } from "@playwright/test";
import type { ApiFixture } from "../../../frontend/e2e/fixtures/api";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { maps } from "../../../frontend/e2e/fixtures/maps";
import { botsRace, openResults, recorded } from "../../../frontend/e2e/fixtures/results";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import path from "node:path";
import { type Size, frame, pictures, shot, shotsDir } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 11.3, Celebrate an unlock, in the running app: Results for the mocks' 2nd of 10
 * against bots on Old Town Criterium, whose answer opened Neon Docklands, at 390, 768, 1024 and 1440 px; the card's
 * entrance held at 300, 450 and 650 ms; and the same Results with no map opened. Each is opened as a reload finds it,
 * the backend's answer and the map catalogue served by the shared fixture's `api`, so no request leaves the machine. Not
 * a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/11-3-celebrate-an-unlock`.
 */

const LINES: [string, number][] = [
  ["Finished", 100],
  ["2nd of 10", 160],
  ["Podium", 75],
  ["84% on target", 67],
  ["4-day streak", 40],
];
const BEST = { bestSeconds: 1598, previousBestSeconds: 1630, isNewBest: true };

async function open(page: Page, api: ApiFixture, openedMapId: string | null) {
  const state = botsRace();
  api.answer("POST", "/api/rides", recorded(state.ride, LINES, { held: 2, earned: 1 }, BEST, openedMapId));
  api.answer("GET", "/api/maps", maps);
  await openResults(page, state);
  const results = new ResultsPage(page);
  await expect(results.xpTotal).toHaveText("+442");
  return results;
}

/** Plays the unlock card's entrance again and holds it at `ms` from its start. */
async function holdAt(page: Page, ms: number) {
  await page.evaluate((at) => {
    const parts = [...document.querySelectorAll<HTMLElement>(".unlock-card, .unlock-card__photo")];
    for (const part of parts) {
      part.style.animationName = "none";
      void part.offsetWidth;
      part.style.animationName = "";
    }
    for (const animation of parts.flatMap((part) => part.getAnimations())) {
      animation.pause();
      animation.currentTime = at;
    }
  }, ms);
}

test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Neon Docklands is open at ${size}`, async ({ page, api }) => {
    await frame(page, size);
    const results = await open(page, api, "neon-docklands");
    await expect(results.unlockTitle).toHaveText("Neon Docklands is open");
    await pictures(page);
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState === "finished"));
    await shot(page, `unlock-${size.toLowerCase()}`);
  });
}

test("the card's entrance held at 300, 450 and 650 ms, and no card at XL", async ({ page, api }) => {
  await frame(page, "XL");
  const results = await open(page, api, "neon-docklands");
  await pictures(page);
  // The recorder asks for reduced motion to keep its pictures still; the entrance is the full one.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const ms of [300, 450, 650]) {
    await holdAt(page, ms);
    // Held mid-entrance, so not through shot(), which takes every animation to its end.
    await page.screenshot({ path: path.join(shotsDir, `entrance-${ms}.png`), caret: "hide" });
  }

  await open(page, api, null);
  await expect(results.unlockCard).toHaveCount(0);
  await shot(page, "no-unlock-xl");
});
