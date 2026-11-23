import { InjectionToken } from '@angular/core';
import type { World } from './world';

/** How far a world's download has come, in bytes (L2-152 AC2). */
export interface WorldDownloadProgress {
  readonly received: number;
  readonly total: number;
}

/**
 * A stopped download (L2-156 AC1): the bytes it had received of the total when it stopped. A screen branches on `code`;
 * `offline` when the network is down and nothing is saved (AC5), `download_stopped` when it stopped part way.
 */
export class WorldDownloadError extends Error {
  constructor(
    readonly code: 'offline' | 'download_stopped',
    readonly progress: WorldDownloadProgress,
  ) {
    super(code === 'offline' ? 'The network is down.' : 'The download stopped.');
    this.name = 'WorldDownloadError';
  }
}

/**
 * Downloads a world's assets onto the device (L2-152, L2-156, L2-165): `main`'s worlds are drawn by code, so a world's
 * assets are the files its scene reads, its panorama where it has one. A world saved on this device resolves at once.
 * After a stopped download, the next call for the same world resumes from the bytes already received (L2-156 AC2).
 * A finished download is kept on the device only while the rider keeps worlds (L2-165 AC3).
 */
export interface WorldDownloader {
  /** The world's size in bytes once it is on the device; its name is kept with it, for This device (L2-165 AC1). */
  download(
    world: Pick<World, 'id' | 'name'>,
    progress: (progress: WorldDownloadProgress) => void,
    signal: AbortSignal,
  ): Promise<number>;
}

export const WORLD_DOWNLOADER = new InjectionToken<WorldDownloader>('WORLD_DOWNLOADER');
