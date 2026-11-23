import { INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME, ftmsBike } from "../../../frontend/e2e/fixtures/ftms";
import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { AppHeader } from "../../../frontend/e2e/pages/app-header";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { type Size, detail, frame, pictures, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 22.2, Validate input and encode output, in the running app, through the flow of
 * e2e/untrusted-text.spec.ts: Connect Bike after pairing a bike whose Bluetooth name holds markup, at 390, 768, 1024
 * and 1440 px, with close-ups of its name and of the header's bike status. The fake Bluetooth stack offers the bike, so
 * no real bike ran. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/22-2-validate-input-and-encode-output`.
 */

const MARKUP = '<img src=x onerror="window.__ran=1"><b>Kickr</b>';

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`a bike named with markup, paired, at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.offer({ ...ftmsBike, name: MARKUP });
    const connect = new ConnectBikePage(page);
    await connect.open();
    await connect.pair();
    await expect(connect.pairButton).toHaveText("Pairing…");
    await bluetooth.notify(INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME);
    await expect(connect.pairButton).toHaveText("Paired");
    await expect(connect.deviceName).toHaveText(MARKUP);
    await pictures(page);
    await page.mouse.move(0, 0);
    await shot(page, `connect-${size.toLowerCase()}`);
    if (size !== "XL") return;
    await detail(page.locator(".connect-device"), "device", 24);
    await detail(new AppHeader(page).bike, "header-bike", 16);
  });
}
