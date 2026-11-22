// Unit test
// Traces to: L2-152 AC1, AC2, AC3, AC6; L2-153 AC1, AC2; L2-156 AC1, AC4
// Description: World loading in words for each phase: the card's heading, the three steps with their states and
// details, the overall percentage (the download 40 %, the shaders and warm-up 60 %), the hint under Start riding, and
// the status a screen reader hears as each step starts.
import { type WorldLoadState, worldLoadView } from './world-load-view';

const base: WorldLoadState = {
  name: 'Neon Docklands',
  phase: 'downloading',
  progress: { received: 0, total: 0 },
  api: 'webgpu',
  panoramaOnly: false,
  warmUpSeconds: 300,
  startPercent: 0,
};

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
      progress: { received: 18_900_000, total: 18_900_000 },
      api: 'webgl2',
    });

    expect(view.steps.map((step) => step.state)).toEqual(['done', 'current', 'waiting']);
    expect(view.steps[0]!.detail).toBe('18.9 MB · saved on this device for next time');
    expect(view.steps[1]!.detail).toBe('Programs for WebGL 2');
    expect(view.percent).toBe(40);
    expect(view.hint).toBe('Ready in a few seconds. Pedal easy while you wait.');
    expect(view.status).toBe('Building the shaders, 40 percent.');
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
});
