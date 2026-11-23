// Acceptance test
// Traces to: L2-015 AC1; L2-011 AC5
// Description: a bike paired in this browser is remembered: Telo Ride opens on Home and reconnects to it through
// getDevices() without the chooser. A rider with no remembered bike starts on Connect Bike.
import { ECHELON_NOTIFY, ECHELON_WRITE, echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { HomePage } from './pages/home.page';

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [
  0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f,
];
const KEEPALIVE = 'F0 A0 01 01 92';
const INITIALISED = [
  `subscribe ${ECHELON_NOTIFY}`,
  `write ${ECHELON_WRITE} F0 A1 00 91`,
  `write ${ECHELON_WRITE} F0 A3 00 93`,
  `write ${ECHELON_WRITE} F0 B0 01 01 A2`,
];

test.describe('The remembered bike', () => {
  test(
    'a paired bike is remembered: Telo Ride reopens on Home and reconnects without the chooser (L2-015 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await bluetooth.offer(echelonBike);
      const connect = new ConnectBikePage(page);
      await connect.open();
      await connect.pair();
      await expect.poll(() => bluetooth.log()).toEqual(INITIALISED);
      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
      const home = new HomePage(page);
      await expect.poll(() => home.url()).toBe('/');

      await home.open();

      await expect(home.main).toBeVisible();
      expect(home.url()).toBe('/');
      // The first session's keepalives may land between the two initialisations.
      await expect
        .poll(() => bluetooth.log().filter((line) => !line.endsWith(KEEPALIVE)))
        .toEqual([...INITIALISED, ...INITIALISED]);
      expect(bluetooth.requests()).toHaveLength(1);
    },
  );

  test('a rider with no remembered bike starts on Connect Bike (L2-011)', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();

    await expect(new ConnectBikePage(page).pairButton).toHaveText('Pair Echelon EX-5s');
    expect(home.url()).toBe('/connect');
  });
});
