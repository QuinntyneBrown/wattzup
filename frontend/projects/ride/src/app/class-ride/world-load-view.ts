import type { Backend, LoadStepView, WorldDownloadProgress } from '@telo/api';

/** Where World loading stands (L2-152): downloading, building the shaders and warming up, ready, or stopped. */
export type WorldLoadPhase = 'downloading' | 'building' | 'ready' | 'failed';

export interface WorldLoadState {
  /** The world's name: "Neon Docklands". */
  readonly name: string;
  readonly phase: WorldLoadPhase;
  /** The download's bytes received of its total. */
  readonly progress: WorldDownloadProgress;
  /** The graphics API the world is drawn with, or will be. */
  readonly api: Backend;
  /** Neither WebGPU nor WebGL 2 draws: the class rides the panorama (L2-156 AC4). */
  readonly panoramaOnly: boolean;
  /** The class's warm-up, in seconds, or `null` when it starts with something else. */
  readonly warmUpSeconds: number | null;
  /** The percentage when the download started, which its status announces (L2-152 AC6). */
  readonly startPercent: number;
}

/** World loading in words: the load card's heading, steps, percentage, status and hint (L2-152, L2-153, L2-156). */
export interface WorldLoadView {
  readonly heading: string;
  readonly steps: readonly LoadStepView[];
  readonly percent: number;
  /** The rider can start: the world, or its panorama, is ready. */
  readonly ready: boolean;
  readonly status: string;
  readonly hint: string;
}

/** The download's share of the whole load; the shaders and the warm-up take the rest. */
const DOWNLOAD_SHARE = 40;

const API: Readonly<Record<Backend, string>> = { webgpu: 'WebGPU', webgl2: 'WebGL 2' };

/** Bytes in megabytes to one decimal place: "18.9". */
const megabytes = (bytes: number): string => (bytes / 1_000_000).toFixed(1);

const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * World loading for one moment of the load: the download reads its bytes ("7.6 of 18.9 MB"), then its size saved on the
 * device; the shaders read the graphics API they build for and the warm-up what it is for (their counts and frame
 * rate are slice 16.2's). The percentage weighs the download 40 % and the shaders and warm-up, which `main`'s renderer
 * runs as one, the rest. Without 3D the download is the panorama's and the other two are not needed.
 */
export function worldLoadView(state: WorldLoadState): WorldLoadView {
  const { name, phase, progress, panoramaOnly } = state;
  const fraction = progress.total > 0 ? progress.received / progress.total : 0;
  const percent =
    phase === 'ready'
      ? 100
      : phase === 'building'
        ? DOWNLOAD_SHARE
        : Math.floor(DOWNLOAD_SHARE * fraction);
  const downloaded = phase === 'building' || phase === 'ready';
  const size =
    progress.total === 0
      ? 'Built into the app'
      : panoramaOnly
        ? `${megabytes(progress.total)} MB`
        : `${megabytes(progress.total)} MB · saved on this device for next time`;
  const download: LoadStepView = {
    label: panoramaOnly ? 'Download the panorama' : 'Download the world',
    state: downloaded ? 'done' : phase === 'failed' ? 'failed' : 'current',
    detail: downloaded
      ? size
      : phase === 'failed'
        ? `Stopped at ${megabytes(progress.received)} of ${megabytes(progress.total)} MB`
        : progress.total > 0
          ? `${megabytes(progress.received)} of ${megabytes(progress.total)} MB`
          : '',
  };
  const later = (label: string, detail: string, current: boolean): LoadStepView =>
    panoramaOnly
      ? { label, state: 'skipped', detail: 'Not needed for the panorama' }
      : {
          label,
          state: phase === 'ready' ? 'done' : current ? 'current' : 'waiting',
          detail,
        };
  return {
    heading:
      phase === 'failed'
        ? `Couldn’t load ${name}`
        : phase === 'ready'
          ? panoramaOnly
            ? `${name} is ready as a panorama`
            : `${name} is ready`
          : `Getting ${name} ready`,
    steps: [
      download,
      later('Build the shaders', `Programs for ${API[state.api]}`, phase === 'building'),
      later('Warm up the first frames', 'Drawn off screen so the start is smooth', false),
    ],
    percent,
    ready: phase === 'ready',
    status:
      phase === 'downloading'
        ? `Downloading the world, ${state.startPercent} percent.`
        : phase === 'building'
          ? `Building the shaders, ${DOWNLOAD_SHARE} percent.`
          : phase === 'ready'
            ? `${name} is ready${panoramaOnly ? ' as a panorama' : ''}.`
            : '',
    hint:
      phase === 'downloading'
        ? 'The first time takes longest. Next time this world opens from this device.'
        : phase === 'building'
          ? 'Ready in a few seconds. Pedal easy while you wait.'
          : phase === 'ready'
            ? panoramaOnly
              ? 'Turn on graphics acceleration in Chrome or Edge to ride the 3D world.'
              : state.warmUpSeconds === null
                ? 'Your class starts the moment you press Start.'
                : `Your ${clock(state.warmUpSeconds)} warm-up starts the moment you press Start.`
            : '',
  };
}
