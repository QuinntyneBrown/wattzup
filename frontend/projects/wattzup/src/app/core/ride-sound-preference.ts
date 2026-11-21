// Ride sound's volume, kept in this browser: 60 % until the rider chooses (L2-129 AC3). On or off
// is not kept; every page load starts off (AC1).
import { Injectable, signal } from '@angular/core';
import { SafeStorage } from '@wattzup/api';

export const RIDE_SOUND_VOLUME_KEY = 'wattzup.rideSound.volume';
const DEFAULT = 60;

/** 0 to 100 in steps of 5. */
function clamp(percent: number): number {
  return Math.min(Math.max(Math.round(percent / 5) * 5, 0), 100);
}

function read(kept: string | null): number {
  const n = kept === null || kept.trim() === '' ? NaN : Number(kept);
  return Number.isFinite(n) ? clamp(n) : DEFAULT;
}

@Injectable({ providedIn: 'root' })
export class RideSoundPreference {
  private readonly storage = new SafeStorage(() => localStorage);
  private readonly _volume = signal(read(this.storage.get(RIDE_SOUND_VOLUME_KEY)));
  /** Percent, 0 to 100. */
  readonly volume = this._volume.asReadonly();

  setVolume(percent: number): void {
    this._volume.set(clamp(percent));
    this.storage.set(RIDE_SOUND_VOLUME_KEY, String(this._volume()));
  }
}
