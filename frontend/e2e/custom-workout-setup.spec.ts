// Acceptance test
// Traces to: L2-094 AC1, AC2, AC3; L2-095 AC1 to AC7; L2-096 AC1, AC2; L2-097 AC1, AC2
// Description: Custom workout opens from Profile's Settings at /profile/custom with the training header, Set up your
// ride and the training mode, starting from the GCN 30-min HIIT plan. Its ladder's rounds step within their bounds, are
// added, removed and made the same, and the chosen plan then reads edited; another plan loads its rounds. The levels,
// warm-up and cool-down read and step; Flat resistance swaps the plans and ladder for its level, duration and cadence.
//
// Given Profile, when the rider opens Custom workout, then the header, the words and the GCN 30-min HIIT plan show.
// Given a round, when its effort or recovery steps, then it moves by 0:05 or 0:15 within its bounds and the plan reads
// edited; Add round copies the last round, Remove round removes one, Make every round the same copies round 1.
// Given another plan, when it is chosen, then its rounds load and the plan no longer reads edited.
// Given the levels, warm-up and cool-down, when they show, then they read 24 / 32, 6 / 32, 5:00 and 6:00 and step by
// 1:00 within 0:00 to 20:00.
// Given Flat resistance, when it is chosen, then the plans and ladder go, and the level, duration and cadence goal show
// and step by 5 within their bounds.
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { CustomWorkoutPage } from './pages/custom-workout.page';
import { ProfilePage } from './pages/profile.page';

const GCN_RECOVERIES = ['3:00', '2:30', '2:30', '2:00', '2:00', '1:30', '1:30', 'Into cool-down'];

test('Custom workout opens from Profile on the GCN 30-min HIIT plan (L2-094 AC1 to AC3, L2-095 AC1, AC2, L2-096 AC1, AC2) @critical', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const profile = new ProfilePage(page);
  await profile.open();
  await profile.customWorkout.click();

  const custom = new CustomWorkoutPage(page);
  await expect(page).toHaveURL('/profile/custom');
  await expect(custom.lockup).toBeVisible();
  await expect(custom.bike).toHaveText('Echelon EX-5s');
  await expect(custom.fullScreen).toBeVisible();
  await expect(custom.heading).toHaveText('Set up your ride');
  await expect(custom.lead).toHaveText("Telo Ride drives the bike's resistance for you. Pick how.");
  await expect(custom.modes.getByRole('radio')).toHaveCount(2);
  await expect(custom.hiit).toHaveAttribute('aria-checked', 'true');
  await expect(custom.flat).toHaveAttribute('aria-checked', 'false');
  await expect(custom.modeBodies).toHaveText([
    'Hard and easy efforts on repeat. Resistance switches at every interval.',
    'One level, held the whole ride. You set the pace with your legs.',
  ]);
  await expect(custom.plans).toHaveText([
    'GCN 30-min HIIT',
    'Tabata',
    '40 / 20',
    'Minute on',
    'Long climbs',
  ]);
  await expect(custom.plan('GCN 30-min HIIT')).toHaveAttribute('aria-pressed', 'true');
  await expect(custom.ladderTitle).toHaveText('GCN 30-min HIIT · GCN Training');
  await expect(custom.rounds).toHaveCount(8);
  for (const [i, recovery] of GCN_RECOVERIES.entries()) {
    await expect(custom.round(i + 1).effort).toHaveText('0:30');
    await expect(custom.round(i + 1).recovery).toHaveText(recovery);
  }
  await expect(custom.workLevel).toHaveValue('24');
  await expect(custom.workLevelValue).toHaveText('24 / 32');
  await expect(custom.recoverLevelValue).toHaveText('6 / 32');
  await expect(custom.stepperValue(custom.warmUp)).toHaveText('5:00');
  await expect(custom.stepperValue(custom.coolDown)).toHaveText('6:00');

  await custom.close.click();
  await expect(page).toHaveURL('/profile');
});

