// Acceptance test
// Traces to: L2-060 AC3
// Description: when places swap, the board reorders on the race's tick, at most once a second, and each row that moves
// slides from its old place over 150 ms; with reduced motion the rows move without sliding.
import type { Page } from '@playwright/test';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

/** Records every slide a board row starts: its duration and how far it travels. */
const recordSlides = (page: Page) =>
  page.addInitScript(() => {
    const slides: { duration: unknown; from: unknown }[] = [];
    (window as unknown as { slides: typeof slides }).slides = slides;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, frames, options) {
      if (this.classList.contains('race-board__row'))
        slides.push({
          duration: typeof options === 'object' ? options.duration : options,
          from: Array.isArray(frames) ? (frames[0] as { translate?: unknown }).translate : null,
        });
      return animate.call(this, frames, options);
    };
  });

const slides = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { slides: { duration: unknown; from: unknown }[] }).slides,
  );

/** Rides 661 W for two minutes from a standing start, so the rider passes the pack one by one. */
async function rideThroughThePack(page: Page, bluetooth: Parameters<typeof startRace>[1]) {
  await page.clock.runFor(30_000);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(32));
  for (let second = 0; second < 120; second += 4) {
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(120));
    await page.clock.runFor(4000);
  }
}

test('a row that moves slides from its old place over 150 ms (L2-060 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  await recordSlides(page);
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');
  await expect(race.board).toBeVisible();

  await rideThroughThePack(page, bluetooth);

  await expect(race.you).toHaveText(/^1You$/);
  const started = await slides(page);
  expect(started.length).toBeGreaterThan(0);
  for (const slide of started) {
    expect(slide.duration).toBe(150);
    expect(slide.from).toMatch(/^0 -?\d+(\.\d+)?px$/);
  }
});

test('with reduced motion the rows move without sliding (L2-060 AC3)', async ({
  page,
  bluetooth,
  api,
}) => {
  await recordSlides(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');

  await rideThroughThePack(page, bluetooth);

  await expect(race.you).toHaveText(/^1You$/);
  expect(await slides(page)).toEqual([]);
});
