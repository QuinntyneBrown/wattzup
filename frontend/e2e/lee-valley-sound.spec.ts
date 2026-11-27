import { leeValleyCourseMap } from './fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { WorldMusic } from './fixtures/world-music';

test('the stands are audible during racing and the lap bell sounds on approach', async ({
  page,
  api,
  bluetooth,
}) => {
  const music = await WorldMusic.install(page);
  const race = await startRace(page, bluetooth, api, leeValleyCourseMap.id, 'mode=solo', {
    catalogue: [leeValleyCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  await expect.poll(() => music.played()).toContain('music/lee-valley-stands.ogg');
  expect(await music.played()).not.toContain('music/lee-valley-bell.ogg');
  while (parseFloat((await race.distance.textContent())!) < 0.24) {
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
    await page.clock.fastForward(1000);
  }
  await expect.poll(() => music.played()).toContain('music/lee-valley-bell.ogg');
  await race.pause.click();
  await stepUntil(page, () => expect(race.resume).toBeVisible({ timeout: 50 }));
  await expect.poll(async () => (await music.tracks()).every((t) => t.paused)).toBe(true);
});