test('the ladder steps, adds, removes and evens out rounds, and the plan then reads edited (L2-095 AC3 to AC6)', async ({
  page,
}) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();

  await custom.ladder('Longer effort 1').click();
  await expect(custom.round(1).effort).toHaveText('0:35');
  await expect(custom.plan('GCN 30-min HIIT · edited')).toHaveAttribute('aria-pressed', 'true');
  await custom.ladder('Shorter recovery 2').click();
  await expect(custom.round(2).recovery).toHaveText('2:15');

  // Effort stops at 0:05.
  for (let i = 0; i < 5; i++) await custom.ladder('Shorter effort 3').click();
  await expect(custom.round(3).effort).toHaveText('0:05');
  await expect(custom.ladder('Shorter effort 3')).toBeDisabled();

  // A new round copies the last; the one before it then recovers into the next.
  await custom.addRound.click();
  await expect(custom.rounds).toHaveCount(9);
  await expect(custom.round(8).recovery).toHaveText('1:30');
  await expect(custom.round(9).effort).toHaveText('0:30');
  await expect(custom.round(9).recovery).toHaveText('Into cool-down');

  await custom.ladder('Remove round 1').click();
  await expect(custom.rounds).toHaveCount(8);
  await expect(custom.round(1).recovery).toHaveText('2:15');

  await custom.makeSame.click();
  for (let n = 1; n <= 7; n++) {
    await expect(custom.round(n).effort).toHaveText('0:30');
    await expect(custom.round(n).recovery).toHaveText('2:15');
  }
});

test('another plan loads its rounds, and is not edited (L2-095 AC1, AC7)', async ({ page }) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();
  await custom.ladder('Longer effort 1').click();

  await custom.plan('Tabata').click();

  await expect(custom.plan('Tabata')).toHaveAttribute('aria-pressed', 'true');
  await expect(custom.plan('GCN 30-min HIIT')).toHaveAttribute('aria-pressed', 'false');
  await expect(custom.ladderTitle).toHaveText('Tabata · Telo Ride');
  await expect(custom.rounds).toHaveCount(8);
  await expect(custom.round(1).effort).toHaveText('0:20');
  await expect(custom.round(1).recovery).toHaveText('0:15');
  await expect(custom.ladder('Shorter recovery 1')).toBeDisabled();

  await custom.plan('Long climbs').click();
  await expect(custom.ladderTitle).toHaveText('Long climbs · Telo Ride');
  await expect(custom.rounds).toHaveCount(4);
  await expect(custom.round(1).effort).toHaveText('5:00');
  await expect(custom.ladder('Longer effort 1')).toBeDisabled();
});

test('the levels, warm-up and cool-down change within their bounds (L2-096 AC1, AC2)', async ({
  page,
}) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();

  await custom.workLevel.fill('28');
  await expect(custom.workLevelValue).toHaveText('28 / 32');
  await expect(custom.workLevel).toHaveAttribute('min', '1');
  await expect(custom.workLevel).toHaveAttribute('max', '32');

  await custom.more(custom.warmUp).click();
  await expect(custom.stepperValue(custom.warmUp)).toHaveText('6:00');
  await expect(custom.less(custom.warmUp)).toHaveAccessibleName('Less Warm-up');
  for (let i = 0; i < 6; i++) await custom.less(custom.coolDown).click();
  await expect(custom.stepperValue(custom.coolDown)).toHaveText('0:00');
  await expect(custom.less(custom.coolDown)).toBeDisabled();
});

test('Flat resistance swaps the plans and ladder for its level, duration and cadence goal (L2-097 AC1, AC2)', async ({
  page,
}) => {
  const custom = new CustomWorkoutPage(page);
  await custom.open();

  // The training mode is one radio group: the arrow keys move the choice.
  await custom.hiit.focus();
  await page.keyboard.press('ArrowRight');

  await expect(custom.flat).toHaveAttribute('aria-checked', 'true');
  await expect(custom.flat).toBeFocused();
  await expect(custom.plans).toHaveCount(0);
  await expect(custom.rounds).toHaveCount(0);
  await expect(custom.flatLevelValue).toHaveText('12 / 32');
  await expect(custom.stepperValue(custom.duration)).toHaveText('30 min');
  await expect(custom.stepperValue(custom.cadenceGoal)).toHaveText('85 rpm');
  await expect(custom.note).toHaveText(
    'You can still nudge the level mid-ride from the dashboard.',
  );

  await custom.more(custom.duration).click();
  await expect(custom.stepperValue(custom.duration)).toHaveText('35 min');
  await custom.less(custom.cadenceGoal).click();
  await expect(custom.stepperValue(custom.cadenceGoal)).toHaveText('80 rpm');
  for (let i = 0; i < 6; i++) await custom.less(custom.duration).click();
  await expect(custom.stepperValue(custom.duration)).toHaveText('5 min');
  await expect(custom.less(custom.duration)).toBeDisabled();

  await custom.hiit.click();
  await expect(custom.rounds).toHaveCount(8);
});
