// Acceptance test
// Traces to: L2-028 AC1 to AC4; L2-029 AC1, AC2, AC4; L2-104 AC3
// Description: the custom ride's control aside: "Resistance" with Lower and Raise around the bike's level and the 32
// "Level N" bars, the note on who sets the level, and "Sent to bike", which logs each target resistance sent with its
// ride time, level, source and acknowledgement under the link's name.
//
// Given a ride on the connected Echelon at level 6, when it opens, then the level reads 6 of 32, Level 6 is current
// with bars 1 to 6 on, the note reads "Following the plan — levels change with each interval.", and "Sent to bike"
// under "BLE · 0bf669f1" holds the warm-up's level 8 from the plan at 0:00.
// Given Raise and "Level 20", when they are pressed, then 9 and 20 are sent as the rider's own and logged at the top.
// Given the next segment, when it starts, then the plan's level applies again.
// Given the bike drops, when the controls show, then Lower, Raise and every bar are disabled.
// Given flat resistance, when it opens, then the note reads "Holding a flat level for the whole ride."
import { ECHELON_NOTIFY, resistanceFrame, targetResistanceWrite } from './fixtures/echelon';
import { startCustomRide } from './fixtures/custom-ride';
import { expect, test } from './fixtures/test';

const isTarget = (hex: string): boolean => hex.startsWith('F0 B1 ');

test('the aside reads the bike’s level and logs what the plan sent (L2-028 AC2, L2-029 AC1, AC4, L2-104 AC3)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await page.clock.runFor(100);

  await expect(ride.level).toHaveText('6');
  await expect(ride.levels).toHaveCount(32);
  await expect(ride.levels.nth(5)).toHaveAccessibleName('Level 6');
  await expect(ride.levels.nth(5)).toHaveAttribute('aria-current', 'true');
  await expect(ride.levels.nth(6)).not.toHaveAttribute('aria-current');
  await expect(ride.mode).toHaveText('Following the plan — levels change with each interval.');
  await expect(ride.sentLink).toHaveText('BLE · 0bf669f1');
  await expect(ride.sent).toHaveCount(1);
  await expect(ride.sent.first()).toHaveText(/^0:00RES 8 · planack \d+ms$/);
});

test('Raise and a level bar send the rider’s own level until the next segment (L2-028 AC1, AC2, AC3, L2-029 AC1)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  const sent = () =>
    bluetooth
      .writes()
      .map((write) => write.hex)
      .filter(isTarget);

  await ride.raise.click();
  await ride.levels.nth(19).click();
  await page.clock.runFor(100);

  await expect.poll(sent).toEqual([8, 9, 20].map(targetResistanceWrite));
  await expect(ride.sent.first()).toHaveText(/^0:00RES 20 · manualack \d+ms$/);
  await expect(ride.sent).toHaveCount(3);

  await page.clock.fastForward('05:00');
  await page.clock.runFor(100);
  await expect.poll(sent).toEqual([8, 9, 20, 24].map(targetResistanceWrite));
  await expect(ride.sent.first()).toHaveText(/^5:00RES 24 · planack \d+ms$/);
});

test('with the bike away every resistance control is off (L2-028 AC4)', async ({
  page,
  bluetooth,
}) => {
  const ride = await startCustomRide(page, bluetooth);
  await expect(ride.raise).toBeEnabled();

  await bluetooth.drop();
  await page.clock.runFor(100);

  await expect(ride.raise).toBeDisabled();
  await expect(ride.lower).toBeDisabled();
  for (const bar of await ride.levels.all()) await expect(bar).toBeDisabled();
});

test('flat resistance holds one level (L2-028 AC2)', async ({ page, bluetooth }) => {
  const ride = await startCustomRide(page, bluetooth, {
    setUp: (custom) => custom.flat.click(),
    first: 12,
  });

  await expect(ride.mode).toHaveText('Holding a flat level for the whole ride.');
  await expect(ride.sent.first()).toHaveText(/^0:00RES 12 · planack \d+ms$/);
});
