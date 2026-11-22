// Acceptance test
// Traces to: L2-139 AC1, AC2
// Description: every screen fits every width from 320 to 2560 px without scrolling sideways: Home, Map Select, Race
// Setup, the Class Library, Class Start, Profile, Settings, the custom workout, Connect Bike, sign-in, Page not found,
// Results, a race, a class ride and a custom ride, each at the narrowest and the widest. The page margin is 16 px on a
// phone, 24 px from sm and 32 px from lg, and content is at most 80 rem wide, centred. Every width between is the
// responsive sweep's (e2e/sweeps/), run only when a person asks.
import { screens } from './fixtures/screens';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';

test.describe('Fit every width', () => {
  for (const [screen, open] of Object.entries(screens)) {
    for (const width of [320, 2560]) {
      test(
        `${screen} does not scroll sideways at ${width} px (L2-139 AC1)`,
        {
          tag: screen === 'a custom ride' && width === 320 ? '@critical' : [],
        },
        async ({ page, bluetooth, api }) => {
          await page.setViewportSize({ width, height: width === 320 ? 640 : 1440 });
          const shown = await open({ page, bluetooth, api });
          await expect(shown).toBeAttached();

          expect(await new AppDocument(page).scrollsSideways()).toBe(false);
        },
      );
    }
  }

  for (const [width, margin] of [
    [320, 16],
    [640, 24],
    [1024, 32],
  ] as const) {
    test(`the page margin is ${margin} px at ${width} px (L2-139 AC2)`, async ({
      page,
      bluetooth,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const app = new AppDocument(page);
      await expect(
        await screens['Home']({ page, bluetooth, api: undefined as never }),
      ).toBeVisible();

      const layout = await app.layout();

      expect(layout.paddingLeft).toBe(margin);
      expect(layout.paddingRight).toBe(margin);
      expect(layout.width).toBe(width);
    });
  }

  test('content is at most 80 rem wide and centred at 2560 px (L2-139 AC2)', async ({
    page,
    bluetooth,
  }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    const app = new AppDocument(page);
    await expect(await screens['Home']({ page, bluetooth, api: undefined as never })).toBeVisible();

    const layout = await app.layout();

    expect(layout.width).toBe(1280);
    expect(layout.left).toBe((2560 - 1280) / 2);
  });
});
