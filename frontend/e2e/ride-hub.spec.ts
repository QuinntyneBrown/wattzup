// Acceptance test
// Traces to: L2-120 AC1, AC3, AC4; L2-121 AC3
// Description: a group class ride holds one connection to the ride hub and measures its clock offset from five
// ServerTime calls; when the connection drops it reconnects at once and measures again, and leaving the ride closes
// it. A solo class ride and the rest of the app hold none: the shared fixture fails any hub request it was not opened
// for. The ride joins its session (JoinClassSession) as it connects; group-class-join.spec.ts covers the join.
import { hiitCardio, seated } from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { connectBike } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';
import { HomePage } from './pages/home.page';

/** A seat in a session ten minutes away, so the ride waits for it rather than starting (L2-087 AC4). */
function laterSession(): { id: string; startsAt: string } {
  return { id: 'session-0715', startsAt: new Date(Date.now() + 600_000).toISOString() };
}

test('a group class ride opens one hub connection and measures its clock offset; leaving closes it (L2-120 AC1, AC4; L2-121 AC3) @critical', async ({
  page,
  bluetooth,
  hub,
}) => {
  hub.open();
  hub.answer('ServerTime', () => Date.now() + 1500);
  hub.answer('JoinClassSession', () => seated(laterSession()));
  await bluetooth.remember(echelonBike);
  const ride = new ClassRidePage(page);

  await ride.openGroup(hiitCardio.id, 'session-0715');

  await expect.poll(() => hub.invocations('ServerTime').length).toBe(5);
  expect(hub.negotiations()).toBe(1);
  expect(hub.connections()).toBe(1);

  await ride.leave.click();
  await expect(page).toHaveURL(`/classes/${hiitCardio.id}`);
  await expect.poll(() => hub.connections()).toBe(0);
});

test('when the connection drops, the ride reconnects at once and measures its clock offset again (L2-120 AC3)', async ({
  page,
  bluetooth,
  hub,
}) => {
  hub.open();
  hub.answer('ServerTime', () => Date.now());
  hub.answer('JoinClassSession', () => seated(laterSession()));
  await bluetooth.remember(echelonBike);
  await new ClassRidePage(page).openGroup(hiitCardio.id, 'session-0715');
  await expect.poll(() => hub.invocations('ServerTime').length).toBe(5);

  await hub.drop();

  await expect.poll(() => hub.negotiations()).toBe(2);
  await expect.poll(() => hub.invocations('ServerTime').length).toBe(10);
  expect(hub.connections()).toBe(1);
});

test('a solo class ride and the screens around it hold no hub connection (L2-120 AC4)', async ({
  page,
  bluetooth,
  hub,
  webgl,
}) => {
  await webgl.disable();
  await bluetooth.remember(echelonBike);
  const home = new HomePage(page);
  await home.open();
  await home.header.link('Classes').click();
  const ride = new ClassRidePage(page);
  await ride.open(hiitCardio.id);
  await connectBike(bluetooth);
  await new WorldLoadingPage(page).startRiding();
  await expect(ride.leave).toBeVisible();
  await ride.leave.click();
  await expect(page).toHaveURL(`/classes/${hiitCardio.id}`);

  expect(hub.negotiations()).toBe(0);
  expect(hub.unanswered()).toEqual([]);
});
