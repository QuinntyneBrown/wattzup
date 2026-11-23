import { ECHELON_NOTIFY, echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, detail, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 2.4, Keep the bike connected, in the running app: Home with
 * the remembered bike connected at 390, 768, 1024 and 1440 px, the header's bike status before the
 * bike connects, once it does and after it drops, and Connect Bike with Bluetooth off. The shared
 * fixture's fake Bluetooth stands in for the bike and the radio. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/02-4-keep-the-bike-connected`.
 */

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f];

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Home with the bike connected at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remember(echelonBike);
    const home = new HomePage(page);
    await home.open();
    await expect.poll(() => bluetooth.writes().length).toBeGreaterThanOrEqual(3);
    await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
    await expect(home.header.bike).toHaveText("Echelon EX-5s connected");
    await shot(page, `home-${size.toLowerCase()}`);
    if (size === "XL") await detail(home.header.bike, "bike-on", 12);
  });
}

test("The bike status before the bike connects", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const home = new HomePage(page);
  await home.open();
  await expect(home.header.bike).toHaveText("Echelon EX-5s not connected");
  await detail(home.header.bike, "bike-off", 12);
});

test("Home after the bike drops", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const home = new HomePage(page);
  await home.open();
  await expect.poll(() => bluetooth.writes().length).toBeGreaterThanOrEqual(3);
  await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
  await expect(home.header.bike).toHaveText("Echelon EX-5s connected");
  await bluetooth.switchOff();
  await bluetooth.drop();
  await expect(home.header.bike).toHaveText("Echelon EX-5s not connected");
  await shot(page, "dropped-xl");
});

for (const size of ["XS", "XL"] as Size[]) {
  test(`Connect Bike with Bluetooth off at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.adapterOff();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.blockerTitle).toHaveText("Bluetooth is off");
    await page.locator(".connect__photo").evaluate((img: HTMLImageElement) => img.decode());
    await shot(page, `bluetooth-off-${size.toLowerCase()}`);
  });
}
