// Acceptance Test
// Traces to: L2-079
// Description: The class library at /classes: the catalogue as shelves of cards, each card one
// link to its class page, with the YouTube thumbnail or the poster as its cover; and the bike
// Ride Dashboard's Library link to it, which leaves the workout untouched (AC15).
import recordedClasses from './fixtures/recorded/classes.json';
import { expect, test } from './fixtures/wz-test';
import { freeRide, state } from './fixtures/states';
import { ClassLibraryPage } from './pages/class-library.page';
import { RidePage } from './pages/ride.page';
import { progressReport } from './fixtures/sessions';

const LEAD =
  'Pick a class. The bike follows its plan — resistance changes land on the beat of the workout.';

test.describe('Class library (L2-079)', () => {
  test('shows Ride a class with a tab per shelf and every shelf under All', async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open();

    await expect(page).toHaveTitle('Ride a class · Wattzup');
    await expect(library.heading).toHaveText('Ride a class');
    await expect(library.lead).toHaveText(LEAD);
    await expect(library.statusName).toHaveText('Echelon EX-5s');
    await expect(library.buildYourOwn).toHaveAttribute('href', '/setup');
    await expect(library.tabs).toHaveText([
      'All',
      '10–15 min',
      '20 min',
      '25 min',
      '30 min',
      '35 min',
      '40 min',
      '45–50 min',
      '55–60 min',
      '60 min endurance',
    ]);
    await expect(library.tab('All')).toHaveAttribute('aria-selected', 'true');
    await expect(library.shelves.getByRole('heading', { level: 2 })).toHaveText([
      '10–15 min',
      '20 min',
      '25 min',
      '30 min',
      '35 min',
      '40 min',
      '45–50 min',
      '55–60 min',
      '60 min endurance',
    ]);
    const short = library.shelf('20 min');
    await expect(short.tagline).toHaveText('Short and sharp — fits a lunch break.');
    await expect(short.count).toHaveText('45 classes');
    await expect(library.cards).toHaveCount(191);
  });

  test("shows each card's length, title, meta and strip, and opens its class page", async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open();

    const power = library.card('20 Minute Power Intervals');
    await expect(power.length).toHaveText('20:00');
    await expect(power.meta).toHaveText('Wattzup Studio · VO₂ max · Peak L22');
    await expect(power.strip).toHaveAttribute(
      'aria-label',
      'Resistance profile: 1 set · 6 efforts',
    );
    await expect(library.card('60 Min Dolomites Endurance').length).toHaveText('1:00:00');
    await expect(library.card('60 Min Dolomites Endurance').meta).toHaveText(
      'Wattzup Scenic · Zone 2 · Peak L12',
    );
    await expect(power.link).toHaveAttribute('href', '/classes/20-minute-power-intervals');
  });

  test('uses the YouTube thumbnail when the class has a video and the poster otherwise', async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open();

    const gcn = library.card('30 Minute HIIT Cardio');
    await expect(gcn.thumbnail).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg',
    );
    await expect(gcn.thumbnail).toHaveAttribute('alt', '');
    await expect(gcn.thumbnail).toHaveAttribute('loading', 'lazy');
    await expect(gcn.poster).toHaveCount(0);
    await expect(gcn.note).toHaveCount(0);

    const tempo = library.card('30 Min Tempo Paceline');
    await expect(tempo.thumbnail).toHaveCount(0);
    await expect(tempo.poster).toContainText('Wattzup Studio');
    await expect(tempo.note).toHaveText('Video link not set');
  });

  test('filters to one shelf from its tab and moves between tabs with the arrow keys', async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open();

    await library.tab('30 min').click();
    await expect(library.tab('30 min')).toHaveAttribute('aria-selected', 'true');
    await expect(library.shelves.getByRole('heading', { level: 2 })).toHaveText(['30 min']);
    await expect(library.tab('All')).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowRight');
    await expect(library.tab('35 min')).toBeFocused();
    await expect(library.shelves.getByRole('heading', { level: 2 })).toHaveText(['35 min']);
    await page.keyboard.press('Home');
    await expect(library.tab('All')).toBeFocused();
    await expect(library.shelves).toHaveCount(9);

    await library.tab('20 min').click();
    await page.reload();
    await events.push(library.live);
    await expect(library.tab('All')).toHaveAttribute('aria-selected', 'true');
  });

  test('falls back to the poster when a thumbnail fails', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    youtube.failThumbnails();
    const library = new ClassLibraryPage(page, api, events);
    await library.open();

    const gcn = library.card('30 Minute HIIT Cardio');
    // The thumbnail is lazy: it loads, and so fails, only once its card is near the viewport.
    await gcn.link.scrollIntoViewIfNeeded();
    await expect(gcn.poster).toContainText('GCN Training');
    await expect(gcn.thumbnail).toHaveCount(0);
    await expect(gcn.note).toHaveCount(0);
  });

  test('shows skeletons with the tabs disabled, then No classes yet for an empty catalogue', async ({
    page,
    api,
    events,
  }) => {
    let answer: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => (answer = resolve));
    const library = new ClassLibraryPage(page, api, events);
    await library.open(async () => {
      await answered;
      return { json: { shelves: [] } };
    });

    await expect(library.skeletons.first()).toBeVisible();
    await expect(library.tab('All')).toBeDisabled();
    answer();

    await expect(library.noticeTitle).toHaveText('No classes yet');
    await expect(library.noticeText).toHaveText(
      'Classes to ride along to appear here, grouped by shelf. Until then, build your own ride — Wattzup still drives the resistance.',
    );
    await expect(library.noticeBuildYourOwn).toHaveAttribute('href', '/setup');
    await expect(library.skeletons).toHaveCount(0);
  });

  test("shows Couldn't load the classes and retries with Try again", async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open({ abort: true });

    await expect(library.notice).toHaveRole('alert');
    await expect(library.noticeTitle).toHaveText("Couldn't load the classes");
    await expect(library.noticeText).toHaveText(
      "The Wattzup server didn't answer. Your bike is still connected.",
    );
    await expect(library.noticeBuildYourOwn).toHaveAttribute('href', '/setup');

    api.on('GET', '/api/classes', { json: recordedClasses });
    await library.tryAgain.click();
    await expect(library.cards).toHaveCount(191);
    expect(api.calls('GET', '/api/classes')).toHaveLength(2);
  });

  test('keeps the cards usable while the bike is not connected', async ({ page, api, events }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open(undefined, freeRide({ ble: 'disconnected' }));

    await expect(library.statusState).toHaveText('Disconnected');
    await expect(library.cards).toHaveCount(191);
  });

  test('links to Progress with the streak in its name and badge (L2-079 AC13)', async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open();

    await expect(library.progress).toHaveAttribute('href', '/progress');
    await expect(library.progress).toHaveAccessibleName('Progress, 3-day streak');
    await expect(library.streakBadge).toHaveText('3d');
    await expect(library.streakBadge).not.toHaveClass(/streak-badge--today/);
  });

  test('fills the streak badge once ridden today', async ({ page, api, events }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open(undefined, undefined, {
      json: progressReport({ streak: { current: 4, best: 6, rode_today: true } }),
    });

    await expect(library.progress).toHaveAccessibleName('Progress, 4-day streak, ridden today');
    await expect(library.streakBadge).toHaveClass(/streak-badge--today/);
  });

  test('shows Progress without a badge when there is no streak or progress fails', async ({
    page,
    api,
    events,
  }) => {
    const library = new ClassLibraryPage(page, api, events);
    await library.open(undefined, undefined, {
      json: progressReport({ streak: { current: 0, best: 6, rode_today: false } }),
    });
    await expect(library.progress).toHaveAccessibleName('Progress');
    await expect(library.streakBadge).toHaveCount(0);

    api.on('GET', '/api/progress', { abort: true });
    await page.reload();
    await expect(library.cards).toHaveCount(191);
    await expect(library.progress).toHaveAccessibleName('Progress');
    await expect(library.streakBadge).toHaveCount(0);
  });
});

