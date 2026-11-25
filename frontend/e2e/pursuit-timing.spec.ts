// L2-064. The trackside timing board follows the pursuit clock on the moving oval.
import { newRiderProgress } from './fixtures/api';
import { aguascalientesCourseMap } from './fixtures/course';
import { ECHELON_NOTIFY, echelonBike, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { startRace, stepUntil } from './fixtures/race';
import { RacePage } from './pages/race.page';

test('a rider passes a lap board with a changing pursuit time', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  const map = aguascalientesCourseMap;
  api.answer('GET', '/api/maps', [map]);
  api.answer('GET', '/api/progress', { ...newRiderProgress, openMapIds: [map.id] });
  await worldRide.pin('low', 'webgl2');
  await bluetooth.remember(echelonBike);
  // Read the lettering actually painted onto the arena's timing texture.
  await page.addInitScript(() => {
    const painted = new Set<string>();
    Object.assign(window, { pursuitLettering: painted });
    const paint = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      if (text.startsWith('LAP ') || text.startsWith('TIME ')) painted.add(text);
      paint.call(this, text, ...args);
    };
  });
  const race = new RacePage(page);
  await race.open(map.id, 'mode=solo');
  await expect(race.backend).toBeVisible();
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
  await expect
    .poll(() =>
      page.evaluate(() => {
        const words = [
          ...(window as unknown as { pursuitLettering: Set<string> }).pursuitLettering,
        ];
        return (
          words.includes('LAP 1') && words.filter((word) => word.startsWith('TIME ')).length >= 2
        );
      }),
    )
    .toBe(true);
});

test('the solo pursuit starts with the opponent across the infield', async ({
  api,
  bluetooth,
  page,
  worldRide,
}) => {
  await worldRide.pin('low', 'webgl2');
  const race = await startRace(page, bluetooth, api, aguascalientesCourseMap.id, 'mode=solo', {
    catalogue: [aguascalientesCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  await page.clock.runFor(32);
  expect(await worldRide.ghostSeparation()).toBeGreaterThan(40);
});
