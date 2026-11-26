import { yosemiteValleyCourseMap } from './fixtures/course';
import { ECHELON_NOTIFY, resistanceFrame, workoutFrame } from './fixtures/echelon';
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';
import { WorldMusic } from './fixtures/world-music';

test('the falls grow audible near the base and fall silent when the rider pauses', async ({
  page,
  api,
  bluetooth,
}) => {
  test.setTimeout(180_000);
  const music = await WorldMusic.install(page);
  const race = await startRace(page, bluetooth, api, yosemiteValleyCourseMap.id, 'mode=solo', {
    catalogue: [yosemiteValleyCourseMap],
    world: true,
  });
  await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));
  expect(await music.played()).not.toContain('music/yosemite-falls.ogg');
  while (parseFloat((await race.distance.textContent())!) < 9.56) {
    await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(18));
    await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(90));
    await page.clock.fastForward(1000);
  }
  await expect.poll(() => music.played()).toContain('music/yosemite-falls.ogg');
  await race.pause.click();
  await stepUntil(page, () => expect(race.resume).toBeVisible({ timeout: 50 }));
  await expect.poll(async () => (await music.tracks()).every((t) => t.paused)).toBe(true);
});
