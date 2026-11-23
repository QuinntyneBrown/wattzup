// Acceptance test
// Traces to: L2-024 AC3
// Description: the production build ignores ?simulate: pairing from Connect Bike goes through Web Bluetooth, so the
// card shows the bike the browser offered, not the simulated Echelon EX-5s.
import { ECHELON_NOTIFY, echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { HomePage } from './pages/home.page';

/** A `D1` frame: 5 s, no revolutions, 80 rpm (docs/protocol/echelon-ble-frames.md). */
const WORKOUT_FRAME = [
  0xf0, 0xd1, 0x09, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x50, 0x00, 0x1f,
];

test.describe('Simulated bike in production', () => {
  test('a production build ignores ?simulate and pairs through Web Bluetooth (L2-024 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.offer(echelonBike);
    const connect = new ConnectBikePage(page);
    await connect.open({ simulate: true });

    await connect.pair();

    await expect(connect.deviceIdentifier).toHaveText('EX5S-141844');
    await expect.poll(() => bluetooth.writes().length).toBe(3);
    await bluetooth.notify(ECHELON_NOTIFY, WORKOUT_FRAME);
    await expect(connect.pairButton).toHaveText('Paired');
    await expect.poll(() => new HomePage(page).url()).toBe('/');
  });
});
