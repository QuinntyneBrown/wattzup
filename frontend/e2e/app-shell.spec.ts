// Acceptance test
// Traces to: L2-146
// Description: the ride app built from the Telo Ride workspace serves Home inside the app shell, with the app header,
// the skip link, and the design system's tokens and bundled fonts.
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { HomePage } from './pages/home.page';

test.describe('App shell', () => {
  // A rider who paired a bike opens on Home (L2-015 AC1).
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test(
    'Home opens with the app header, Home current (L2-146 AC1, AC4)',
    { tag: '@critical' },
    async ({ page }) => {
      const home = new HomePage(page);
      await home.open();

      await expect(home.header.brand).toHaveAccessibleName('Home');
      await expect(home.header.lockup).toHaveAccessibleName('Telo Ride');
      for (const name of ['Home', 'Race', 'Classes', 'Profile'] as const) {
        await expect(home.header.link(name)).toBeVisible();
      }
      await expect(home.header.current()).toHaveText('Home');
      await expect(home.main).toBeAttached();
    },
  );

  test('the first Tab reaches “Skip to content”, which moves focus to the page', async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.open();
    // Home's chunk loads after the shell; under load the first Tab can come before its main exists.
    await expect(home.main).toBeAttached();

    await page.keyboard.press('Tab');
    await expect(home.skipLink).toBeFocused();
    await expect(home.skipLink).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(home.main).toBeFocused();
  });

  test('the wordmark is set in the bundled Barlow Condensed, served by the app itself', async ({
    page,
  }) => {
    const fonts: string[] = [];
    page.on('requestfinished', (request) => {
      if (request.resourceType() === 'font') fonts.push(new URL(request.url()).pathname);
    });
    const home = new HomePage(page);
    await home.open();

    await expect.poll(() => home.header.wordmarkFontLoaded()).toBe(true);
    expect(fonts).toContain('/fonts/barlow-condensed-800-italic.woff2');
  });

  test('the design system’s tokens colour the page: ink behind it, signal on the wordmark’s product name', async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.open();

    expect(await home.background()).toBe('rgb(10, 11, 13)');
    // "Ride" reads --color-volt-fg, the signal as text: #ff5233 on dark, 4.5:1 on every surface (L2-143 AC2).
    expect(await home.header.productColour()).toBe('rgb(255, 82, 51)');
  });
});
