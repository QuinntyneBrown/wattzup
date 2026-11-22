import { DOCUMENT, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { DEVICE_CHECK, type DeviceCheckProgress, GRAPHICS_SUPPORT, RIDE_SETTINGS } from '@telo/api';
import { deviceCheckLevels } from '@telo/domain';

/**
 * "Check this device" on Settings (L2-162): runs the device check, loaded with the world library on the rider's press,
 * holds where it stands while it runs, and keeps what it found in the ride settings, where Auto reads it (AC3). Stopped,
 * with the tab hidden or when the rider leaves Settings, it ends the check and keeps nothing (AC6). Provided on the
 * Settings page.
 */
@Injectable()
export class DeviceCheckStore {
  private readonly load = inject(DEVICE_CHECK);
  private readonly store = inject(RIDE_SETTINGS);
  private readonly api = inject(GRAPHICS_SUPPORT).api;
  private readonly document = inject(DOCUMENT);
  private readonly now = signal<DeviceCheckProgress | null>(null);
  private abort: AbortController | null = null;

  /** Where the running check stands; null when it is not running. */
  readonly progress = this.now.asReadonly();
  readonly running = computed(() => this.now() !== null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  async start(): Promise<void> {
    const api = this.api();
    if (this.abort || !api) return;
    const { graphics } = this.store.settings();
    const levels = deviceCheckLevels(api, graphics);
    if (levels.length === 0) return;
    const abort = new AbortController();
    this.abort = abort;
    this.now.set({ level: levels[0]!, secondsLeft: 30, percent: 0, tried: [] });
    const hidden = () => {
      if (this.document.hidden) this.stop();
    };
    this.document.addEventListener('visibilitychange', hidden);
    try {
      const check = await this.load();
      if (abort.signal.aborted) return;
      const outcome = await check.run({
        levels,
        forceWebGL: graphics === 'webgl2',
        progress: (progress) => {
          if (!abort.signal.aborted) this.now.set(progress);
        },
        signal: abort.signal,
      });
      if (outcome && !abort.signal.aborted) {
        this.store.set('deviceCheck', { ...outcome, checkedAt: new Date().toISOString() });
      }
    } catch {
      // A world that failed to draw finds nothing, as a stopped check (AC6).
    } finally {
      this.document.removeEventListener('visibilitychange', hidden);
      if (this.abort === abort) {
        this.abort = null;
        this.now.set(null);
      }
    }
  }

  /** Ends the check: the runner lets go of everything it drew with, and nothing is kept (AC6). */
  stop(): void {
    this.abort?.abort();
    this.abort = null;
    this.now.set(null);
  }
}
