// Acceptance test
// Traces to: L2-047 AC1, AC2, AC3, AC4, AC5; L2-048 AC1, AC2, AC4; L2-049 AC1, AC2, AC3; L2-050 AC1, AC2
// Description: Race Setup for a new rider shows the map's photo, name, route and facts with no best, the stars here
// with none earned, and the goal line only on the map that holds the next unlock; a locked map's address opens Map
// Select. The rider chooses whom to race and, against bots, the pack strength, and the start button opens the race.
import { echelonBike } from './fixtures/echelon';
import { maps } from './fixtures/maps';
import { expect, test } from './fixtures/test';
import { RacePage } from './pages/race.page';
import { RaceLobbyPage } from './pages/race-lobby.page';
import { RaceSetupPage } from './pages/race-setup.page';

test.beforeEach(({ api }) => {
  api.answer('GET', '/api/maps', maps);
});

test('@critical Race Setup shows the map, its facts with no best, and the stars here (L2-047 AC1, AC2, AC4)', async ({
  page,
}) => {
  const setup = new RaceSetupPage(page);
  await setup.open('old-town-criterium');

  await expect(setup.back).toHaveAttribute('href', '/race');
  await expect(setup.photo).toHaveAttribute('src', /maps\/old-town-criterium-photo\.jpg$/);
  await expect(setup.title).toHaveText('Old Town Criterium');
  await expect(setup.sub).toHaveText('Cathedral Circuit · A cobbled European old town on race day');
  await expect(setup.factLabels).toHaveText(['Distance', 'Climbing', 'Rated']);
  await expect(setup.factValues).toHaveText(['14.2 km', '140 m', 'Easy']);
  await expect(setup.starsTitle).toBeVisible();
  await expect(setup.starRules).toHaveText([
    'Finish the race',
    'Top 3 against the medium pack',
    'Beat your best time',
  ]);
  await expect(page).toHaveTitle('Race Setup · Telo Ride');
});

test('the goal line shows only on the map that holds the next unlock (L2-047 AC3)', async ({
  page,
}) => {
  const setup = new RaceSetupPage(page);
  await setup.open('prairie-paceline');

  await expect(setup.goal).toHaveText(
    'Finish top 3 vs Bots on Prairie Paceline to open Cliffside Coast.',
  );
  await expect(setup.goalTarget).toHaveText('Finish top 3 vs Bots on Prairie Paceline');

  await setup.open('old-town-criterium');
  await expect(setup.title).toHaveText('Old Town Criterium');
  await expect(setup.goal).toHaveCount(0);
});

test('Race against offers three modes, Bots chosen, and Riders online locked until level 3 (L2-048 AC1, AC2)', async ({
  page,
}) => {
  const setup = new RaceSetupPage(page);
  await setup.open('old-town-criterium');

  await expect(page.getByRole('heading', { name: 'Race against' })).toBeVisible();
  await expect(setup.modeOptions).toHaveCount(3);
  await expect(setup.mode('Your best time')).toContainText(
    'Solo. A ghost of your fastest ride sets the pace.',
  );
  await expect(setup.mode('Bots')).toContainText(
    "9 computer riders. Starts the moment you're ready.",
  );
  await expect(setup.mode('Bots')).toHaveAttribute('aria-checked', 'true');
  await expect(setup.mode('Your best time')).toHaveAttribute('aria-checked', 'false');
  await expect(setup.mode('Riders online')).toContainText('Opens at level 3.');
  await expect(setup.mode('Riders online')).toHaveAttribute('aria-disabled', 'true');
  await expect(setup.onlineLock).toBeVisible();

  // Playwright waits for an aria-disabled control to be enabled; a click that lands must still change nothing.
  await setup.mode('Riders online').click({ force: true });
  await expect(setup.mode('Bots')).toHaveAttribute('aria-checked', 'true');
  await setup.mode('Your best time').click();
  await expect(setup.mode('Your best time')).toHaveAttribute('aria-checked', 'true');
  await expect(setup.mode('Bots')).toHaveAttribute('aria-checked', 'false');
});

test('the arrow keys move the race mode and pass over Riders online (L2-048 AC4)', async ({
  page,
}) => {
  const setup = new RaceSetupPage(page);
  await setup.open('old-town-criterium');
  await setup.mode('Bots').focus();

  await page.keyboard.press('ArrowUp');
  await expect(setup.mode('Your best time')).toHaveAttribute('aria-checked', 'true');
  await expect(setup.mode('Your best time')).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(setup.mode('Bots')).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(setup.mode('Your best time')).toHaveAttribute('aria-checked', 'true');
  await expect(setup.mode('Your best time')).toBeFocused();
});

test('against bots, Pack strength offers easy, medium and hard, each with its note (L2-049 AC1, AC2, AC3)', async ({
  page,
}) => {
  const setup = new RaceSetupPage(page);
  await setup.open('old-town-criterium');

  await expect(setup.packOptions).toHaveText(['easy', 'medium', 'hard']);
  await expect(setup.packStrength('medium')).toHaveAttribute('aria-checked', 'true');
  await expect(setup.packNote).toHaveText('Around 190 W. A top 3 here earns the second star.');

  await setup.packStrength('hard').click();
  await expect(setup.packStrength('hard')).toHaveAttribute('aria-checked', 'true');
  await expect(setup.packNote).toHaveText('Around 250 W. Expect to hurt.');

  await page.keyboard.press('ArrowRight');
  await expect(setup.packStrength('easy')).toHaveAttribute('aria-checked', 'true');
  await expect(setup.packStrength('easy')).toBeFocused();
  await expect(setup.packNote).toHaveText('Around 130 W. Good for learning the course.');

  await setup.mode('Your best time').click();
  await expect(setup.pack).toHaveCount(0);
  await expect(setup.packNote).toHaveCount(0);
});

test('against bots, Go to the start line opens the lobby with the chosen pack (L2-050 AC1)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const setup = new RaceSetupPage(page);
  await setup.open('old-town-criterium');
  await setup.packStrength('hard').click();

  await expect(setup.start).toHaveText('Go to the start line');
  await setup.start.click();

  await expect(page).toHaveURL('/race/old-town-criterium/lobby?mode=bots&pack=hard');
  await expect(new RaceLobbyPage(page).title).toHaveText(
    'Old Town Criterium · 14.2 km · Bots, hard',
  );
});

test('against your best time, Start ride opens the race at once, solo (L2-050 AC2)', async ({
  page,
  bluetooth,
}) => {
  await bluetooth.remember(echelonBike);
  const setup = new RaceSetupPage(page);
  await setup.open('prairie-paceline');
  await setup.mode('Your best time').click();

  await expect(setup.start).toHaveText('Start ride');
  await setup.start.click();

  await expect(page).toHaveURL('/race/prairie-paceline/ride?mode=solo');
  await expect(new RacePage(page).route).toHaveText('Route 9 Wind Farm · vs your best');
});
