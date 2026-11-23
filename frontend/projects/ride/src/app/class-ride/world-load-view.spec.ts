// Unit test
// Traces to: L2-152 AC1, AC2, AC3, AC4, AC5, AC6; L2-153 AC1, AC2; L2-155 AC1, AC2; L2-156 AC1, AC4
// Description: World loading in words for each phase: the card's heading, the three steps with their states and
// details, the overall percentage (the download 40 %, the shaders 40 % by programs built, the warm-up 20 %), the hint
// under Start riding, and the status a screen reader hears as each step starts and when the load turns slow.
import { type WorldLoadState, worldLoadView } from './world-load-view';

const base: WorldLoadState = {
  name: 'Neon Docklands',
  phase: 'downloading',
  progress: { received: 0, total: 0 },
  api: 'webgpu',
  panoramaOnly: false,
  keepWorlds: true,
  warmUpSeconds: 300,
  startPercent: 0,
  programs: null,
  warmed: null,
  slow: false,
  shaderSeconds: 0,
  slowPercent: 0,
  bikeConnected: true,
  groupStartsAt: null,
};

const downloaded = { received: 18_900_000, total: 18_900_000 };

describe('worldLoadView', () => {
  it('reads the download in progress with its bytes, the other steps waiting', () => {
    const view = worldLoadView({
      ...base,
      progress: { received: 7_600_000, total: 18_900_000 },
    });

    expect(view.heading).toBe('Getting Neon Docklands ready');
    expect(view.steps).toEqual([
      { label: 'Download the world', state: 'current', detail: '7.6 of 18.9 MB' },
      { label: 'Build the shaders', state: 'waiting', detail: 'Programs for WebGPU' },
      {
        label: 'Warm up the first frames',
        state: 'waiting',
        detail: 'Drawn off screen so the start is smooth',
      },
    ]);
    expect(view.percent).toBe(16);
    expect(view.hint).toBe(
      'The first time takes longest. Next time this world opens from this device.',
    );
    expect(view.ready).toBe(false);
    expect(view.status).toBe('Downloading the world, 0 percent.');
  });

  it('announces a resumed download at the percentage it resumes from, not each percent after', () => {
    const view = worldLoadView({
      ...base,
      startPercent: 16,
      progress: { received: 9_000_000, total: 18_900_000 },
    });

    expect(view.percent).toBe(19);
    expect(view.status).toBe('Downloading the world, 16 percent.');
  });

  it('reads no bytes before the download’s size is known', () => {
    expect(worldLoadView(base).steps[0]!.detail).toBe('');
    expect(worldLoadView(base).percent).toBe(0);
  });

  it('reads the shaders building once the world is downloaded and saved', () => {
    const view = worldLoadView({
      ...base,
      phase: 'building',
      progress: downloaded,
      api: 'webgl2',
      startPercent: 40,
    });

    expect(view.steps.map((step) => step.state)).toEqual(['done', 'current', 'waiting']);
    expect(view.steps[0]!.detail).toBe('18.9 MB · saved on this device for next time');
    expect(view.steps[1]!.detail).toBe('Programs for WebGL 2');
    expect(view.percent).toBe(40);
    expect(view.hint).toBe('Ready in a few seconds. Pedal easy while you wait.');
    expect(view.status).toBe('Building the shaders, 40 percent.');
  });

  it('reads the download’s size alone with Keep worlds after a ride off: nothing is saved (L2-152 AC2, L2-165 AC3)', () => {
    const view = worldLoadView({
      ...base,
      phase: 'building',
      progress: downloaded,
      keepWorlds: false,
      startPercent: 40,
    });

    expect(view.steps[0]!.detail).toBe('18.9 MB');
  });

  it('reads the world ready, at 100 %, with the warm-up the class starts with', () => {
    const view = worldLoadView({
      ...base,
      phase: 'ready',
      progress: { received: 18_900_000, total: 18_900_000 },
    });

    expect(view.heading).toBe('Neon Docklands is ready');
    expect(view.steps.map((step) => step.state)).toEqual(['done', 'done', 'done']);
    expect(view.percent).toBe(100);
    expect(view.ready).toBe(true);
    expect(view.hint).toBe('Your 5:00 warm-up starts the moment you press Start.');
    expect(view.status).toBe('Neon Docklands is ready.');
  });

  it('reads a class with no warm-up starting the moment the rider presses Start', () => {
    expect(worldLoadView({ ...base, phase: 'ready', warmUpSeconds: null }).hint).toBe(
      'Your class starts the moment you press Start.',
    );
  });

  it('reads the panorama ready where neither WebGPU nor WebGL 2 draws (L2-156 AC4)', () => {
    const view = worldLoadView({
      ...base,
      phase: 'ready',
      panoramaOnly: true,
      progress: { received: 400_000, total: 400_000 },
    });

    expect(view.heading).toBe('Neon Docklands is ready as a panorama');
    expect(view.steps).toEqual([
      { label: 'Download the panorama', state: 'done', detail: '0.4 MB' },
      { label: 'Build the shaders', state: 'skipped', detail: 'Not needed for the panorama' },
      {
        label: 'Warm up the first frames',
        state: 'skipped',
        detail: 'Not needed for the panorama',
      },
    ]);
    expect(view.percent).toBe(100);
    expect(view.ready).toBe(true);
    expect(view.hint).toBe('Turn on graphics acceleration in Chrome or Edge to ride the 3D world.');
    expect(view.status).toBe('Neon Docklands is ready as a panorama.');
  });

  it('reads a stopped download with the bytes it stopped at (L2-156 AC1)', () => {
    const view = worldLoadView({
      ...base,
      phase: 'failed',
      progress: { received: 7_600_000, total: 18_900_000 },
    });

    expect(view.heading).toBe('Couldn’t load Neon Docklands');
    expect(view.steps[0]).toEqual({
      label: 'Download the world',
      state: 'failed',
      detail: 'Stopped at 7.6 of 18.9 MB',
    });
    expect(view.percent).toBe(16);
    expect(view.ready).toBe(false);
    expect(view.hint).toBe('');
    expect(view.status).toBe('');
  });

  it('reads a world with nothing to download as built into the app', () => {
    expect(worldLoadView({ ...base, phase: 'building' }).steps[0]!.detail).toBe(
      'Built into the app',
    );
  });

  it('reads the programs built of the total as the shaders build in batches (L2-152 AC4)', () => {
    const view = worldLoadView({
      ...base,
      phase: 'building',
      progress: downloaded,
      startPercent: 40,
      programs: { built: 18, total: 64 },
    });

    expect(view.steps[1]).toEqual({
      label: 'Build the shaders',
      state: 'current',
      detail: '18 of 64 programs for WebGPU',
    });
    expect(view.percent).toBe(51);
    expect(view.status).toBe('Building the shaders, 40 percent.');
  });

  it('reads the first frames warming up once the programs are built', () => {
    const view = worldLoadView({
      ...base,
      phase: 'warming',
      progress: downloaded,
      startPercent: 80,
      programs: { built: 64, total: 64 },
    });

    expect(view.steps.map((step) => step.state)).toEqual(['done', 'done', 'current']);
    expect(view.steps[1]!.detail).toBe('64 programs for WebGPU');
    expect(view.steps[2]!.detail).toBe('Drawn off screen so the start is smooth');
    expect(view.percent).toBe(80);
    expect(view.status).toBe('Warming up the first frames, 80 percent.');
    expect(view.hint).toBe('Ready in a few seconds. Pedal easy while you wait.');
  });

  it('reads the frame rate the warm-up held at its level once ready (L2-152 AC5)', () => {
    const view = worldLoadView({
      ...base,
      phase: 'ready',
      progress: downloaded,
      programs: { built: 64, total: 64 },
      warmed: { fps: 60, tier: 'low' },
    });

    expect(view.steps[1]!.detail).toBe('64 programs for WebGPU');
    expect(view.steps[2]!.detail).toBe('Holding 60 fps at Low');
  });

  it('adds the seconds spent to the shaders once the load is slow, and says it is still building (L2-155 AC1, AC2)', () => {
    const view = worldLoadView({
      ...base,
      phase: 'building',
      progress: downloaded,
      startPercent: 40,
      programs: { built: 18, total: 64 },
      slow: true,
      shaderSeconds: 24,
      slowPercent: 41,
    });

    expect(view.steps[1]!.detail).toBe('18 of 64 programs for WebGPU · 24 s');
    expect(view.status).toBe('Still building the shaders, 41 percent.');
    expect(view.hint).toBe('Or keep waiting: Start riding turns on when the world is ready.');
  });

  it('says a slow download is still downloading, with no seconds on the shaders', () => {
    const view = worldLoadView({
      ...base,
      progress: { received: 0, total: 18_900_000 },
      slow: true,
      shaderSeconds: 0,
    });

    expect(view.steps[1]!.detail).toBe('Programs for WebGPU');
    expect(view.status).toBe('Still downloading the world, 0 percent.');
  });

  it('is no longer slow once the world is ready or the download has stopped', () => {
    const ready = worldLoadView({ ...base, phase: 'ready', progress: downloaded, slow: true });
    const failed = worldLoadView({ ...base, phase: 'failed', slow: true });

    expect(ready.status).toBe('Neon Docklands is ready.');
    expect(ready.hint).toBe('Your 5:00 warm-up starts the moment you press Start.');
    expect(failed.status).toBe('');
    expect(failed.hint).toBe('');
  });

  it('waits for the bike to start, and says so, while loading carries on (L2-157 AC1, AC2)', () => {
    const building = worldLoadView({
      ...base,
      phase: 'building',
      progress: downloaded,
      startPercent: 64,
      bikeConnected: false,
    });
    const ready = worldLoadView({
      ...base,
      phase: 'ready',
      progress: downloaded,
      bikeConnected: false,
    });

    expect(building.status).toBe('Building the shaders, 64 percent. The bike is not connected.');
    expect(building.hint).toBe(
      'Start riding turns on when the bike is connected and the world is ready.',
    );
    expect(ready.ready).toBe(true);
    expect(ready.canStart).toBe(false);
    expect(ready.status).toBe('Neon Docklands is ready. The bike is not connected.');
    expect(ready.hint).toBe(
      'Start riding turns on when the bike is connected and the world is ready.',
    );
  });

  it('can start once the world is ready and the bike connected (L2-153 AC2, L2-157 AC3)', () => {
    expect(worldLoadView({ ...base, phase: 'ready', progress: downloaded }).canStart).toBe(true);
    expect(worldLoadView({ ...base, phase: 'building', progress: downloaded }).canStart).toBe(
      false,
    );
  });

  it('waits for the group: no start, the start time announced once, and the group’s hint (L2-154 AC1, AC2)', () => {
    const building = worldLoadView({
      ...base,
      phase: 'building',
      progress: downloaded,
      startPercent: 52,
      groupStartsAt: '7:39 PM',
    });
    const ready = worldLoadView({
      ...base,
      phase: 'ready',
      progress: downloaded,
      groupStartsAt: '7:39 PM',
    });

    expect(building.status).toBe('Building the shaders, 52 percent. The group starts at 7:39 PM.');
    expect(building.hint).toBe('Pedal easy: everyone’s warm-up starts together.');
    expect(ready.canStart).toBe(false);
    expect(ready.hint).toBe('Pedal easy: everyone’s warm-up starts together.');
  });
});
