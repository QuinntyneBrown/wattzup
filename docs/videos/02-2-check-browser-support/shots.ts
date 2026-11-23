import { expect, test } from "../../../frontend/e2e/fixtures/test";
import { ConnectBikePage } from "../../../frontend/e2e/pages/connect-bike.page";
import { type Size, frame, shot } from "../../../tools/video-record/shots";

/**
 * The screenshots of the film of slice 2.2, Check browser support, in the running app: Connect
 * Bike with its "Works with" list at 390, 768, 1024 and 1440 px; the alert in a browser without
 * Web Bluetooth; and the alert on a plain http page. The shared fixture's fake Bluetooth stands in
 * for the browser's, removed or served over plain http as each state needs. Not a test and not a
 * sweep: only `node tools/video-record/record.mjs docs/videos/02-2-check-browser-support`.
 */

const settle = async (page: import("@playwright/test").Page) =>
  page.locator(".connect__photo").evaluate((img: HTMLImageElement) => img.decode());

for (const size of ["XS", "M", "L", "XL"] as Size[]) {
  test(`Connect Bike at ${size}`, async ({ page }) => {
    await frame(page, size);
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.worksWith).toBeVisible();
    await settle(page);
    await shot(page, `connect-${size.toLowerCase()}`);
  });
}

for (const size of ["XS", "XL"] as Size[]) {
  test(`A browser without Web Bluetooth at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.remove();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.blockerTitle).toHaveText("This browser can't reach the bike");
    await settle(page);
    await shot(page, `unsupported-${size.toLowerCase()}`);
  });

  test(`A plain http page at ${size}`, async ({ page, bluetooth }) => {
    await frame(page, size);
    await bluetooth.servePlainHttp();
    const connect = new ConnectBikePage(page);
    await connect.open();
    await expect(connect.blockerAction).toHaveText("Open over HTTPS");
    await settle(page);
    await shot(page, `https-${size.toLowerCase()}`);
  });
}

test("The Works with list, close", async ({ page }) => {
  await frame(page, "XS");
  const connect = new ConnectBikePage(page);
  await connect.open();
  await connect.worksWith.scrollIntoViewIfNeeded();
  await settle(page);
  await shot(page, "works-xs");
});
