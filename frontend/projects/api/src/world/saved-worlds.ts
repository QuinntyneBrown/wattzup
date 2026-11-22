import { InjectionToken } from '@angular/core';
import type { WorldId } from './world';

/** A world kept on this device after a ride (L2-165): its id, its name and its size in bytes. */
export interface SavedWorld {
  readonly id: WorldId;
  readonly name: string;
  readonly bytes: number;
}

/**
 * The worlds this device keeps, which Settings' This device lists and clears (L2-165 AC1, AC2). The browser may evict
 * them at any time; a world it evicted is simply not listed, and downloads again when next ridden (AC4).
 */
export interface SavedWorlds {
  /** The saved worlds, in the order they were saved; none where the browser keeps nothing. */
  list(): Promise<readonly SavedWorld[]>;
  /** Deletes every saved world. */
  clear(): Promise<void>;
}

export const SAVED_WORLDS = new InjectionToken<SavedWorlds>('SAVED_WORLDS');
