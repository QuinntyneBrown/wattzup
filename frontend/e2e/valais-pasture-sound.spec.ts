import { valaisCourseMap } from './fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { WorldMusic } from './fixtures/world-music';

// The opening pasture holds the first small herd before the main Hérens meadow.
test('the Valais pasture bells grow louder on approach and pause with the ride', async ({
  page,
  api,
  bluetooth,
}) => {
  test.slow();
  const music = await WorldMusic.install(page);
  const race = await startRace(page, bluetooth, api, valaisCourseMap.id, 'mode=solo', {
    catalogue: [valaisCourseMap],
    world: true,
  });
  async function rideTo(km: number): Promise<void> {
    while (parseFloat((await race.distance.textContent())!) < km) {
      await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
      await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
      await page.clock.fastForward(1000);
    }
  }
  expect(await music.played()).toEqual([]);
  await rideTo(0.13);
  await expect.poll(() => music.played()).toContain('music/valais-cowbells.ogg');
  const approach = (await music.tracks())[0].volume;
  await rideTo(0.2);
  await expect.poll(async () => (await music.tracks())[0].volume).toBeGreaterThan(approach);
  await race.pause.click();
  await page.clock.runFor(100);
  await expect(race.resume).toBeVisible();
  await expect.poll(async () => (await music.tracks())[0].paused).toBe(true);
  await race.resume.click();
  await rideTo(0.39);
  await expect.poll(async () => (await music.tracks())[0].paused).toBe(true);
});
