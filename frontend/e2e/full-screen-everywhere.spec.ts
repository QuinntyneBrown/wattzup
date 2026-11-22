import { withoutFullscreen } from './fixtures/fullscreen';
import { screens } from './fixtures/screens';
import { expect, test } from './fixtures/test';
import { AppDocument } from './pages/app-document';

// Slice 24.2, Full screen (L2-144): every page header the mocks draw offers Full screen, from Home to a race, a class
// ride and Results. Sign-in's mock has no header button, so it has none.
//
// Given any screen but sign-in, when the rider presses "Full screen" in its header, then the app fills the display and
//   the button reads "Exit full screen", which leaves it (AC1).
// Given a browser without the Fullscreen API, when any screen shows, then no header offers it (AC2).

const offering = Object.entries(screens).filter(([screen]) => screen !== 'sign-in');

for (const [screen, open] of offering) {
  test(`${screen} offers Full screen in its header, and Exit full screen leaves it (L2-144 AC1)${screen === 'a race' ? ' @critical' : ''}`, async ({
    page,
    bluetooth,
    api,
  }) => {
    await (await open({ page, bluetooth, api })).waitFor({ state: 'attached' });
    // A ride's fake clock is paused, and a zoneless app renders on a timer: let time run as it does for a rider.
    await page.clock.resume();
    const app = new AppDocument(page);

    await app.fullScreen.click();
    await expect.poll(() => app.inFullScreen()).toBe(true);
    await expect(app.fullScreen).toHaveCount(0);

    await app.exitFullScreen.click();
    await expect.poll(() => app.inFullScreen()).toBe(false);
    await expect(app.fullScreen).toBeVisible();
  });
}

for (const [screen, open] of offering) {
  test(`${screen} offers no Full screen where the browser has no Fullscreen API (L2-144 AC2)`, async ({
    page,
    bluetooth,
    api,
  }) => {
    await withoutFullscreen(page);
    await expect(await open({ page, bluetooth, api })).toBeAttached();
    await expect(new AppDocument(page).fullScreen).toHaveCount(0);
  });
}
