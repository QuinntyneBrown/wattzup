import { blueMountainsCourseMap } from './fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { WorldMusic } from './fixtures/world-music';

// Given a rider climbing towards Roots Yard, when the sound system comes into earshot,
// its world track grows louder, pauses with the ride, and falls silent beyond the yard.
test('the Roots Yard sound system follows the rider through the bend', async ({
  page,
  api,
  bluetooth,
}) => {
  test.slow();
  const music = await WorldMusic.install(page);
  const race = await startRace(page, bluetooth, api, blueMountainsCourseMap.id, 'mode=solo', {
    catalogue: [blueMountainsCourseMap],
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
  await rideTo(1.46);
  await expect.poll(() => music.played()).toContain('music/bluemountains.ogg');
  const approach = (await music.tracks())[0].volume;
  await rideTo(1.53);
  await expect.poll(async () => (await music.tracks())[0].volume).toBeGreaterThan(approach);
  await race.pause.click();
  await page.clock.runFor(100);
  await expect(race.resume).toBeVisible();
  await expect.poll(async () => (await music.tracks())[0].paused).toBe(true);
  await race.resume.click();
  await rideTo(1.69);
  await expect.poll(async () => (await music.tracks())[0].paused).toBe(true);
});
