import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { SAVED_WORLDS, type SavedWorld } from '@telo/api';
import { savedWorldsView, worldSize } from './saved-worlds-view';

/** How long the toast after clearing stays before it closes on its own (docs/mocks/pages/settings/cleared.html). */
export const TOAST_MS = 6_000;

/**
 * This device's Saved worlds on Settings (L2-165 AC1, AC2): lists the worlds this device keeps when the page opens, and
 * on Clear saved worlds deletes them, lists again and raises the toast with the bytes freed, which closes after 6
 * seconds or with ×. Provided on the Settings page; its timer goes with it.
 */
@Injectable()
export class SavedWorldsStore {
  private readonly saved = inject(SAVED_WORLDS);
  private readonly worlds = signal<readonly SavedWorld[] | null>(null);
  private readonly freedBytes = signal<number | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  /** The row's words, once the worlds are listed. */
  readonly view = computed(() => {
    const worlds = this.worlds();
    return worlds === null ? null : savedWorldsView(worlds);
  });

  /** The toast's figure after clearing ("61 MB"), or null with no toast. */
  readonly freed = computed(() => {
    const bytes = this.freedBytes();
    return bytes === null ? null : worldSize(bytes);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    void this.list();
  }

  async clear(): Promise<void> {
    const bytes = (this.worlds() ?? []).reduce((total, world) => total + world.bytes, 0);
    await this.saved.clear();
    await this.list();
    clearTimeout(this.timer);
    this.freedBytes.set(bytes);
    this.timer = setTimeout(() => this.dismiss(), TOAST_MS);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.freedBytes.set(null);
  }

  private async list(): Promise<void> {
    this.worlds.set(await this.saved.list().catch(() => []));
  }
}
