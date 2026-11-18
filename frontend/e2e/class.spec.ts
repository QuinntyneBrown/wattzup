// Acceptance Test
// Traces to: L2-080
// Description: The class page at /classes/:id: the class's header, its video preview cued at the
// start point, the plan card and the resistance rows; a missing class and the treadmill.
import dolomites from './fixtures/recorded/class-60-min-dolomites-endurance.json';
import videoStarted from './fixtures/recorded/video-workout-started.json';
import notFound from './fixtures/recorded/problem-class-not-found.json';
import { expect, test } from './fixtures/wz-test';
import { state, treadmillIdle, workout } from './fixtures/states';
import { ReplaceRideDialog } from './pages/replace-ride.dialog';
import { SetupPage } from './pages/setup.page';
import { ClassPage } from './pages/class.page';

test.describe('Class page (L2-080)', () => {
  test('shows the header, the cued preview and the plan card of an intervals class', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const cls = new ClassPage(page, api, events);
    await cls.open();

    await expect(page).toHaveTitle('30 Minute HIIT Cardio · Wattzup');
    await expect(cls.allClasses).toHaveAttribute('href', '/classes');
    await expect(cls.statusName).toHaveText('Echelon EX-5s');
    await expect(cls.chips).toHaveText(['GCN Training', '30 min', 'HIIT']);
    await expect(cls.heading).toHaveText('30 Minute HIIT Cardio');
    await expect(cls.description).toHaveText(
      'Eight 30-second maximal efforts with a recovery that shrinks each round. The classic.',
    );

    await expect(cls.previewTitle).toHaveText('GCN Training · 30 Minute HIIT Cardio');
    await expect(cls.previewMeta).toHaveText('Cued at 0:12.0, the ride’s 0:00');
    await expect
      .poll(async () => (await youtube.players())[0]?.src ?? '')
      .toContain('/embed/QUoToFsMNig');
    expect((await youtube.players())[0]?.src).toContain('start=12');
    await expect(cls.videoUrl).toHaveValue('https://www.youtube.com/watch?v=QUoToFsMNig');
    await expect(cls.videoStart).toHaveValue('0:12.0');
    await expect(cls.videoHelp).toHaveText(
      "Skips the intro so the video's first pedal stroke lands on your 0:00.",
    );

    await expect(cls.total).toHaveText('30:00');
    await expect(cls.strip).toHaveAttribute('role', 'img');
    await expect(cls.legend).toHaveText(['Work', 'Recover']);
    await expect(cls.stretches).toHaveText('5:00 warm-up · 6:00 cool-down');
    await expect(cls.figure('Structure')).toHaveText('8 × 0:30 · 3:00 → 1:30 recover');
    await expect(cls.figure('Cadence')).toHaveText('98 / 72 rpm');
    await expect(cls.figure('Expected avg power')).toHaveText('~154 W');
    await expect(cls.levelRows).toHaveCount(2);
    await expect(cls.work.value).toHaveText('24 / 32');
    await expect(cls.work.value).toHaveAttribute('aria-label', 'Work level 24 of 32');
    await expect(cls.recover.value).toHaveText('6 / 32');
    await expect(cls.resetButton).toHaveCount(0);
    await expect(cls.startButton).toHaveText('Start ride');
  });

  test('shows the poster prompt, one Steady row and Level throughout for a flat class', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const cls = new ClassPage(page, api, events);
    await cls.open('60-min-dolomites-endurance', { json: dolomites });

    await expect(cls.chips).toHaveText(['Wattzup Scenic', '60 min endurance', 'Zone 2']);
    await expect(cls.previewTitle).toHaveText(
      'Paste this ride’s YouTube link below to play it in sync on the dashboard.',
    );
    await expect(cls.videoUrl).toHaveValue('');
    expect(await youtube.players()).toHaveLength(0);
    await expect(cls.total).toHaveText('1:00:00');
    await expect(cls.stretches).toHaveCount(0);
    await expect(cls.figure('Structure')).toHaveText('Level 12 throughout');
    await expect(cls.figure('Cadence')).toHaveText('85 rpm');
    await expect(cls.levelRows).toHaveCount(1);
    await expect(cls.steady.value).toHaveText('12 / 32');
  });

  test("shows a skeleton, then We can't find that class for an unknown id", async ({
    page,
    api,
    events,
  }) => {
    let answer: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => (answer = resolve));
    const cls = new ClassPage(page, api, events);
    await cls.open('no-such-class', async () => {
      await answered;
      return { status: 404, json: notFound };
    });

    await expect(cls.skeleton.first()).toBeVisible();
    answer();
    await expect(cls.notFoundTitle).toHaveText("We can't find that class");
    await expect(cls.notFoundText).toHaveText(
      "It isn't in the class library. Pick another, or build your own ride.",
    );
    await expect(cls.notFound.getByRole('link', { name: 'All classes' })).toHaveAttribute(
      'href',
      '/classes',
    );
    await expect(cls.notFound.getByRole('link', { name: 'Build your own ride' })).toHaveAttribute(
      'href',
      '/setup',
    );
  });

  test('redirects the treadmill to setup', async ({ page, api, events }) => {
    const cls = new ClassPage(page, api, events);
    await cls.open(undefined, undefined, treadmillIdle());

    await expect(page).toHaveURL(/\/setup$/);
  });

  test('moves every effort or recover by one, updates the card and resets to the class', async ({
    page,
    api,
    events,
  }) => {
    const cls = new ClassPage(page, api, events);
    await cls.open();

    await cls.work.raise.click();
    await cls.work.raise.click();
    await cls.recover.raise.click();
    await cls.recover.raise.click();
    await expect(cls.work.value).toHaveText('26 / 32');
    await expect(cls.work.value).toHaveAttribute('aria-label', 'Work level 26 of 32');
    await expect(cls.work.value).toHaveAttribute('aria-live', 'polite');
    await expect(cls.recover.value).toHaveText('8 / 32');
    await expect(cls.strip).toHaveAttribute('aria-label', /peak level 26/);
    await expect(cls.figure('Expected avg power')).toHaveText('~169 W');
    await expect(cls.resetButton).toBeVisible();

    await cls.resetButton.click();
    await expect(cls.work.value).toHaveText('24 / 32');
    await expect(cls.recover.value).toHaveText('6 / 32');
    await expect(cls.figure('Expected avg power')).toHaveText('~154 W');
    await expect(cls.resetButton).toHaveCount(0);
  });

  test('stops a level at 1 and at 32', async ({ page, api, events }) => {
    const cls = new ClassPage(page, api, events);
    await cls.open();

    for (let i = 0; i < 5; i++) await cls.recover.lower.click();
    await expect(cls.recover.value).toHaveText('1 / 32');
    await expect(cls.recover.lower).toBeDisabled();
    for (let i = 0; i < 8; i++) await cls.work.raise.click();
    await expect(cls.work.value).toHaveText('32 / 32');
    await expect(cls.work.raise).toBeDisabled();
  });

  test('moves the flat level with the Steady row', async ({ page, api, events }) => {
    const cls = new ClassPage(page, api, events);
    await cls.open('60-min-dolomites-endurance', { json: dolomites });

    await cls.steady.raise.click();
    await expect(cls.steady.value).toHaveText('13 / 32');
    await expect(cls.figure('Structure')).toHaveText('Level 13 throughout');
    await expect(cls.resetButton).toBeVisible();
  });

  test('flags a link that is not YouTube and shows the preview for one that is', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const cls = new ClassPage(page, api, events);
    await cls.open('60-min-dolomites-endurance', { json: dolomites });
    await expect(cls.earlier).toBeDisabled();

    await cls.videoUrl.fill('https://vimeo.com/76979871');
    await expect(cls.videoError).toHaveText(
      "That doesn't look like a YouTube link. Paste a youtube.com or youtu.be link.",
    );
    await expect(cls.videoUrl).toHaveAttribute('aria-invalid', 'true');
    await expect(cls.later).toBeDisabled();
    expect(await youtube.players()).toHaveLength(0);
    await expect(cls.resetButton).toBeVisible();

    await cls.videoUrl.fill('https://youtu.be/QUoToFsMNig');
    await expect(cls.videoError).toHaveCount(0);
    await expect(cls.videoUrl).not.toHaveAttribute('aria-invalid', 'true');
    await expect(cls.previewMeta).toHaveText('Cued at 0:00.0, the ride’s 0:00');
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    await cls.earlier.click();
    await expect(cls.videoStart).toHaveValue('0:00.0');
  });

  test('moves the start point half a second and cues the preview to it', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const cls = new ClassPage(page, api, events);
    await cls.open();
    await expect.poll(async () => (await youtube.players()).length).toBe(1);

    await cls.later.click();
    await expect(cls.videoStart).toHaveValue('0:12.5');
    await expect(cls.previewMeta).toHaveText('Cued at 0:12.5, the ride’s 0:00');
    await expect
      .poll(
        async () =>
          (await youtube.players())[0]?.calls.filter((c) => c.name === 'seekTo').at(-1)?.args[0],
      )
      .toBe(12.5);
    await cls.earlier.click();
    await cls.earlier.click();
    await expect(cls.videoStart).toHaveValue('0:11.5');
    await expect(cls.resetButton).toBeVisible();

    await cls.videoStart.fill('20');
    await cls.videoStart.press('Enter');
    await expect(cls.videoStart).toHaveValue('0:20.0');
    await cls.resetButton.click();
    await expect(cls.videoStart).toHaveValue('0:12.0');
  });

  test('starts the plan as shown with its video and goes to the dashboard', async ({
    page,
    api,
    events,
  }) => {
    let release: () => void = () => undefined;
    const answered = new Promise<void>((r) => (release = r));
    api.on('POST', '/api/workout', async () => {
      await answered;
      return { json: videoStarted };
    });
    const cls = new ClassPage(page, api, events);
    await cls.open();
    await cls.work.raise.click();
    await cls.later.click();

    await cls.startButton.click();
    await expect(cls.startButton).toHaveText('Starting…');
    await expect(cls.startButton).toBeDisabled();
    const [request] = await api.waitForCall('POST', '/api/workout');
    const body = request!.body as {
      kind: string;
      sets: { work_level: number; rest_level: number }[];
      warmup: { level: number };
      video: unknown;
    };
    expect(body.kind).toBe('intervals');
    expect(body.sets.map((s) => s.work_level)).toEqual([25, 25, 25, 25, 25]);
    expect(body.sets.map((s) => s.rest_level)).toEqual([6, 6, 6, 6, 6]);
    expect(body.warmup.level).toBe(8);
    expect(body.video).toEqual({
      url: 'https://www.youtube.com/watch?v=QUoToFsMNig',
      start_seconds: 12.5,
    });
    release();
    await expect(page).toHaveURL(/\/$/);
  });

  test('starts without a video when the link is not YouTube', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { json: videoStarted });
    const cls = new ClassPage(page, api, events);
    await cls.open();
    await cls.videoUrl.fill('https://vimeo.com/76979871');

    await cls.startButton.click();
    const [request] = await api.waitForCall('POST', '/api/workout');
    expect((request!.body as { video: unknown }).video).toBeNull();
  });

  test('asks before replacing an active ride', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { json: { started: workout() } });
    const cls = new ClassPage(page, api, events);
    const replace = new ReplaceRideDialog(page);
    await cls.open(undefined, undefined, state());

    await cls.startButton.click();
    await expect(replace.keepButton).toBeFocused();
    expect(api.calls('POST', '/api/workout')).toHaveLength(0);
    await replace.replaceButton.click();
    await expect(page).toHaveURL(/\/$/);
    expect(api.calls('POST', '/api/workout')).toHaveLength(1);
  });

  test('keeps every value when the start fails and tries again', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { status: 500, json: { title: 'error', status: 500 } });
    const cls = new ClassPage(page, api, events);
    await cls.open();
    await cls.work.raise.click();

    await cls.startButton.click();
    await expect(cls.alert).toContainText("Couldn't start the ride");
    await expect(cls.alert).toContainText(
      "The Wattzup server didn't accept the plan. Your settings are kept — try again.",
    );
    await expect(cls.work.value).toHaveText('25 / 32');
    await expect(cls.videoStart).toHaveValue('0:12.0');

    api.on('POST', '/api/workout', { json: videoStarted });
    await cls.tryAgain.click();
    await expect(page).toHaveURL(/\/$/);
    expect(api.calls('POST', '/api/workout')).toHaveLength(2);
  });

  test('opens full setup in Intervals with this plan and video, replacing the draft', async ({
    page,
    api,
    events,
  }) => {
    const cls = new ClassPage(page, api, events);
    const setup = new SetupPage(page, api, events);
    await cls.open();
    await cls.work.raise.click();
    await cls.later.click();

    await cls.fullSetup.click();
    await expect(page).toHaveURL(/\/setup$/);
    await expect(setup.intervalsCard).toBeChecked();
    await expect(setup.stretchValue('Warm-up')).toHaveText('5:00 · Level 8 · 80 rpm');
    await expect(setup.setRows).toHaveCount(5);
    await expect(setup.setRow(1)).toContainText('1 × 0:30 · L25 · 98 rpm');
    await expect(setup.setRow(1)).toContainText('Recover 3:00 · L6 · 72 rpm');
    await expect(setup.videoSwitch).toBeChecked();
    await expect(setup.videoUrl).toHaveValue('https://www.youtube.com/watch?v=QUoToFsMNig');
    await expect(setup.videoStart).toHaveValue('0:12.5');
  });

  test('opens full setup in Flat with the steady level and no video', async ({
    page,
    api,
    events,
  }) => {
    const cls = new ClassPage(page, api, events);
    const setup = new SetupPage(page, api, events);
    await cls.open('60-min-dolomites-endurance', { json: dolomites });
    await cls.steady.raise.click();

    await cls.fullSetup.click();
    await expect(page).toHaveURL(/\/setup$/);
    await expect(setup.flatCard).toBeChecked();
    await expect(setup.slider('Resistance level')).toHaveValue('13');
    await expect(setup.videoSwitch).not.toBeChecked();
  });
});
