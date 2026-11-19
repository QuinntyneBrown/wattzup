import { expect, test } from './fixtures/wz-test';
import { SetupPage } from './pages/setup.page';
import { freeRide } from './fixtures/states';
import workoutStarted from './fixtures/recorded/workout-started.json';

const GCN = 'https://www.youtube.com/watch?v=QUoToFsMNig';

test.describe('Ride along to a video on setup (L2-029 AC17-20)', () => {
  test('shows the video switch off on first use and the link field when on', async ({
    page,
    api,
    events,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await expect(setup.videoSwitch).not.toBeChecked();
    await expect(setup.videoSwitchRow).toContainText('Plays in sync on the dashboard');
    await expect(setup.videoUrl).toHaveCount(0);
    await setup.videoSwitch.check();
    await expect(setup.videoUrl).toHaveAttribute('type', 'url');
  });

  test('prefills the 30 Minute HIIT link, also after the link was cleared', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { json: workoutStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await setup.videoSwitch.check();
    await expect(setup.videoUrl).toHaveValue(GCN);
    await expect(setup.videoPreview).toHaveAttribute('src', /\/embed\/QUoToFsMNig\?/);

    await setup.videoUrl.fill('');
    await setup.startButton.click();
    await api.waitForCall('POST', '/api/workout');
    await expect(page).toHaveURL(/\/$/);

    await setup.open(freeRide());
    await expect(setup.videoSwitch).toBeChecked();
    await expect(setup.videoUrl).toHaveValue(GCN);
  });

  test('names a link that is not YouTube and still starts without a video', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { json: workoutStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await setup.videoSwitch.check();
    await setup.videoUrl.fill('https://vimeo.com/76979871');
    await expect(setup.videoUrl).toHaveAttribute('aria-invalid', 'true');
    await expect(setup.videoUrlError).toHaveText(
      "That doesn't look like a YouTube link. Paste a youtube.com or youtu.be link.",
    );
    await expect(setup.startButton).toBeEnabled();
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect((call?.body as { video: unknown }).video).toBeNull();
  });

  test('posts the video with the plan and restores it after a reload', async ({
    page,
    api,
    events,
  }) => {
    api.on('POST', '/api/workout', { json: workoutStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await setup.videoSwitch.check();
    await setup.videoUrl.fill(GCN);
    await expect(setup.videoUrlError).toHaveCount(0);
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect((call?.body as { video: unknown }).video).toEqual({ url: GCN, start_seconds: 0 });
    await expect(page).toHaveURL(/\/$/);

    await setup.open(freeRide());
    await expect(setup.videoSwitch).toBeChecked();
    await expect(setup.videoUrl).toHaveValue(GCN);
  });

  test('turning the switch off sends no video', async ({ page, api, events }) => {
    api.on('POST', '/api/workout', { json: workoutStarted });
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await setup.videoSwitch.check();
    await setup.videoUrl.fill(GCN);
    await setup.videoSwitch.uncheck();
    await setup.startButton.click();
    const [call] = await api.waitForCall('POST', '/api/workout');
    expect((call?.body as { video: unknown }).video).toBeNull();
  });

  test('previews a valid link and steps the start point by half a second', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await setup.videoSwitch.check();
    await setup.videoUrl.fill(GCN);
    await expect(setup.videoPreview).toHaveAttribute(
      'src',
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/QUoToFsMNig\?/,
    );
    await expect(setup.videoStart).toHaveValue('0:00.0');
    await expect(setup.videoHelp).toContainText('Scrub the preview past the intro');
    await setup.videoLater.click();
    await setup.videoLater.click();
    await expect(setup.videoStart).toHaveValue('0:01.0');
    await setup.videoEarlier.click();
    await expect(setup.videoStart).toHaveValue('0:00.5');
    await setup.videoEarlier.click();
    await setup.videoEarlier.click();
    await expect(setup.videoStart).toHaveValue('0:00.0');

    await setup.videoStart.fill('0:12');
    await setup.videoStart.press('Enter');
    await expect(setup.videoStart).toHaveValue('0:12.0');

    await youtube.scrubTo(42.37);
    await setup.useVideoTime.click();
    await expect(setup.videoStart).toHaveValue('0:42.4');
    await setup.checkVideo.click();
    const [player] = await youtube.players();
    expect(player?.calls.map((c) => c.name)).toEqual(
      expect.arrayContaining(['pauseVideo', 'seekTo', 'playVideo']),
    );
    const seeks = player?.calls.filter((c) => c.name === 'seekTo') ?? [];
    expect(seeks.at(-1)?.args[0]).toBe(42.4);
  });

  test('adds Video Synced from 0:12.0 to the preview', async ({ page, api, events }) => {
    const setup = new SetupPage(page, api, events);
    await setup.open(freeRide());
    await expect(setup.summaryTerms()).not.toContainText(['Video']);
    await setup.videoSwitch.check();
    await setup.videoUrl.fill(GCN);
    await setup.videoStart.fill('12');
    await setup.videoStart.press('Enter');
    await expect(setup.summaryValue('Video')).toHaveText('Synced from 0:12.0');
    const terms = await setup.summaryTerms().allTextContents();
    expect(terms.indexOf('Video')).toBe(terms.indexOf('Time under load') + 1);
    await setup.videoSwitch.uncheck();
    await expect(setup.summaryValue('Video')).toHaveCount(0);
  });
});
