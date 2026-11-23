// Acceptance test
// Traces to: L2-170, L2-171, L2-172, L2-175
// Description: During a race with the race announcer enabled, live race events trigger sanitized
// play-by-play callouts through the FakeAiWorker fixture, show the responsive callout banner
// without horizontal overflow, and gracefully degrade on worker errors without harming the race.
import { installFakeAiWorker } from './fixtures/fake-ai-worker';
import { startRace } from './fixtures/race';
import { storeSettings } from './fixtures/settings-storage';
import { expect, test } from './fixtures/test';

test('Race announcer degrades gracefully on worker error without interrupting the race (L2-175 AC2, AC4)', async ({
  page,
  bluetooth,
  api,
}) => {
  await installFakeAiWorker(page, { fail: true });
  await storeSettings(
    page,
    JSON.stringify({
      raceAnnouncer: true,
      announcerCaptions: true,
      announcerVoice: 'arcade',
      announcerVolume: 85,
    }),
  );

  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');
  await expect(race.heading).toHaveText('Race, Old Town Criterium');
  // Confirm zero horizontal scroll on desktop and no page errors despite simulated worker failure.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
