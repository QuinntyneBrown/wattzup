import type { Backend, LoadStepView, WorldDownloadProgress, WorldTier } from '@telo/api';

/** Where World loading stands (L2-152): downloading, building the shaders, warming up, ready, or stopped. */
export type WorldLoadPhase = 'downloading' | 'building' | 'warming' | 'ready' | 'failed';

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
  /** The percentage when the current step started, which its status announces (L2-152 AC6). */
  readonly startPercent: number;
  /** The shader programs built of the total, once the build has counted them (AC4). */
  readonly programs: { readonly built: number; readonly total: number } | null;
  /** The frame rate the warm-up held and the level it held it at, once warmed up (AC5). */
  readonly warmed: { readonly fps: number; readonly tier: WorldTier } | null;
  /** World loading has run 20 seconds without the world being ready, and the rider has not chosen Low (L2-155). */
  readonly slow: boolean;
  /** The whole seconds spent building the shaders, which the slow load adds to their step (L2-155 AC1). */
  readonly shaderSeconds: number;
  /** The percentage when the load became slow, which the slow status announces. */
  readonly slowPercent: number;
  /** The bike is connected; Start riding waits for it, and loading never does (L2-157). */
  readonly bikeConnected: boolean;
}

/** World loading in words: the load card's heading, steps, percentage, status and hint (L2-152, L2-153, L2-156). */
export interface WorldLoadView {
  readonly heading: string;
  readonly steps: readonly LoadStepView[];
  readonly percent: number;
  /** The world, or its panorama, is ready. */
  readonly ready: boolean;
  /** The rider can start: the world is ready and the bike connected (L2-153 AC2, L2-157 AC3). */
  readonly canStart: boolean;
  readonly status: string;
  readonly hint: string;
}

/** The download's share of the whole load, then the shaders'; the warm-up takes the rest. */
const DOWNLOAD_SHARE = 40;
const SHADER_SHARE = 40;

/** A quality level as the card names it: "Low". */
export const TIER_NAME: Readonly<Record<WorldTier, string>> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  ultra: 'Ultra',
};

const API: Readonly<Record<Backend, string>> = { webgpu: 'WebGPU', webgl2: 'WebGL 2' };

/** Bytes in megabytes to one decimal place: "18.9". */
const megabytes = (bytes: number): string => (bytes / 1_000_000).toFixed(1);

const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * World loading for one moment of the load: the download reads its bytes ("7.6 of 18.9 MB"), then its size saved on the
 * device; the shaders the programs built of the total for the graphics API ("41 of 64 programs for WebGPU"), with the
 * seconds spent once the load is slow; the warm-up the frame rate it held ("Holding 60 fps at Low"). The percentage
 * weighs the download 40 %, the shaders 40 % by programs built and the warm-up the rest. Without 3D the download is the
 * panorama's and the other two are not needed.
 */
export function worldLoadView(state: WorldLoadState): WorldLoadView {
  const { name, phase, progress, panoramaOnly, programs, warmed, slow } = state;
  const fraction = progress.total > 0 ? progress.received / progress.total : 0;
  const built = programs && programs.total > 0 ? programs.built / programs.total : 0;
  const percent =
    phase === 'ready'
      ? 100
      : phase === 'warming'
        ? DOWNLOAD_SHARE + SHADER_SHARE
        : phase === 'building'
          ? DOWNLOAD_SHARE + Math.floor(SHADER_SHARE * built)
          : Math.floor(DOWNLOAD_SHARE * fraction);
  const downloaded = phase === 'building' || phase === 'warming' || phase === 'ready';
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
  const api = API[state.api];
  const shadersDone = phase === 'warming' || phase === 'ready';
  const shaderDetail =
    programs === null
      ? `Programs for ${api}`
      : shadersDone
        ? `${programs.total} programs for ${api}`
        : `${programs.built} of ${programs.total} programs for ${api}`;
  const later = (label: string, detail: string, current: boolean, done: boolean): LoadStepView =>
    panoramaOnly
      ? { label, state: 'skipped', detail: 'Not needed for the panorama' }
      : { label, state: done ? 'done' : current ? 'current' : 'waiting', detail };
  const slowNow = slow && phase !== 'ready' && phase !== 'failed';
  const noBike = !state.bikeConnected && phase !== 'failed';
  const bikeStatus = noBike ? ' The bike is not connected.' : '';
  const doing =
    phase === 'downloading'
      ? 'downloading the world'
      : phase === 'building'
        ? 'building the shaders'
        : 'warming up the first frames';
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
      later(
        'Build the shaders',
        slowNow && phase === 'building'
          ? `${shaderDetail} · ${state.shaderSeconds} s`
          : shaderDetail,
        phase === 'building',
        shadersDone,
      ),
      later(
        'Warm up the first frames',
        phase === 'ready' && warmed
          ? `Holding ${warmed.fps} fps at ${TIER_NAME[warmed.tier]}`
          : 'Drawn off screen so the start is smooth',
        phase === 'warming',
        phase === 'ready',
      ),
    ],
    percent,
    ready: phase === 'ready',
    canStart: phase === 'ready' && state.bikeConnected,
    status:
      phase === 'failed'
        ? ''
        : (slowNow
            ? `Still ${doing}, ${state.slowPercent} percent.`
            : phase === 'ready'
              ? `${name} is ready${panoramaOnly ? ' as a panorama' : ''}.`
              : `${doing[0]!.toUpperCase()}${doing.slice(1)}, ${state.startPercent} percent.`) +
          bikeStatus,
    hint: slowNow
      ? 'Or keep waiting: Start riding turns on when the world is ready.'
      : noBike
        ? 'Start riding turns on when the bike is connected and the world is ready.'
        : phase === 'downloading'
          ? 'The first time takes longest. Next time this world opens from this device.'
          : phase === 'building' || phase === 'warming'
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
