import { Injectable, computed, inject, signal } from '@angular/core';
import { RIDE_SETTINGS, type VoicePackState, type VoicePackStore } from '@telo/api';

const ABSENT_STATE: VoicePackState = {
  status: 'absent',
  downloadedBytes: 0,
  totalBytes: 0,
  errorCode: null,
  errorMessage: null,
};

/**
 * Lazily loads `@telo/ai`'s `OpfsVoicePackStore` on demand so no AI code enters the initial bundle
 * or Settings chunk until needed (L2-168, L2-173 AC1).
 */
@Injectable()
export class VoicePackSettingsStore {
  private readonly rideSettings = inject(RIDE_SETTINGS);
  private readonly loadedStore = signal<VoicePackStore | null>(null);

  readonly state = computed<VoicePackState>(() => this.loadedStore()?.state() ?? ABSENT_STATE);
  readonly freedMegabytes = computed<number | null>(
    () => this.loadedStore()?.freedMegabytes() ?? null,
  );

  async refresh(): Promise<void> {
    const store = await this.ensureStore();
    await store.refresh();
  }

  async download(): Promise<void> {
    const store = await this.ensureStore();
    await store.download();
  }

  cancel(): void {
    this.loadedStore()?.cancel();
  }

  async remove(): Promise<void> {
    const store = await this.ensureStore();
    await store.remove();
    this.rideSettings.set('raceAnnouncer', false);
  }

  dismissFreed(): void {
    this.loadedStore()?.dismissFreed();
  }

  private async ensureStore(): Promise<VoicePackStore> {
    const existing = this.loadedStore();
    if (existing) return existing;
    const { OpfsVoicePackStore } = await import('@telo/ai');
    const created = new OpfsVoicePackStore();
    this.loadedStore.set(created);
    return created;
  }
}
