// Acceptance test
// Traces to: L2-145, L2-146
// Description: the Telo Ride workspace serves the app shell; an unknown address shows Page not found and leads Home.
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';
import { NotFoundPage } from './pages/not-found.page';

test.describe('Page not found', () => {
  test('an address that matches no screen says so, with no current header item (L2-145 AC1)', async ({
    page,
  }) => {
    const notFound = new NotFoundPage(page);
    await notFound.open('/no-such-screen');

    await expect(notFound.header.brand).toHaveAccessibleName('Home');
    await expect(notFound.header.link('Race')).toBeVisible();
    await expect(notFound.header.current()).toHaveCount(0);
    await expect(notFound.heading).toHaveText('This page doesn’t exist.');
    await expect(notFound.lead).toHaveText(
      'The link may be old, or the address has a typo. Your rides and progress are safe.',
    );
    await expect(notFound.backHome).toBeVisible();
  });

  test('“Back to Home” opens Home (L2-145 AC2)', async ({ page, bluetooth }) => {
    await bluetooth.remember(echelonBike);
    const notFound = new NotFoundPage(page);
    await notFound.open('/no-such-screen');
    await notFound.backHome.click();

    const home = new HomePage(page);
    await expect.poll(() => home.url()).toBe('/');
    await expect(home.header.current()).toHaveText('Home');
  });
});
