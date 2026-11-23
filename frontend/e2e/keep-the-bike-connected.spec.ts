// Acceptance test
// Traces to: L2-016 AC1, AC3; L2-017 AC1, AC2
// Description: once an Echelon is connected and initialised, Telo Ride writes a keepalive about once a second, each
// with response. When the bike drops, the keepalives stop, the header says so, and every 3 seconds Telo Ride tries
// the same bike again without the chooser until it is back. Playwright's clock moves time on; nothing sleeps.
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

test.describe('Keep the bike connected', () => {
  test(
    'writes 4 to 6 keepalives in any 5 seconds once the bike is initialised (L2-016 AC1)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await page.clock.install();
      await bluetooth.offer(echelonBike);
      const connect = new ConnectBikePage(page);
      await connect.open();
      await connect.pair();
      await expect.poll(() => bluetooth.writes().length).toBe(3);
      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
      await expect(connect.pairButton).toHaveText('Paired');
      const before = bluetooth.writes().length;

      await page.clock.runFor(5000);

      await expect.poll(() => bluetooth.writes().slice(before).length).toBeGreaterThanOrEqual(4);
      const keepalives = bluetooth.writes().slice(before);
      expect(keepalives.length).toBeLessThanOrEqual(6);
      expect(keepalives).toEqual(
        keepalives.map(() => ({
          characteristic: ECHELON_WRITE,
          hex: KEEPALIVE,
          withResponse: true,
        })),
      );
    },
  );

  test(
    'a dropped bike stops its keepalives and is tried again every 3 seconds until it is back (L2-016 AC3, L2-017 AC1, AC2)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await page.clock.install();
      await page.setViewportSize({ width: 1024, height: 768 });
      await bluetooth.remember(echelonBike);
      const home = new HomePage(page);
      await home.open();
      await expect.poll(() => bluetooth.writes().length).toBe(3);
      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
      await expect(home.header.bike).toHaveText('Echelon EX-5s connected');

      await bluetooth.switchOff();
      await bluetooth.drop();

      await expect(home.header.bike).toHaveText('Echelon EX-5s not connected');
      const afterDrop = bluetooth.log().length;
      await page.clock.runFor(9000);
      expect(bluetooth.log().slice(afterDrop)).toEqual([]);
      expect(bluetooth.requests()).toEqual([]);

      await bluetooth.switchOn();
      await page.clock.runFor(3000);

      await expect.poll(() => bluetooth.log().slice(afterDrop)).toEqual(INITIALISED);
      await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
      await expect(home.header.bike).toHaveText('Echelon EX-5s connected');
      expect(bluetooth.requests()).toEqual([]);
    },
  );
});
