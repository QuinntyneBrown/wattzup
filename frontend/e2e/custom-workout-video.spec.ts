// Acceptance test
// Traces to: L2-098 AC1 to AC5; L2-099 AC1, AC5
// Description: "Ride along to a video" on Custom workout: on, it shows the YouTube link (GCN Training's 30 Minute HIIT
// Cardio to start with), a preview player parked at the offset, "Ride 0:00 starts at" with its half-second nudges,
// "Use video's current time", "Check" and the help text, and Your ride reads "Synced from" the offset. A link that is
// not YouTube's is marked invalid with its message and no player; off, the section closes and Video reads Off.
//
// Given the switch, when it is turned on, then the link, the player, the offset, its buttons and the help text show,
// and Video reads "Synced from 0:00.0".
// Given the preview at 0:12.0, when the rider uses the video's current time, then the offset reads 0:12.0, Video reads
// "Synced from 0:12.0", and Check seeks the preview there.
// Given the nudges, when the rider presses them, then the offset moves by half a second and never below 0.
// Given a link that is not YouTube's, when it is typed, then the field is invalid with its message and Video reads
// "Link needed"; a youtu.be link is valid again and loads its video.
// Given the switch on, when it is turned off, then the section closes, the player goes and Video reads "Off".
import { expect, test } from './fixtures/test';
import { CustomWorkoutPage } from './pages/custom-workout.page';

const HELP =
  'Scrub the preview past the intro to the moment the warm-up begins, then use that time. The video skips to it when you start, and pauses and resumes with the ride.';

test('Ride along to a video syncs the preview player to the ride (L2-098 AC1, AC4, AC5, L2-099 AC1)', async ({
  page,
  youtube,
}) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();
  await expect(custom.videoSwitch).toHaveAttribute('aria-checked', 'false');
  await expect(custom.videoLink).toHaveCount(0);

  await custom.videoSwitch.click();

  await expect(custom.videoSwitch).toHaveAttribute('aria-checked', 'true');
  await expect(custom.videoLink).toHaveValue('https://www.youtube.com/watch?v=QUoToFsMNig');
  await expect(custom.offset).toHaveValue('0:00.0');
  await expect(custom.videoHelp).toHaveText(HELP);
  await expect(custom.fact('Video')).toHaveText('Synced from 0:00.0');
  await expect
    .poll(async () => (await youtube.players()).map((player) => player.videoId))
    .toEqual(['QUoToFsMNig']);
  const [player] = await youtube.players();
  // Parked at the offset with YouTube's controls, waiting for the rider.
  expect(player!.playerVars).toMatchObject({ controls: 1, start: 0 });
  expect(player!.playing).toBe(false);

  await youtube.jump(12.04);
  await custom.useCurrentTime.click();
  await expect(custom.offset).toHaveValue('0:12.0');
  await expect(custom.fact('Video')).toHaveText('Synced from 0:12.0');

  await youtube.jump(40);
  await custom.check.click();
  await expect.poll(() => youtube.time()).toBe(12);
});

test('the offset moves by half a second, never below 0, and takes a typed time (L2-098 AC3)', async ({
  page,
}) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();
  await custom.videoSwitch.click();

  await expect(custom.earlier).toBeDisabled();
  await custom.later.click();
  await custom.later.click();
  await expect(custom.offset).toHaveValue('0:01.0');
  await custom.earlier.click();
  await expect(custom.offset).toHaveValue('0:00.5');

  await custom.offset.fill('1:02.5');
  await custom.offset.press('Enter');
  await expect(custom.fact('Video')).toHaveText('Synced from 1:02.5');
  await custom.offset.fill('soon');
  await custom.offset.press('Enter');
  await expect(custom.offset).toHaveValue('1:02.5');
});

test('a link that is not YouTube’s is invalid with its message, and off closes the section (L2-098 AC2, L2-099 AC5)', async ({
  page,
  youtube,
}) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();
  await custom.videoSwitch.click();
  await expect.poll(async () => (await youtube.players()).length).toBe(1);

  await custom.videoLink.fill('https://vimeo.com/76979871');

  await expect(custom.videoLink).toHaveAttribute('aria-invalid', 'true');
  await expect(custom.videoLinkError).toHaveText(
    "That doesn't look like a YouTube link. Paste a youtube.com or youtu.be link.",
  );
  await expect(custom.videoLink).toHaveAccessibleDescription(
    "That doesn't look like a YouTube link. Paste a youtube.com or youtu.be link.",
  );
  await expect(custom.fact('Video')).toHaveText('Link needed');
  await expect
    .poll(async () => (await youtube.players()).map((player) => player.destroyed))
    .toEqual([true]);

  await custom.videoLink.fill('https://youtu.be/dQw4w9WgXcQ');
  await expect(custom.videoLink).not.toHaveAttribute('aria-invalid', 'true');
  await expect(custom.videoLinkError).toHaveCount(0);
  await expect.poll(async () => (await youtube.players()).at(-1)?.videoId).toBe('dQw4w9WgXcQ');

  await custom.videoSwitch.click();
  await expect(custom.videoLink).toHaveCount(0);
  await expect(custom.fact('Video')).toHaveText('Off');
  await expect
    .poll(async () => (await youtube.players()).every((player) => player.destroyed))
    .toBe(true);
});
