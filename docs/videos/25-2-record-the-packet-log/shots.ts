import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { startCustomRide } from "../../../frontend/e2e/fixtures/custom-ride";
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { DiagnosticsDialog } from "../../../frontend/e2e/pages/diagnostics.dialog";
import { ProfilePage } from "../../../frontend/e2e/pages/profile.page";
import { type Size, SIZES, detail, frame, shot, shotsDir } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 25.2, Record the packet log, in the running app, through the page objects of
 * e2e/packet-log.spec.ts: the custom ride at 1440 px with Diagnostics open on its packet log, close-ups of the log with
 * "Log every packet" off and then on and recording, the first lines of the file it saves (kept as text for the film's
 * terminal), Profile on a phone with the log, and Diagnostics' log over Profile at 390, 768, 1024 and 1440 px. The fake
 * Bluetooth stack and the API fixture stand in, so no real bike or backend ran. Not a test: only
 * `node tools/video-record/record.mjs docs/videos/25-2-record-the-packet-log`.
 */

test("the packet log on the custom ride at 1440 px", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.resume();
  await ride.diagnostics.click();
  const diagnostics = new DiagnosticsDialog(page);
  await expect(diagnostics.count).toHaveText(/commands/);
  await page.clock.runFor(4000);
  await diagnostics.download.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await shot(page, "ride-log-xl");
  await detail(diagnostics.log, "log-off", 0);

  await diagnostics.everyPacket.click();
  for (let cadence = 78; cadence < 84; cadence++) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(cadence));
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(8));
  }
  await expect(diagnostics.recording).toBeVisible();
  await page.mouse.move(0, 0);
  await detail(diagnostics.log, "log-recording", 0);

  const [download] = await Promise.all([page.waitForEvent("download"), diagnostics.download.click()]);
  const text = await readFile(await download.path(), "utf8");
  await writeFile(path.join(shotsDir, "..", "packets.txt"), `${download.suggestedFilename()}\n${text}`);
});

test("Profile on a phone, with the packet log", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  await bluetooth.remember(echelonBike);
  const profile = new ProfilePage(page);
  await profile.open();
  await profile.bikeRow.click();
  const diagnostics = new DiagnosticsDialog(page);
  await diagnostics.download.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await shot(page, "profile-log-xs");
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`the packet log over Profile at ${SIZES[size].width} px`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const profile = new ProfilePage(page);
    await profile.open();
    await profile.bikeRow.click();
    const diagnostics = new DiagnosticsDialog(page);
    await diagnostics.download.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await shot(page, `profile-log-${size.toLowerCase()}`);
  });
}
