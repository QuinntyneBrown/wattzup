// Acceptance test
// Traces to: L2-103 AC1, AC2, AC4; L2-088 AC1, AC5
// Description: a custom ride with a video opens on the Video tab: the workout's video plays locked to the ride clock at
// its offset, captioned "In sync · pauses with the ride", over the progress strip. "Power vs. plan" swaps in the trace
// while the video plays on behind it. The shared fixture answers YouTube with a fake player on the page's clock.
//
// Given a workout with the GCN video at 0:12, when the ride starts, then the tab list reads Video and Power vs. plan,
// Video selected, one player plays QUoToFsMNig without controls from 0:12, and the strip reads "Ride progress: 0:00 of
// 30:00".
// Given 6:52, when the ride shows, then the video is at 7:04 and the strip reads "Ride progress: 6:52 of 30:00".
// Given "Power vs. plan" chosen with the arrow key, when it shows, then the trace and its legend show, and the video
// plays on, hidden.
import { startCustomRide } from './fixtures/custom-ride';
import { expect, test } from './fixtures/test';

test('a ride with a video plays it at the ride clock plus its offset, over the progress strip (L2-103 AC1, AC2, AC4, L2-088 AC1)', async ({
  page,
  bluetooth,
  youtube,
}) => {
  const ride = await startCustomRide(page, bluetooth, {
    setUp: async (custom) => {
      await custom.videoSwitch.click();
      await custom.offset.fill('0:12.0');
      await custom.offset.press('Tab');
      await expect(custom.offset).toHaveValue('0:12.0');
    },
  });
  const live = async () => (await youtube.players()).filter((player) => !player.destroyed);

  await expect(ride.tabs).toHaveText(['Video', 'Power vs. plan']);
  await expect(ride.videoTab).toHaveAttribute('aria-selected', 'true');
  await expect(ride.sync).toHaveText('In sync · pauses with the ride');
  await expect(ride.progress).toHaveAccessibleName('Ride progress: 0:00 of 30:00');
  await expect.poll(async () => (await live()).length).toBe(1);
  await page.clock.runFor(100);
  expect(await live()).toEqual([
    expect.objectContaining({
      videoId: 'QUoToFsMNig',
      playerVars: expect.objectContaining({ controls: 0 }),
    }),
  ]);
  expect(await youtube.time()).toBeCloseTo(12, 0);

  await page.clock.fastForward('06:52');
  await page.clock.runFor(100);
  await expect(ride.progress).toHaveAccessibleName('Ride progress: 6:52 of 30:00');
  expect(await youtube.time()).toBeCloseTo(424, 0);

  await ride.videoTab.focus();
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(100);
  await expect(ride.chartTab).toHaveAttribute('aria-selected', 'true');
  await expect(ride.chartTab).toBeFocused();
  await expect(ride.trace).toBeVisible();
  await expect(ride.legend).toHaveText(['Actual', 'Work target', 'Recover']);
  await expect(ride.progress).toBeHidden();
  expect(await live()).toEqual([expect.objectContaining({ playing: true })]);
});
