// L2-064. A jogger runs up the east steps and holds still on pause.
import { newRiderProgress } from './fixtures/api';
import { artMuseumCourseMap } from './fixtures/course';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { MapSelectPage } from './pages/map-select.page';
import { RaceSetupPage } from './pages/race-setup.page';
import { RacePage } from './pages/race.page';

for (const cue of ['jogger', 'flag'] as const) {
  test(
    'the Philadelphia ' + cue + ' moves and pauses with the race',
    async ({ api, bluetooth, page, worldRide }) => {
      api.answer('GET', '/api/maps', [artMuseumCourseMap]);
      api.answer('GET', '/api/progress', {
        ...newRiderProgress,
        openMapIds: [artMuseumCourseMap.id],
      });
      await worldRide.pin('low', 'webgl2');
      await bluetooth.remember(echelonBike);
      const race = new RacePage(page);
      const maps = new MapSelectPage(page);
      await maps.open();
      await worldRide.startAt(cue === 'jogger' ? 1840 : 230);
      const row = maps.row(artMuseumCourseMap.name);
      await row.root.click();
      const setup = new RaceSetupPage(page);
      await setup.mode('Your best time').click();
      await setup.start.click();
      await expect(race.backend).toBeVisible();
      const read = () =>
        cue === 'jogger' ? worldRide.joggerHeight() : worldRide.flagDisplacement();
      const samples: number[] = [];
      await expect
        .poll(async () => {
          const metres = await read();
          if (metres !== null) samples.push(metres);
          return Math.max(...samples) - Math.min(...samples);
        })
        .toBeGreaterThan(0.09);
      await race.pause.click();
      await expect(race.resume).toBeVisible();
      const held = await read();
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
          ),
      );
      expect(await read()).toBe(held);
      await race.resume.click();
      await expect.poll(read).not.toBe(held);
    },
  );
}
