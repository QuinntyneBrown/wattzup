// Acceptance test
// Traces to: L2-105 AC1
// Description: Pause holds the custom ride's clock, plan and readouts and becomes Resume, with the resistance controls
// still enabled; Resume carries the ride on from where it held.
//
// Given a custom ride at 6:52, when the rider presses Pause, then the clock holds at 6:52 for 10 s, Pause reads Resume,
// level 24 is not sent at 7:00, and Raise and the level bars stay enabled.
// Given the paused ride, when the rider presses Resume, then the clock moves on from 6:52.
import { startCustomRide } from './fixtures/custom-ride';
import { ECHELON_NOTIFY, resistanceFrame, targetResistanceWrite } from './fixtures/echelon';
import { expect, test } from './fixtures/test';

test('Pause holds the ride and Resume carries it on (L2-105 AC1)', async ({ page, bluetooth }) => {
  const ride = await startCustomRide(page, bluetooth);
  await page.clock.fastForward('06:52');
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
  await page.clock.runFor(100);
  await expect(ride.clock).toHaveText('6:52 / 30:00');

  await ride.pause.click();
  await page.clock.runFor(100);
  const sent = bluetooth.writes().length;
  // Past the next interval's boundary at 7:00: the plan holds, so level 24 is not sent.
  await page.clock.runFor(10_000);

  await expect(ride.clock).toHaveText('6:52 / 30:00');
  await expect(ride.countdown).toHaveText('1:38');
  await expect(ride.pause).toHaveCount(0);
  await expect(ride.resume).toBeEnabled();
  await expect(ride.raise).toBeEnabled();
  await expect(ride.levels.nth(19)).toBeEnabled();
  expect(
    bluetooth
      .writes()
      .slice(sent)
      .map((write) => write.hex),
  ).not.toContain(targetResistanceWrite(24));

  await ride.resume.click();
  await page.clock.runFor(3000);
  await expect(ride.clock).toHaveText('6:55 / 30:00');
  await expect(ride.pause).toBeEnabled();
});
