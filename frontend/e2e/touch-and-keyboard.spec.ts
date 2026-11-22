// Acceptance test
// Traces to: L2-140 AC1, AC2
// Description: every screen works by touch on a phone and by keyboard on a desktop. At 390 px, a tap anywhere in a
// 44 × 44 px square centred on any control reaches it, and in a 48 × 48 px square on a ride (a race, a class ride, a
// custom ride), whatever the control looks like. At 1280 px, Tab reaches every control in turn, each in the window
// and drawn with a focus ring. The custom ride's level bars are the one exception to the tap area: the resistance
// stepper beside them sets the same levels with 48 px buttons and is the keyboard's way (WCAG 2.5.8, equivalent).
import { screens } from './fixtures/screens';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';

const rides = new Set(['a race', 'a class ride', 'a custom ride']);
const equivalents = ['.ride-levels__bar'];

test.describe('Touch and keyboard', () => {
  for (const [screen, open] of Object.entries(screens)) {
    const size = rides.has(screen) ? 48 : 44;

    test(
      `a tap within ${size} px reaches every control of ${screen} on a phone (L2-140 AC2)`,
      { tag: screen === 'a class ride' ? '@critical' : [] },
      async ({ page, bluetooth, api }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(await open({ page, bluetooth, api })).toBeAttached();

        expect(await new AppDocument(page).untappable(size, equivalents)).toEqual([]);
      },
    );

    test(`Tab reaches every control of ${screen}, each with a focus ring (L2-140 AC1)`, async ({
      page,
      bluetooth,
      api,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await expect(await open({ page, bluetooth, api })).toBeAttached();

      const stops = await new AppDocument(page).tabStops();

      expect(stops.length).toBeGreaterThan(0);
      expect(stops.filter((stop) => !stop.ring || !stop.shown)).toEqual([]);
    });
  }
});
