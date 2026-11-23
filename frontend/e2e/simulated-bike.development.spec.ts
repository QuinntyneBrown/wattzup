// Acceptance test
// Traces to: L2-024 AC1, AC4
// Description: a development build opened with ?simulate pairs a simulated Echelon EX-5s from Connect Bike without
// the browser's chooser: the page makes no Bluetooth call at all (the shared fixture fails the spec on any), and Home
// follows once it is paired.
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { HomePage } from './pages/home.page';

test.describe('Simulated bike', () => {
  test(
    '?simulate pairs a simulated Echelon EX-5s without the chooser (L2-024 AC1)',
    { tag: '@critical' },
    async ({ page }) => {
      const connect = new ConnectBikePage(page);
      await connect.open({ simulate: true });
      await expect(connect.title).toHaveText('Connect your bike');
      await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');

      await connect.pair();

      await expect(connect.deviceName).toHaveText('Echelon EX-5s');
      await expect(connect.deviceIdentifier).toHaveText('EX5S-0bf669f1');
      await expect(connect.pairButton).toHaveText('Paired');
      await expect(connect.pairedCheck).toBeVisible();
      await expect.poll(() => new HomePage(page).url()).toBe('/');
    },
  );
});
