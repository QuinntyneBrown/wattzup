// Acceptance test
// Traces to: L2-043 AC2, AC3; L2-044 AC1
// Description: the Class Library opens a class once the rider's level from the backend reaches its tier: at level 7,
// 30 Min Tempo Paceline (level 5) is open and its Class Start opens, while the level-10 and level-20 classes stay
// locked; at level 18 only 60 Min Coastal Endurance + Surges (level 20) is locked.
import { library } from './fixtures/library';
import { midRiderProgress, veteranProgress } from './fixtures/progress';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { ClassStartPage } from './pages/class-start.page';

const open = [
  '20 Minute Power Intervals',
  '20 Min Threshold Builder',
  '30 Minute HIIT Cardio',
  '30 Min Tempo Paceline',
];

test.beforeEach(({ api }) => {
  api.answer('GET', '/api/classes', library);
});

test('at level 7, the level-5 tier is open and the level-10 and level-20 tiers stay locked (L2-043 AC3) @critical', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/progress', midRiderProgress);
  const classes = new ClassLibraryPage(page);
  await classes.open();

  for (const title of open) {
    await expect(classes.card(title).root).toHaveJSProperty('tagName', 'A');
  }
  for (const [title, level] of [
    ['30 Min Vice City Pyramid', 10],
    ['60 Min Dolomites Endurance', 10],
    ['60 Min Coastal Endurance + Surges', 20],
  ] as const) {
    await expect(classes.card(title).root).toBeDisabled();
    await expect(classes.card(title).lock).toHaveText(`Opens at level ${level}`);
  }

  await classes.card('30 Min Tempo Paceline').root.click();
  await expect(page).toHaveURL('/classes/tempo-paceline-30');
  await expect(new ClassStartPage(page).title).toHaveText('30 Min Tempo Paceline');
});

test('at level 18, only the level-20 tier is locked (L2-043 AC3)', async ({ page, api }) => {
  api.answer('GET', '/api/progress', veteranProgress);
  const classes = new ClassLibraryPage(page);
  await classes.open();

  for (const title of [...open, '30 Min Vice City Pyramid', '60 Min Dolomites Endurance']) {
    await expect(classes.card(title).root).toHaveJSProperty('tagName', 'A');
  }
  await expect(classes.card('60 Min Coastal Endurance + Surges').lock).toHaveText(
    'Opens at level 20',
  );

  await new ClassStartPage(page).open('dolomites-endurance-60');
  await expect(page).toHaveURL('/classes/dolomites-endurance-60');
});
