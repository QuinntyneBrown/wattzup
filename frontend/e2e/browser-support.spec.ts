// Acceptance test
// Traces to: L2-018 AC1, AC3, AC4; L2-007 AC1, AC4; L2-008 AC1, AC4; L2-009 AC3, AC4
// Description: Connect Bike lists the bikes Telo Ride works with, and in a browser or on a page that cannot reach the
// bike it replaces the device card with an alert saying why and what to do.
import { expect, test } from './fixtures/test';
import { ConnectBikePage } from './pages/connect-bike.page';
import { HomePage } from './pages/home.page';

test.describe('Browser support on Connect Bike', () => {
  test('lists the bikes it works with, one column on a phone and two from sm (L2-007)', async ({
    page,
  }) => {
    const connect = new ConnectBikePage(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await connect.open();

    await expect(connect.worksWith).toBeVisible();
    await expect(connect.blocker).toHaveCount(0);
    await expect(connect.worksWithBikes).toHaveText([
      'Echelon EX-5s',
      'Echelon EX-3',
      'Echelon EX-8s',
      'Echelon Connect Sport',
      'Other FTMS smart bikes',
    ]);
    await expect(connect.worksWithStatuses).toHaveText([
      'Full control',
      'Full control',
      'Full control',
      'Full control',
      'Beta',
    ]);
    const [first, second] = await connect.worksWithRowTops();
    expect(second).toBeGreaterThan(first);

    await page.setViewportSize({ width: 1024, height: 768 });
    const [wideFirst, wideSecond] = await connect.worksWithRowTops();
    expect(wideSecond).toBe(wideFirst);
  });

  test(
    'in a browser without Web Bluetooth, an alert replaces the device card until it can (L2-008)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      await bluetooth.remove();
      const connect = new ConnectBikePage(page);
      await connect.open();

      await expect(connect.blocker).toBeVisible();
      await expect(connect.blockerTitle).toHaveText("This browser can't reach the bike");
      await expect(connect.blockerBody).toHaveText(
        "Open Telo Ride in Chrome or Edge on a laptop or Android tablet. Safari and Firefox don't support Web Bluetooth yet.",
      );
      await expect(connect.deviceName).toHaveCount(0);
      await expect(connect.pairButton).toHaveCount(0);
      await expect(connect.worksWith).toBeVisible();

      await bluetooth.restore();
      await connect.blockerAction.click();

      await expect(connect.blocker).toHaveCount(0);
      await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
    },
  );

  test('on a plain http page, an alert offers the same page over HTTPS (L2-009)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.servePlainHttp();
    const connect = new ConnectBikePage(page);
    await connect.open();

    await expect(connect.blocker).toBeVisible();
    await expect(connect.blockerTitle).toHaveText('Open the secure version of this page');
    await expect(connect.blockerBody).toHaveText(
      'Bluetooth is blocked on plain http, so the bike can’t connect.',
    );
    await expect(connect.blockerAction).toHaveText('Open over HTTPS');
    const secure = new URL(page.url());
    secure.protocol = 'https:';
    await expect(connect.blockerAction).toHaveAttribute('href', secure.href);
    await expect(connect.pairButton).toHaveCount(0);
  });

  test('in a browser without Web Bluetooth, Home works with no bike (L2-010 AC5)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.remove();
    const home = new HomePage(page);

    await home.open();

    await expect(home.main).toBeVisible();
    expect(home.url()).toBe('/');
  });

  test('with Bluetooth off, an alert says so, and Try again finds it back on (L2-018 AC1, AC3, AC4)', async ({
    page,
    bluetooth,
  }) => {
    await bluetooth.adapterOff();
    const connect = new ConnectBikePage(page);
    await connect.open();

    await expect(connect.blockerTitle).toHaveText('Bluetooth is off');
    await expect(connect.blockerBody).toHaveText(
      'Turn on Bluetooth on this computer, then try again.',
    );
    await expect(connect.pairButton).toHaveCount(0);
    await expect(connect.deviceName).toHaveCount(0);

    await bluetooth.adapterOn();
    await connect.blockerAction.click();

    await expect(connect.blocker).toHaveCount(0);
    await expect(connect.pairButton).toHaveText('Pair Echelon EX-5s');
  });
});
