import { ECHELON_NOTIFY, echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 5.1, Workout engine and ride clock, in the running app: Home with the
 * remembered bike connected and streaming `D1` and `D2` frames at 390, 768, 1024 and 1440 px, the header's bike
 * status, and Connect Bike on a phone. Slice 5.1 steps the plan in the engine; the class ride screen comes with slice
 * 5.2, so these show the app the commands go out from. The shared fixture's fake Bluetooth stands in for the bike.
 * Not a test and not a sweep: only `node tools/video-record/record.mjs docs/videos/05-1-workout-engine-and-ride-clock`.
 */

/** `D1`: 5 s, no revolutions, 80 rpm; `D2`: resistance 12 (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f];
const RESISTANCE_FRAME = [0xf0, 0xd2, 0x01, 0x0c, 0xcf];

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home with the bike streaming at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const home = new HomePage(page);
    await home.open();
    await expect.poll(() => bluetooth.writes().length).toBeGreaterThanOrEqual(3);
    await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
    await bluetooth.notify(ECHELON_NOTIFY, RESISTANCE_FRAME);
    await expect(home.header.bike).toHaveText("Echelon EX-5s connected");
    await shot(page, `home-${size.toLowerCase()}`);
    if (size === "XL") await detail(home.header.bike, "bike-on", 12);
  });
}

test("Connect Bike on a phone", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  await bluetooth.offer(echelonBike);
  const connect = new ConnectBikePage(page);
  await connect.open();
  await expect(connect.pairButton).toBeVisible();
  await page.locator(".connect__photo").evaluate((img: HTMLImageElement) => img.decode());
  await shot(page, "connect-xs");
});
