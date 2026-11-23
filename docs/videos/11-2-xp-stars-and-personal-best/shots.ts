import type { Page } from "@playwright/test";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { openResults, recorded, soloClass, soloRace } from "../../../frontend/e2e/fixtures/results";
import type { ApiFixture } from "../../../frontend/e2e/fixtures/api";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 11.2, XP, stars and personal best, in the running app: a bots race 2nd of 10 with
 * the mocks' XP lines and a new star at 390, 768, 1024 and 1440 px; the XP panel recording, offline and not recorded; a
 * solo race's new personal best and a slower one; and a class with no stars panel. Each Results is opened as a reload
 * finds it, the backend's answer served by the shared fixture's `api`, so no request leaves the machine. Not a test and
 * not a sweep: only `node tools/video-record/record.mjs docs/videos/11-2-xp-stars-and-personal-best`.
 */

const pacers = ["Nova", "Rook", "Juno", "Atlas", "Kite", "Vale", "Moss", "Flint", "Echo"];
const times = [1592, 1607, 1613, 1619, 1625, 1631, 1637, 1643, 1649];

/** The mocks' bots race: 2nd of 10 in 26:38 against the medium pack, and the ride as the race submitted it. */
function botsRace() {
  const solo = soloRace(1598);
  const you = { name: "You", jersey: "you", bot: false, you: true, finishTimeS: 1598 };
  const others = pacers.map((name, index) => ({
    name: `Pacer ${name}`,
    jersey: name.toLowerCase(),
    bot: true,
    you: false,
    finishTimeS: times[index],
  }));
  return {
    raceResult: {
      ...solo.raceResult,
      mode: "bots",
      pack: "medium",
      place: 2,
      field: 10,
      standings: [others[0], you, ...others.slice(1)],
    },
    ride: { ...solo.ride, mode: "bots", pack: "medium", place: 2, fieldSize: 10 },
  };
}

const MOCK_LINES: [string, number][] = [
  ["Finished", 100],
  ["2nd of 10", 160],
  ["Podium", 75],
  ["84% on target", 67],
  ["4-day streak", 40],
];

async function open(page: Page, api: ApiFixture, state: { ride: { rideId: string } }, answer: object | null) {
  if (answer) api.answer("POST", "/api/rides", answer);
  await openResults(page, state);
  const results = new ResultsPage(page);
  await expect(results.lead).toBeVisible();
  return results;
}

test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`2nd of 10 with its XP and a new star at ${size}`, async ({ page, api }) => {
    await frame(page, size);
    const state = botsRace();
    const results = await open(page, api, state, recorded(state.ride, MOCK_LINES, { held: 2, earned: 1 }, {
      bestSeconds: 1598,
      previousBestSeconds: 1630,
      isNewBest: true,
    }));
    await expect(results.xpTotal).toHaveText("+442");
    await pictures(page);
    await shot(page, `bots-${size.toLowerCase()}`);
  });
}

test("the XP panel recording, offline and not recorded at XL", async ({ page, api }) => {
  await frame(page, "XL");
  api.answer("POST", "/api/rides", () => new Promise(() => undefined));
  let results = await open(page, api, soloRace(1598), null);
  await expect(results.xpNote).toHaveText("Recording your ride…");
  await shot(page, "recording-xl");

  api.answer("POST", "/api/rides", () => ({ offline: true }));
  results = await open(page, api, soloRace(1598), null);
  await expect(results.xpNote).toHaveText("Your XP will be added when you’re back online.");
  await shot(page, "offline-xl");

  api.answer("POST", "/api/rides", () => ({ status: 422, body: { status: 422, code: "ride_not_plausible" } }));
  results = await open(page, api, soloRace(1598), null);
  await expect(results.xpNote).toHaveText("This ride wasn’t recorded, so it earned no XP.");
  await shot(page, "not-recorded-xl");
});

test("a new personal best, a slower solo race and a class at XL", async ({ page, api }) => {
  await frame(page, "XL");
  let state = soloRace(1598);
  let results = await open(page, api, state, recorded(state.ride, [["Finished", 100], ["84% on target", 67], ["4-day streak", 40]], { held: 3, earned: 1 }, {
    bestSeconds: 1598,
    previousBestSeconds: 1630,
    isNewBest: true,
  }));
  await expect(results.sub).toHaveText("Best before: 27:10");
  await shot(page, "best-xl");

  state = soloRace(1652);
  results = await open(page, api, state, recorded(state.ride, [["Finished", 100], ["84% on target", 67], ["4-day streak", 40]], { held: 3, earned: 0 }, {
    bestSeconds: 1598,
    previousBestSeconds: 1598,
    isNewBest: false,
  }));
  await expect(results.sub).toHaveText("Best: 26:38");
  await shot(page, "slower-xl");

  const hiit = soloClass();
  results = await open(page, api, hiit, recorded(hiit.ride, [["Finished", 100], ["84% on target", 67], ["4-day streak", 40]], null, null));
  await expect(results.xpTotal).toHaveText("+207");
  await shot(page, "class-xl");
});