test.describe("The Ride Dashboard's Library link (L2-079 AC15)", () => {
  /** Requests that would change the workout: anything but a read under /api/workout. */
  const workoutChanges = (requests: { method: string; path: string }[]) =>
    requests.filter((r) => r.method !== 'GET' && r.path.startsWith('/api/workout'));

  test('opens the class library by keyboard during a ride, leaving the workout untouched', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    const library = new ClassLibraryPage(page, api, events);
    library.answer();
    await ride.open(state());
    await expect(ride.workoutLink).toHaveAccessibleName('Edit workout: HIIT · 8 × 40s / 20s');

    await ride.lockup.focus();
    await page.keyboard.press('Tab');
    await expect(ride.libraryLink).toBeFocused();
    await expect(ride.libraryLink).toHaveCSS('outline-style', 'solid');
    await expect(ride.libraryLink).toHaveText('Library');
    await expect(ride.libraryLink).toHaveAccessibleName('Library');
    const box = await ride.libraryLink.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/classes$/);
    await expect(library.heading).toHaveText('Ride a class');
    expect(workoutChanges(api.requests)).toEqual([]);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(ride.workoutLink).toHaveAccessibleName('Edit workout: HIIT · 8 × 40s / 20s');
    await expect(ride.pauseButton).toBeEnabled();
    expect(workoutChanges(api.requests)).toEqual([]);
  });

  test.describe('on a touch screen', () => {
    test.use({ hasTouch: true });

    test('opens the class library with a tap', async ({ page, api, events }) => {
      const ride = new RidePage(page, api, events);
      const library = new ClassLibraryPage(page, api, events);
      library.answer();
      await ride.open(state());

      await ride.libraryLink.tap();
      await expect(page).toHaveURL(/\/classes$/);
      await expect(library.heading).toHaveText('Ride a class');
      expect(workoutChanges(api.requests)).toEqual([]);
    });
  });
});
