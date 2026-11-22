// The world's assets as the app serves them (`/worlds/<id>/panorama.webp`), answered by the spec so it can hold a
// download, stop it part way or watch it resume (L2-152, L2-156).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page, Request, Route } from '@playwright/test';

/** Old Town Criterium's panorama, the asset 30 Minute HIIT Cardio's world downloads. */
export const OLDTOWN_PANORAMA = readFileSync(
  join(__dirname, '../../projects/ride/public/worlds/oldtown/panorama.webp'),
);

/** Bytes as the load card reads them, in megabytes to one decimal place. */
export const megabytes = (bytes: number): string => (bytes / 1_000_000).toFixed(1);

export class WorldAssets {
  /** Every download of the panorama the page made (its fetches, not the `<img>` behind World loading), in order. */
  readonly requests: Request[] = [];
  private held: Route[] = [];
  private holding = false;
  private stopAt: number | null = null;

  /** Answers Old Town Criterium's panorama from now on, whole unless the spec holds or stops it. */
  static async install(page: Page): Promise<WorldAssets> {
    const assets = new WorldAssets();
    await page.route('**/worlds/oldtown/panorama.webp', (route) => assets.answer(route));
    return assets;
  }

  /** Holds every download until `release`; the `<img>` behind World loading is still answered. */
  hold(): void {
    this.holding = true;
  }

  /** Answers the held requests and every one after. */
  async release(): Promise<void> {
    this.holding = false;
    const held = this.held;
    this.held = [];
    for (const route of held) await this.answer(route);
  }

  /** The next download stops after `bytes`: it promises the whole panorama and sends only its start. */
  stopAfter(bytes: number): void {
    this.stopAt = bytes;
  }

  private async answer(route: Route): Promise<void> {
    const download = route.request().resourceType() === 'fetch';
    if (download && !this.requests.includes(route.request())) this.requests.push(route.request());
    if (download && this.holding) {
      this.held.push(route);
      return;
    }
    const total = OLDTOWN_PANORAMA.length;
    const range = /^bytes=(\d+)-$/.exec(route.request().headers()['range'] ?? '');
    if (download && this.stopAt !== null) {
      const stop = this.stopAt;
      this.stopAt = null;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'image/webp', 'content-length': String(total) },
        body: OLDTOWN_PANORAMA.subarray(0, stop),
      });
      return;
    }
    if (range) {
      const from = Number(range[1]);
      await route.fulfill({
        status: 206,
        headers: {
          'content-type': 'image/webp',
          'content-range': `bytes ${from}-${total - 1}/${total}`,
        },
        body: OLDTOWN_PANORAMA.subarray(from),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'image/webp', body: OLDTOWN_PANORAMA });
  }

  /** Whether the page gave up the request at `index` (its download was aborted). */
  async aborted(index: number): Promise<boolean> {
    const request = this.requests[index];
    if (!request) return false;
    return (await request.response().catch(() => null)) === null && request.failure() !== null;
  }

  /** Lets go of any request still held, so the page's teardown does not wait on it. */
  async dispose(): Promise<void> {
    const held = this.held;
    this.held = [];
    for (const route of held) await route.abort().catch(() => undefined);
  }
}
