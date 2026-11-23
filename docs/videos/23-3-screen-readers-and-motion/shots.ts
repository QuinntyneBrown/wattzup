import { writeFileSync } from "node:fs";
import path from "node:path";
import { startCustomRide } from "../../../frontend/e2e/fixtures/custom-ride";
import { openResults, soloRace } from "../../../frontend/e2e/fixtures/results";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { AppDocument } from "../../../frontend/e2e/pages/app-document";
import { ResultsPage } from "../../../frontend/e2e/pages/results.page";
import { type Size, SIZES, detail, frame, pictures, shot, shotsDir } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 23.3, Screen readers and motion, in the running app, through the fixtures and
 * page objects of e2e/screen-readers-and-motion.spec.ts: the custom ride at 390 px as its first work starts, with what
 * its live region then says; Results at 390 px with what it says as it opens; the leave dialog over the custom ride at
 * 390 and 1440 px; and Results at 390, 768, 1024 and 1440 px. What each live region says is read from the page and
 * saved in shots/heard.json, which the film quotes. The fake Bluetooth stack and the API fixture stand in, so no real
 * bike or backend ran. Not a test: only `node tools/video-record/record.mjs docs/videos/23-3-screen-readers-and-motion`.
 */

const heard: Record<string, string> = {};

test.afterAll(() => {
  writeFileSync(path.join(shotsDir, "heard.json"), `${JSON.stringify(heard, null, 2)}\n`);
});

test("the custom ride's first work at 390 px", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.fastForward("05:00");
  await page.clock.runFor(1000);
  const app = new AppDocument(page);
  await expect(ride.intervalName).toHaveText("Work Round 1 of 8");
  await expect(app.announcement).toHaveText("Work, round 1 of 8: 0:30 at level 24");
  heard.step = (await app.announcement.textContent()) ?? "";
  await page.clock.resume();
  await page.mouse.move(0, 0);
  await shot(page, "custom-ride-work-xs");
  await detail(ride.intervalBar.locator(".."), "interval-card", 16);
});

test("Results as it opens at 390 px", async ({ page }) => {
  await frame(page, "XS");
  await openResults(page, soloRace(1598));
  const app = new AppDocument(page);
  await expect(app.announcement).toHaveText(/XP earned/);
  heard.result = (await app.announcement.textContent()) ?? "";
  await pictures(page);
  await page.mouse.move(0, 0);
  await shot(page, "results-xs-open");
});

for (const size of ["XS", "XL"] as Size[]) {
  test(`the leave dialog at ${SIZES[size].width} px`, async ({ page, bluetooth }) => {
    await frame(page, size);
    const ride = await startCustomRide(page, bluetooth);
    await ride.library.click();
    await page.clock.runFor(100);
    await expect(ride.leave).toBeVisible();
    await expect(new AppDocument(page).app).toHaveAttribute("inert");
    await page.keyboard.press("Tab");
    await page.clock.resume();
    await shot(page, `leave-dialog-${size.toLowerCase()}`);
  });
}

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Results at ${SIZES[size].width} px`, async ({ page }) => {
    await frame(page, size);
    await openResults(page, soloRace(1598));
    await expect(new ResultsPage(page).heading).toBeAttached();
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `results-${size.toLowerCase()}`);
  });
}
