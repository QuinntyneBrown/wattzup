import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { RIDE_VIDEO, state, videoWorkout, workout } from './fixtures/states';
import type { FakeYouTube, PlayerCall } from './fixtures/fake-youtube';
import { ToastRegion } from './pages/toast-region';
import workoutPaused from './fixtures/recorded/workout-paused.json';
import workoutResumed from './fixtures/recorded/workout-resumed.json';

// The default plan at 7:07 of 12:40, with the video synced from 0:12.0: the target is 439.0 s.
const riding = (change = {}) => state({ workout: videoWorkout(change) });

async function calls(youtube: FakeYouTube): Promise<PlayerCall[]> {
  return (await youtube.players()).at(-1)?.calls ?? [];
}

/** The calls made after the first `from` calls, as `name` or `name(arg)` for a seek. */
async function since(youtube: FakeYouTube, from: number): Promise<string[]> {
  return (await calls(youtube))
    .slice(from)
    .map((c) => (c.name === 'seekTo' ? `seekTo(${c.args[0]})` : c.name));
}

test.describe('Ride along to a video on the dashboard (L2-076)', () => {
  test('shows the Video and Power vs. plan tabs with the player and the plan strip', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(riding());
    await expect(ride.videoTab).toHaveAttribute('aria-selected', 'true');
    await expect(ride.chartTab).toHaveAttribute('aria-selected', 'false');
    await expect(ride.mainViewCaption).toHaveText('In sync · pauses with the ride');
    await expect(ride.videoPanel).toBeVisible();
    await expect(ride.planStrip).toHaveAttribute('aria-label', 'Ride progress: 7:07 of 12:40');
    await expect(ride.trace).toHaveCount(0);
  });

  test('shows the trace alone when the plan has no video', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: workout() }));
    await expect(ride.trace).toBeVisible();
    await expect(ride.mainViewTabs).toHaveCount(0);
    await expect(ride.videoPanel).toHaveCount(0);
  });

  test('builds the nocookie embed from video_id and titles it Ride-along video', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(riding());
    await expect(ride.videoPanel.locator('iframe')).toHaveAttribute('title', 'Ride-along video');
    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    const [player] = await youtube.players();
    expect(new URL(player!.src).origin + new URL(player!.src).pathname).toBe(
      'https://www.youtube-nocookie.com/embed/QUoToFsMNig',
    );
  });

  test('plays at start plus elapsed and seeks back after drift over 1.5 s', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(riding());
    await expect.poll(() => since(youtube, 0)).toEqual(['seekTo(439)', 'playVideo']);
    const seen = (await calls(youtube)).length;

    await youtube.scrubTo(440.2);
    await events.push(riding({ elapsed_seconds: 428 }));
    await expect(ride.planStrip).toHaveAttribute('aria-label', 'Ride progress: 7:08 of 12:40');
    expect(await since(youtube, seen)).toEqual([]);

    await youtube.scrubTo(447);
    await events.push(riding({ elapsed_seconds: 429 }));
    await expect.poll(() => since(youtube, seen)).toEqual(['seekTo(441)']);
  });

  test('pauses the video at the target for each status other than running', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(riding());
    await expect.poll(() => since(youtube, 0)).toEqual(['seekTo(439)', 'playVideo']);
    const seen = (await calls(youtube)).length;
    await events.push(riding({ status: 'paused', elapsed_seconds: 430 }));
    await expect.poll(() => since(youtube, seen)).toEqual(['pauseVideo', 'seekTo(442)']);
  });

  test('keeps the player following the ride behind Power vs. plan until the workout ends', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(riding());
    await expect.poll(() => since(youtube, 0)).toEqual(['seekTo(439)', 'playVideo']);
    await ride.chartTab.click();
    await expect(ride.chartTab).toHaveAttribute('aria-selected', 'true');
    await expect(ride.trace).toBeVisible();
    await expect(ride.videoPanel).toBeHidden();
    await expect(ride.planStrip).toHaveCount(0);

    const seen = (await calls(youtube)).length;
    await events.push(riding({ status: 'paused', elapsed_seconds: 430 }));
    await expect.poll(() => since(youtube, seen)).toEqual(['pauseVideo', 'seekTo(442)']);
    await events.push(riding({ status: 'running', elapsed_seconds: 431 }));
    await expect(ride.chartTab).toHaveAttribute('aria-selected', 'true');
  });

  test('seeks to the target before playing when the tab is shown again', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(riding());
    await expect.poll(() => since(youtube, 0)).toEqual(['seekTo(439)', 'playVideo']);
    await ride.setVisibility('hidden');
    await youtube.drive('paused', 440);
    await events.push(riding({ elapsed_seconds: 500 }));
    const seen = (await calls(youtube)).length;
    expect(seen).toBe(2);
    await ride.setVisibility('visible');
    await expect.poll(() => since(youtube, seen)).toEqual(['seekTo(512)', 'playVideo']);
  });

  test('moves between the tabs with the arrow keys', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(riding());
    await ride.videoTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(ride.chartTab).toBeFocused();
    await expect(ride.chartTab).toHaveAttribute('aria-selected', 'true');
    await expect(ride.videoTab).toHaveAttribute('tabindex', '-1');
    await page.keyboard.press('ArrowLeft');
    await expect(ride.videoTab).toBeFocused();
    await expect(ride.videoTab).toHaveAttribute('aria-selected', 'true');
  });

  test('pauses and resumes the ride from the player', async ({ page, api, events, youtube }) => {
    api.on('POST', '/api/workout/pause', { json: workoutPaused });
    api.on('POST', '/api/workout/resume', { json: workoutResumed });
    const ride = new RidePage(page, api, events);
    await ride.open(riding());
    await expect.poll(() => since(youtube, 0)).toEqual(['seekTo(439)', 'playVideo']);

    const seen = (await calls(youtube)).length;
    await youtube.drive('paused', 439.4);
    await api.waitForCall('POST', '/api/workout/pause');
    await events.push(riding({ elapsed_seconds: 427 }));
    await events.push(riding({ status: 'paused' }));
    await expect(ride.resumeButton).toBeVisible();
    expect(await since(youtube, seen)).not.toContain('playVideo');

    await youtube.drive('playing', 439.4);
    await api.waitForCall('POST', '/api/workout/resume');
    await events.push(riding({ elapsed_seconds: 428 }));
    await expect(ride.planStrip).toHaveAttribute('aria-label', 'Ride progress: 7:08 of 12:40');
    expect(await since(youtube, seen)).not.toContain('pauseVideo');
  });

  test('covers the player with Play video in sync after 2 refusals', async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const ride = new RidePage(page, api, events);
    await page.addInitScript(() => {
      (window as unknown as { __fakeYT: unknown }).__fakeYT = {
        players: [],
        title: '',
        refusePlay: true,
      };
    });
    await ride.open(riding());
    await expect(ride.playScrim).toBeVisible({ timeout: 10_000 });
    await expect(ride.rideClock).toBeVisible();

    await youtube.refusePlay(false);
    const seen = (await calls(youtube)).length;
    await ride.playScrim.click();
    await expect(ride.playScrim).toHaveCount(0);
    expect(await since(youtube, seen)).toEqual(['seekTo(439)', 'playVideo']);
  });

  test("shows Couldn't play the video and selects Power vs. plan on a player error", async ({
    page,
    api,
    events,
    youtube,
  }) => {
    const ride = new RidePage(page, api, events);
    const toasts = new ToastRegion(page);
    await ride.open(riding());
    await expect.poll(() => since(youtube, 0)).toEqual(['seekTo(439)', 'playVideo']);
    await youtube.fail(150);
    await expect(toasts.toast("Couldn't play the video")).toContainText(
      'The ride carries on without it.',
    );
    await expect(ride.chartTab).toHaveAttribute('aria-selected', 'true');
    await expect(ride.trace).toBeVisible();
    await expect(ride.rideClock).toBeVisible();
  });
});
