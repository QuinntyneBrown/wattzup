import type { Page } from "@playwright/test";
import { hiitCardio, hiitSessions, SESSIONS_NOW } from "../../../frontend/e2e/fixtures/classes";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { maps } from "../../../frontend/e2e/fixtures/maps";
import { midRiderProgress } from "../../../frontend/e2e/fixtures/progress";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ClassStartPage } from "../../../frontend/e2e/pages/class-start.page";
import { RaceSetupPage } from "../../../frontend/e2e/pages/race-setup.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 17.3, Offline choices, in the running app: Race Setup on Old Town Criterium for
 * a level-7 rider, online with three riders queuing, then with the browser offline, Riders online closed with its
 * reason and Bots chosen (at 390, 768, 1024 and 1440 px); and Class Start for 30 Minute HIIT Cardio, online with the
 * next group session chosen, then offline with Ride alone chosen. The shared fixture's API answers the queue and the
 * sessions while online. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/17-3-offline-choices`.
 */

/** Moves the pointer out of the picture. */
async function still(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Race Setup with no network, at ${size}`, async ({ page, context, bluetooth, api }) => {
    await frame(page, size);
    api.answer("GET", "/api/maps", maps);
    api.answer("GET", "/api/progress", midRiderProgress);
    api.answer("GET", "/api/maps/old-town-criterium/queue", { riders: 3 });
    await bluetooth.remember(echelonBike);
    const setup = new RaceSetupPage(page);
    await setup.open("old-town-criterium");
    const online = setup.mode("Riders online");
    await expect(online).toContainText("3 riders queuing now.");
    if (size === "XL") {
      await still(page);
      await shot(page, "setup-online-xl");
      await detail(setup.modes, "modes-online", 24);
    }
    await context.setOffline(true);
    await expect(online).toContainText("You’re offline. Riders online needs a network.");
    await still(page);
    await shot(page, `setup-offline-${size.toLowerCase()}`);
    if (size === "XL") await detail(setup.modes, "modes-offline", 24);
  });
}

test("Class Start with no network, at XL", async ({ page, context, bluetooth, api }) => {
  await frame(page, "XL");
  await page.clock.install({ time: SESSIONS_NOW });
  api.answer("GET", `/api/classes/${hiitCardio.id}/sessions`, hiitSessions);
  await bluetooth.remember(echelonBike);
  const start = new ClassStartPage(page);
  await start.open(hiitCardio.id);
  await expect(start.group).toHaveAttribute("aria-checked", "true");
  await still(page);
  await shot(page, "class-online-xl");
  await context.setOffline(true);
  await expect(start.body(start.group)).toHaveText("You’re offline. Group classes need a network.");
  await expect(start.alone).toHaveAttribute("aria-checked", "true");
  await still(page);
  await shot(page, "class-offline-xl");
  await detail(start.choice, "choice-offline", 24);
});
