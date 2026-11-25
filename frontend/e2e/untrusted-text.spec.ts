// Acceptance test
// Traces to: L2-129 AC2
// Description: a bike whose Bluetooth name holds markup pairs, and its name shows as text, character for character, on
// Connect Bike and in the header's bike status: no element is made from it and nothing in it runs.
//
// Given a bike named `<img src=x onerror="window.__ran=1"><b>Kickr</b>`, when the rider pairs it, then Connect Bike
// and the header show that name as written, the page has no image or bold element from it, and its script never ran.
import { INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME, RESISTANCE_RANGE, ftmsBike } from './fixtures/ftms';
import { expect, test } from './fixtures/test';
import { AppHeader } from './pages/app-header';
import { ConnectBikePage } from './pages/connect-bike.page';

const MARKUP = '<img src=x onerror="window.__ran=1"><b>Kickr</b>';

test('a bike name with markup shows as text and runs nothing (L2-129 AC2) @critical', async ({
  page,
  bluetooth,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bluetooth.offer({ ...ftmsBike, name: MARKUP });
  const connect = new ConnectBikePage(page);
  await connect.open();

  await connect.pair();
  await expect(connect.pairButton).toHaveText('Pairing…');
  await expect.poll(() => bluetooth.log()).toContain(`read ${RESISTANCE_RANGE}`);
  await bluetooth.notify(INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME);

  await expect(connect.pairButton).toHaveText('Paired');
  await expect(connect.deviceName).toHaveText(MARKUP);
  await expect(new AppHeader(page).bike).toContainText(MARKUP);
  await expect(page.locator('img[src="x"], b:text-is("Kickr")')).toHaveCount(0);
  expect(await page.evaluate(() => (window as { __ran?: number }).__ran)).toBeUndefined();
});
