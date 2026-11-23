import { ECHELON_NOTIFY, echelonBike } from "../../../frontend/e2e/fixtures/echelon";
import { INDOOR_BIKE_DATA, ftmsBike } from "../../../frontend/e2e/fixtures/ftms";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, detail, detailAll, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 2.3, Pair a bike, in the running app: Connect Bike before
 * the press with its hint, Pairing… at 390, 768, 1024 and 1440 px, Paired, the alert for a blocked
 * chooser, an FTMS bike pairing, and Home opened again with the bike remembered. The shared
 * fixture's fake Bluetooth stands in for the browser's chooser and the bike. Not a test and not a
 * sweep: only `node tools/video-record/record.mjs docs/videos/02-3-pair-a-bike`.
 */

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f];

const settle = async (page: import("@playwright/test").Page) =>
  page.locator(".connect__photo").evaluate((img: HTMLImageElement) => img.decode());

test("Connect Bike before the press, and its hint", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  await bluetooth.offer(echelonBike);
  const connect = new ConnectBikePage(page);
  await connect.open();
  await expect(connect.hint).toBeVisible();
  await settle(page);
  await shot(page, "default-xs");
  await detailAll([connect.pairArea, connect.hint], "hint", 14);
});

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Pairing at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.offer(echelonBike);
    const connect = new ConnectBikePage(page);
    await connect.open();
    await connect.pair();
    await expect(connect.pairButton).toHaveText("Pairing…");
    await expect.poll(() => bluetooth.writes().length).toBe(3);
    await settle(page);
    await shot(page, `pairing-${size.toLowerCase()}`);
    if (size === "XS") await detail(connect.pairArea, "pairing-card", 14);
  });
}

test("Paired", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  await bluetooth.offer(echelonBike);
  const connect = new ConnectBikePage(page);
  await connect.open();
  await connect.pair();
  await expect.poll(() => bluetooth.writes().length).toBe(3);
  await settle(page);
  await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
  await expect(connect.pairedCheck).toBeVisible();
  await detail(connect.pairArea, "paired-card", 14);
});

test("A blocked chooser", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  await bluetooth.blockChooser();
  const connect = new ConnectBikePage(page);
  await connect.open();
  await connect.pair();
  await expect(connect.blockerTitle).toHaveText("Bluetooth is blocked for this page");
  await settle(page);
  await shot(page, "blocked-xs");
});

test("An FTMS bike pairing", async ({ page, bluetooth }) => {
  await frame(page, "XS");
  await bluetooth.offer(ftmsBike);
  const connect = new ConnectBikePage(page);
  await connect.open();
  await connect.pair();
  await expect(connect.deviceName).toHaveText("KICKR BIKE 1A2B");
  await expect.poll(() => bluetooth.log().length).toBe(3);
  await settle(page);
  await shot(page, "ftms-xs");
  await bluetooth.notify(INDOOR_BIKE_DATA, [0x04, 0x00, 0xd0, 0x07, 0xa0, 0x00]);
  await expect(connect.pairButton).toHaveText("Paired");
});

test("Home, with the bike remembered", async ({ page, bluetooth }) => {
  await frame(page, "XL");
  await bluetooth.remember(echelonBike);
  const home = new HomePage(page);
  await home.open();
  await expect(home.main).toBeVisible();
  await expect.poll(() => bluetooth.writes().length).toBe(3);
  await shot(page, "home-xl");
});
