// Acceptance test
// Traces to: L2-063 AC1; L2-028 AC1, AC4
// Description: the resistance panel reads the bike's resistance out of 32 between Lower and Raise, which send the next
// level as the rider's own and are off while the bike is away.
import { ECHELON_NOTIFY, resistanceFrame, targetResistanceWrite } from './fixtures/echelon';
import { startRace } from './fixtures/race';
import { expect, test } from './fixtures/test';

const isTarget = (hex: string): boolean => hex.startsWith('F0 B1 ');

test('the resistance panel reads “24 / Resistance / 32” and Raise and Lower move it (L2-063 AC1, L2-028)', async ({
  page,
  bluetooth,
  api,
}) => {
  const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=bots&pack=medium');
  await page.clock.fastForward('05:01');
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(24));
  await page.clock.runFor(100);

  await expect(race.resistance).toHaveText('24Resistance / 32');
  await expect(race.resistance).toHaveAccessibleName('Resistance 24 of 32');
  await expect(race.raise).toBeEnabled();

  await race.raise.click();
  await race.lower.click();
  await race.lower.click();

  await expect
    .poll(() =>
      bluetooth
        .writes()
        .map((write) => write.hex)
        .filter(isTarget),
    )
    .toEqual([8, 24, 25, 24, 23].map(targetResistanceWrite));

  await bluetooth.drop();
  await page.clock.runFor(100);
  await expect(race.raise).toBeDisabled();
  await expect(race.lower).toBeDisabled();
});
