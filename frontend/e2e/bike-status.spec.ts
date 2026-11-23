// Acceptance test
// Traces to: L2-019 AC1, AC2
// Description: from lg, the app header shows the bike: its name with the hidden text " connected" once it is
// connected, and a red status titled "Bike not connected" until then. Below lg the header leaves it out.
import { ECHELON_NOTIFY, echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [
  0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f,
];

test.describe('Bike status in the app header', () => {
  test(
    'reads "Bike not connected" until the remembered bike connects, then its name (L2-019 AC1, AC2)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await bluetooth.remember(echelonBike);
      const home = new HomePage(page);
      await home.open();

      await expect(home.header.bike).toHaveText('Echelon EX-5s not connected');
      await expect(home.header.bike).toHaveAttribute('title', 'Bike not connected');
      await expect(home.header.bike).toHaveClass(/app-header__bike--off/);

      await expect.poll(() => bluetooth.writes().length).toBe(3);
      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);

      await expect(home.header.bike).toHaveText('Echelon EX-5s connected');
      await expect(home.header.bike).not.toHaveAttribute('title');
      await expect(home.header.bike).not.toHaveClass(/app-header__bike--off/);
    },
  );

  test('is left out of the header below lg (L2-019 AC1)', async ({ page, bluetooth }) => {
    await page.setViewportSize({ width: 1023, height: 768 });
    await bluetooth.remember(echelonBike);
    const home = new HomePage(page);
    await home.open();

    await expect(home.header.root).toBeVisible();
    await expect(home.header.bike).toBeAttached();
    await expect(home.header.bike).toBeHidden();
  });
});
