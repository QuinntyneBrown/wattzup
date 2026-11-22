// Acceptance test
// Traces to: L2-099 AC4; L2-100 AC2, AC3; L2-101 AC1, AC2, AC3; L2-102 AC1, AC2; L2-027 AC1
// Description: Start ride opens the custom ride at /profile/custom/ride, where the plan drives the target resistance:
// the header with the bike, the workout and the clock; Power and Cadence against the segment's target and aim; the
// interval card counting down the segment with its round and what comes next. A refused plan cannot start.
//
// Given Custom workout with GCN 30-min HIIT, when the rider presses Start ride, then the ride opens at 0:00 on the
// warm-up, its header reads the bike, "HIIT · 8 × 0:30 · 3:00 → 1:30 recover" and "0:00 / 30:00", and level 8 is sent.
// Given 6:52, when the telemetry shows, then the clock, the interval card (Recover, Round 1 of 8, 1:38, 46 %, Next:
// Work 0:30 at level 24) and level 6 sent follow the plan; at 72 rpm and level 6 Power reads 107 W on its 107 W target.
// Given the cool-down, when the card shows, then its next line reads "Last stretch".
// Given flat resistance, when it starts, then the workout reads "Flat · Level 12 · 30 min" and level 12 is sent.
// Given the workout link, when it is chosen, then Custom workout opens with the ride's plan.
// Given a plan of 5 seconds, when Start ride shows, then it is disabled with the reason under it.
import {
  ECHELON_NOTIFY,
  resistanceFrame,
  targetResistanceWrite,
  workoutFrame,
} from './fixtures/echelon';
import { startCustomRide } from './fixtures/custom-ride';
import { expect, test } from './fixtures/test';
import { CustomWorkoutPage } from './pages/custom-workout.page';

const isTarget = (hex: string): boolean => hex.startsWith('F0 B1 ');

test(
  'Start ride opens the custom ride at 0:00 on the warm-up, and sends its level (L2-099 AC4, L2-101 AC1, L2-102 AC1, L2-027 AC1)',
  { tag: '@critical' },
  async ({ page, bluetooth }) => {
    const ride = await startCustomRide(page, bluetooth);

    await expect(page).toHaveURL('/profile/custom/ride');
    await expect(ride.lockup).toBeVisible();
    await expect(ride.bike).toContainText('Echelon EX-5s');
    await expect(ride.workout).toHaveText('HIIT · 8 × 0:30 · 3:00 → 1:30 recover — edit workout');
    await expect(ride.clock).toHaveText('0:00 / 30:00');
    await expect(ride.clock).toHaveAccessibleName('Elapsed 0:00 of 30:00');
    await expect(ride.fullScreen).toBeVisible();
    await expect(ride.intervalName).toHaveText('Warm-up');
    await expect(ride.countdown).toHaveText('5:00');
    await expect(ride.next).toHaveText('Next: Work 0:30 at level 24');
    await expect(ride.powerFoot).toHaveText('Target 143 W');
    await expect(ride.cadenceFoot).toHaveText('Aim for 80');
  },
);

test('at 6:52 the clock, the interval card, the readouts and the bike follow the plan (L2-100 AC2, L2-102 AC1)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  const sent = () => bluetooth.writes().map((write) => write.hex);

  await page.clock.fastForward('06:52');
  await page.clock.runFor(100);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await bluetooth.notify(ECHELON_NOTIFY, workoutFrame(72));
  await page.clock.runFor(100);

  await expect(ride.clock).toHaveText('6:52 / 30:00');
  await expect(ride.clock).toHaveAccessibleName('Elapsed 6:52 of 30:00');
  await expect(ride.intervalName).toHaveText('Recover Round 1 of 8');
  await expect(ride.intervalRound).toHaveText('Round 1 of 8');
  await expect(ride.countdown).toHaveText('1:38');
  await expect(ride.countdown).toHaveAccessibleName('1:38 left in this interval');
  await expect(ride.intervalBar).toHaveAttribute('aria-valuenow', '46');
  await expect(ride.next).toHaveText('Next: Work 0:30 at level 24');
  await expect(ride.power).toHaveText('107');
  await expect(ride.powerFoot).toHaveText('Target 107 W On target');
  await expect(ride.cadence).toHaveText('72');
  await expect(ride.cadenceFoot).toHaveText('Aim for 72');
  // Like a tab shown again, the late tick sends only the current segment's level, not the effort it passed.
  await expect.poll(() => sent().filter(isTarget)).toEqual([8, 6].map(targetResistanceWrite));
});

test('the last segment reads Last stretch (L2-102 AC2)', async ({ page, bluetooth }) => {
  const ride = await startCustomRide(page, bluetooth);

  await page.clock.fastForward('25:00');
  await page.clock.runFor(100);

  await expect(ride.intervalName).toHaveText('Cool-down');
  await expect(ride.countdown).toHaveText('5:00');
  await expect(ride.next).toHaveText('Last stretch');
});

test('flat resistance rides one steady level (L2-101 AC2, L2-102 AC2)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth, {
    setUp: (custom) => custom.flat.click(),
    first: 12,
  });

  await expect(ride.workout).toHaveText('Flat · Level 12 · 30 min — edit workout');
  await expect(ride.intervalName).toHaveText('Steady');
  await expect(ride.intervalRound).toHaveCount(0);
  await expect(ride.countdown).toHaveText('30:00');
  await expect(ride.next).toHaveText('Last stretch');
  await expect(ride.cadenceFoot).toHaveText('Aim for 85');
});

test('the workout link opens Custom workout with the ride’s plan (L2-101 AC3)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth, {
    setUp: (custom) => custom.ladder('Remove round 1').click(),
  });

  await ride.workout.click();
  await page.clock.runFor(100);

  const custom = new CustomWorkoutPage(page);
  await expect(page).toHaveURL('/profile/custom');
  await expect(custom.rounds).toHaveCount(7);
  await expect(custom.plan('GCN 30-min HIIT · edited')).toHaveAttribute('aria-pressed', 'true');
});

test('a plan Telo Ride refuses cannot start (L2-100 AC3)', async ({ page }) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();
  await expect(custom.startRide).toBeEnabled();

  for (let n = 8; n > 1; n--) await custom.ladder(`Remove round ${n}`).click();
  for (let i = 0; i < 5; i++) await custom.ladder('Shorter effort 1').click();
  for (let i = 0; i < 5; i++) await custom.less(custom.warmUp).click();
  for (let i = 0; i < 6; i++) await custom.less(custom.coolDown).click();

  await expect(custom.previewTotal).toHaveText('0:05');
  await expect(custom.startRide).toBeDisabled();
  await expect(custom.startRide).toHaveAccessibleDescription(
    'The ride needs to last 1 to 180 minutes.',
  );
  await expect(custom.startBlocked).toHaveText('The ride needs to last 1 to 180 minutes.');

  await custom.videoSwitch.click();
  await custom.more(custom.warmUp).click();
  await expect(custom.startRide).toBeEnabled();
  await custom.videoLink.fill('https://vimeo.com/76979871');
  await expect(custom.startRide).toBeDisabled();
  await expect(custom.startBlocked).toHaveText('Fix the YouTube link to start.');
});
