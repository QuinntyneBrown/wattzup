import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { HomePage } from "../../../frontend/e2e/pages/home.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 2.1, Ride a simulated bike, in the running development
 * build (`ng serve`) opened with `?simulate`: Connect Bike at 390, 768, 1024 and 1440 px, the
 * simulated Echelon EX-5s paired, and Home after it. The page clock is installed so the paired
 * card holds until the shot is taken. The shared fixture fails on any Bluetooth call: the
 * simulator makes none. Not a test and not a sweep: only
 * `node tools/video-record/record.mjs docs/videos/02-1-ride-a-simulated-bike`.
 */

const sizes: Size[] = ["XS", "M", "L", "XL"];

for (const size of sizes) {
  test(`Connect Bike at ${size}`, async ({ page }) => {
    await frame(page, size);
    const connect = new ConnectBikePage(page);
    await connect.open({ simulate: true });
    await expect(connect.pairButton).toHaveText("Pair Echelon EX-5s");
    await page.locator(".connect__photo").evaluate((img: HTMLImageElement) => img.decode());
    await shot(page, `connect-${size.toLowerCase()}`);
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`Paired, then Home, at ${size}`, async ({ page }) => {
    await frame(page, size);
    await page.clock.install();
    const connect = new ConnectBikePage(page);
    await connect.open({ simulate: true });
    await page.locator(".connect__photo").evaluate((img: HTMLImageElement) => img.decode());
    await connect.pair();
    await expect(connect.pairButton).toHaveText("Paired");
    await shot(page, `paired-${size.toLowerCase()}`);
    await page.clock.runFor(600);
    await expect.poll(() => new HomePage(page).url()).toBe("/");
    await shot(page, `home-${size.toLowerCase()}`);
  });
}
