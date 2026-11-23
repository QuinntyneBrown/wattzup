import type { Page } from "@playwright/test";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 11.1, Results screen, in the running app: a bots race finished 2nd of 10 at 390,
 * 768, 1024 and 1440 px, the same race 6th and 18 s off the podium, a solo race against your best and a solo class. Each result is
 * the one the race or class hands over in the navigation's state, set here as the ride would set it and kept across a
 * reload. Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/11-1-results-screen`.
 */

const pacers = ["Nova", "Rook", "Juno", "Atlas", "Kite", "Vale", "Moss", "Flint", "Echo"];

/** The mocks' field: the pacers' finish times in order, the rider at `place` (docs/mocks/pages/results/). */
function bots(place: number, finishTimeS: number, times: number[]) {
  const others = pacers.map((name, index) => ({
    name: `Pacer ${name}`,
    jersey: name.toLowerCase(),
    bot: true,
    you: false,
    finishTimeS: times[index],
  }));
  const you = { name: "You", jersey: "you", bot: false, you: true, finishTimeS };
  const standings = [...others.slice(0, place - 1), you, ...others.slice(place - 1)];
  return {
    raceResult: {
      mapId: "old-town-criterium",
      mapName: "Old Town Criterium",
      mode: "bots",
      pack: "medium",
      finishTimeS,
      place,
      field: 10,
      standings,
    },
  };
}

/** 26:32, then 26:47 to 27:29 every 6 s. */
const podiumField = [1592, 1607, 1613, 1619, 1625, 1631, 1637, 1643, 1649];
/** 27:02 to 27:26 every 6 s, then 27:38 to 27:56. */
const sixthField = [1622, 1628, 1634, 1640, 1646, 1658, 1664, 1670, 1676];

/** Opens Results with the result a finished ride leaves in the navigation's state. */
async function results(page: Page, state: object): Promise<ResultsPage> {
  await page.goto("/");
  await page.evaluate((s) => history.replaceState(s, "", "/results"), state);
  await page.reload();
  const view = new ResultsPage(page);
  await expect(view.lead).toHaveText("You finished");
  await pictures(page);
  return view;
}

test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`2nd of 10 against bots at ${size}`, async ({ page }) => {
    await frame(page, size);
    const view = await results(page, bots(2, 1598, podiumField));
    await expect(view.sub).toHaveText("26:38 · on the podium");
    await shot(page, `podium-${size.toLowerCase()}`);
  });
}

test("6th, a solo race and a solo class at XL", async ({ page }) => {
  await frame(page, "XL");
  const view = await results(page, bots(6, 1652, sixthField));
  await expect(view.sub).toHaveText("27:32 · 18 s off the podium");
  await shot(page, "sixth-xl");

  await results(page, {
    raceResult: {
      mapId: "old-town-criterium",
      mapName: "Old Town Criterium",
      mode: "solo",
      pack: null,
      finishTimeS: 1598,
      place: 1,
      field: 2,
      standings: [],
    },
  });
  await shot(page, "solo-xl");

  await results(page, {
    classResult: {
      classId: "hiit-cardio-30",
      title: "30 Minute HIIT Cardio",
      elapsedSeconds: 1800,
      outputKj: 341.6,
      onTargetShare: 0.838,
    },
  });
  await expect(view.sub).toHaveText("342 kJ · 84% on target");
  await shot(page, "class-xl");
});
