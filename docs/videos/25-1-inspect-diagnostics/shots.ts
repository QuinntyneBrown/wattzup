import { RIDE_START } from "../../../frontend/e2e/fixtures/class-ride";
import { startCustomRide } from "../../../frontend/e2e/fixtures/custom-ride";
import { echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { CustomRidePage } from "../../../frontend/e2e/pages/custom-ride.page";
import { DiagnosticsDialog } from "../../../frontend/e2e/pages/diagnostics.dialog";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { type Size, SIZES, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 25.1, Inspect diagnostics, in the running app, through the page objects of
 * e2e/diagnostics.spec.ts: the custom ride at 1440 px with a connected bike, its bike status and the facts it opens; the
 * facts with no bike picked; Profile on a phone with Bluetooth off, before and with Diagnostics open; and Diagnostics
 * over Profile at 390, 768, 1024 and 1440 px. The fake Bluetooth stack and the API fixture stand in, so no real bike or
 * backend ran. Not a test: only `node tools/video-record/record.mjs docs/videos/25-1-inspect-diagnostics`.
 */

test("a connected bike's facts, from the custom ride at 1440 px", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await page.mouse.move(0, 0);
  await detail(ride.diagnostics, "ride-status", 24);
  await ride.diagnostics.click();
  const diagnostics = new DiagnosticsDialog(page);
  await expect(diagnostics.fact("Last command")).toHaveText(/^RES 8/);
  await page.clock.runFor(5000);
  await shot(page, "ride-diagnostics-xl");
  await detail(diagnostics.panel, "facts-connected", 0);
});

test("no bike picked, at 1024 px", async ({ page }) => {
  await frame(page, "L");
  await page.clock.install({ time: RIDE_START });
  const ride = new CustomRidePage(page);
  await ride.open();
  await page.clock.resume();
  await ride.diagnostics.click();
  const diagnostics = new DiagnosticsDialog(page);
  await expect(diagnostics.fact("Bike")).toHaveText("None picked yet");
  await detail(diagnostics.panel, "facts-no-bike", 0);
});

test("Bluetooth off, from Profile on a phone", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  await bluetooth.remember(echelonBike, { lastSeenDaysAgo: 2 });
  await bluetooth.adapterOff();
  const profile = new ProfilePage(page);
  await profile.open();
  await page.mouse.move(0, 0);
  await shot(page, "profile-xs");
  await profile.bikeRow.click();
  const diagnostics = new DiagnosticsDialog(page);
  await expect(diagnostics.fact("Bike")).toHaveText("Echelon EX-5s · last seen 2 days ago");
  await shot(page, "profile-off-xs");
  await detail(diagnostics.panel, "facts-off", 0);
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Diagnostics over Profile at ${SIZES[size].width} px`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const profile = new ProfilePage(page);
    await profile.open();
    await profile.bikeRow.click();
    await expect(new DiagnosticsDialog(page).privacy).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, `profile-diagnostics-${size.toLowerCase()}`);
  });
}
