// Acceptance test
// Traces to: L2-141 AC2, AC3, L2-142 AC2
// Description: a screen reader hears each step of a ride once, as it starts (the custom ride's "Work, round 1 of 8:
// 0:30 at level 24", the class ride's "Work, 0:30"), and the result when Results opens; the countdowns are timers
// it is not read every second. A dialog takes the focus and keeps it, the app behind it is inert, and closing it
// gives the focus back to what opened it. With the device asking for reduced motion, nothing on any screen moves but
// an opacity fade: the interval and segment bars jump to their place.
import { startClassRide } from './fixtures/class-ride';
import { startCustomRide } from './fixtures/custom-ride';
import { openResults, soloRace } from './fixtures/results';
import { screens } from './fixtures/screens';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';

test.describe('Screen readers', () => {
  test(
    'the custom ride says each step once, as it starts, and not its countdown (L2-141 AC2)',
    { tag: '@critical' },
    async ({ page, bluetooth }) => {
      const ride = await startCustomRide(page, bluetooth);
      const app = new AppDocument(page);

      await page.clock.fastForward('05:00');
      await page.clock.runFor(1000);

      await expect(ride.intervalName).toHaveText('Work Round 1 of 8');
      await expect(app.announcement).toHaveText('Work, round 1 of 8: 0:30 at level 24');
      await expect(ride.countdown).toHaveAttribute('role', 'timer');
      await expect(ride.countdown).not.toHaveAttribute('aria-live');
    },
  );

  test('the class ride says each step once, as it starts (L2-141 AC2)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const ride = await startClassRide(page, bluetooth, api);
    const app = new AppDocument(page);

    await page.clock.fastForward('05:00');
    // The live region takes its words a beat after the step (100 ms), so a screen reader hears it as a change.
    await page.clock.runFor(1000);

    await expect(ride.segmentKind).toHaveText('Work');
    await expect(app.announcement).toHaveText('Work, 0:30');
  });

  test('Results says the result as it opens (L2-141 AC2)', async ({ page }) => {
    await openResults(page, soloRace(1598));

    await expect(new AppDocument(page).announcement).toHaveText(
      'Race results: You finished 26:38. +110 XP earned.',
    );
  });
});

test.describe('Dialogs', () => {
  test('a dialog takes the focus and keeps it, the app behind is inert, and closing gives the focus back (L2-141 AC3)', async ({
    page,
    bluetooth,
  }) => {
    const ride = await startCustomRide(page, bluetooth);
    const app = new AppDocument(page);

    await ride.library.click();
    await page.clock.runFor(100);
    await expect(ride.leave).toBeVisible();

    await expect(app.app).toHaveAttribute('inert');
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      expect(await AppDocument.holdsFocus(ride.leave)).toBe(true);
    }

    await page.keyboard.press('Escape');
    await page.clock.runFor(100);
    await expect(ride.leave).toHaveCount(0);
    await expect(app.app).not.toHaveAttribute('inert');
    await expect(ride.library).toBeFocused();
  });
});

test.describe('Reduced motion', () => {
  for (const [screen, open] of Object.entries(screens)) {
    test(`nothing on ${screen} moves when the device asks for reduced motion (L2-142 AC2)`, async ({
      page,
      bluetooth,
      api,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(await open({ page, bluetooth, api })).toBeAttached();

      expect(await new AppDocument(page).moving()).toEqual([]);
    });
  }
});
