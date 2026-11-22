// Acceptance test
// Traces to: L2-135 AC4; L2-048 AC1; L2-085 AC5
// Description: while the network is down, a riders-online race and a group class cannot be joined, and the screen says
// why the moment the browser goes offline: Race Setup's Riders online reads "You’re offline. Riders online needs a
// network." and Bots is chosen in its place; Class Start's Ride with a group reads "You’re offline. Group classes need
// a network." and Ride alone is chosen. Offline, neither asks the service anything; back online, both ask again at once
// and the choice opens.
import { hiitCardio, hiitSessions, SESSIONS_NOW } from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { maps } from './fixtures/maps';
import { midRiderProgress } from './fixtures/progress';
import { expect, test } from './fixtures/test';
import { ClassStartPage } from './pages/class-start.page';
import { RaceSetupPage } from './pages/race-setup.page';

const QUEUE = 'GET /api/maps/old-town-criterium/queue';
const SESSIONS = `/api/classes/${hiitCardio.id}/sessions`;

test.beforeEach(async ({ bluetooth }) => {
  await bluetooth.remember(echelonBike);
});

test('offline, Riders online says why it is closed and Bots is chosen; back online it opens again (L2-135 AC4) @critical', async ({
  page,
  context,
  api,
}) => {
  api.answer('GET', '/api/maps', maps);
  api.answer('GET', '/api/progress', midRiderProgress);
  api.answer('GET', '/api/maps/old-town-criterium/queue', { riders: 3 });
  const setup = new RaceSetupPage(page);
  await setup.open('old-town-criterium');
  const online = setup.mode('Riders online');
  await expect(online).toContainText('3 riders queuing now.');
  await online.click();
  await expect(setup.start).toHaveText('Find a race');

  await context.setOffline(true);

  await expect(online).toContainText('You’re offline. Riders online needs a network.');
  await expect(online).toHaveAttribute('aria-disabled', 'true');
  await expect(setup.mode('Bots')).toHaveAttribute('aria-checked', 'true');
  await expect(setup.start).toHaveText('Go to the start line');
  const asked = api.requests().filter((request) => request === QUEUE).length;

  await context.setOffline(false);

  await expect(online).toContainText('3 riders queuing now.');
  await expect(online).not.toHaveAttribute('aria-disabled', 'true');
  expect(api.requests().filter((request) => request === QUEUE).length).toBe(asked + 1);
});

test('offline, Ride with a group says why it is closed and Ride alone is chosen; back online it opens again (L2-135 AC4)', async ({
  page,
  context,
  api,
}) => {
  await page.clock.install({ time: SESSIONS_NOW });
  api.answer('GET', SESSIONS, hiitSessions);
  const start = new ClassStartPage(page);
  await start.open(hiitCardio.id);
  await expect(start.group).toHaveAttribute('aria-checked', 'true');

  await context.setOffline(true);

  await expect(start.body(start.group)).toHaveText('You’re offline. Group classes need a network.');
  await expect(start.group).toHaveAttribute('aria-disabled', 'true');
  await expect(start.alone).toHaveAttribute('aria-checked', 'true');
  await expect(start.start).toBeVisible();

  await context.setOffline(false);

  await expect(start.body(start.group)).toHaveText('7:39 PM · starts in 9 min · 6 of 10 riders');
  await expect(start.group).not.toHaveAttribute('aria-disabled', 'true');
});
