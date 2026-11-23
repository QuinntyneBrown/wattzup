import { InjectionToken, type Signal } from '@angular/core';

/** What ride sound follows on a ride screen (L2-163). */
export interface RideSoundSource {
  readonly cadence: Signal<number | null>;
  readonly speedKmh: Signal<number | null>;
  /** The bike's reported resistance, which makes the chain louder. */
  readonly resistance: Signal<number | null>;
  /** The ride runs: not paused, finished or waiting for its bike. */
  readonly running: Signal<boolean>;
  /** A class video plays its own sound, under which ride sound goes quiet when Settings asks (L2-163 AC1). */
  readonly videoPlaying: Signal<boolean>;
}

/**
 * Ride sound: chain, freewheel, tyres and wind made in the browser from the rider's pedalling, while Settings' "Ride
 * sound" is on. With it off no audio context is made (AC3); a change to a sound setting is heard within 100 ms without
 * a click or a gap (AC2).
 */
export interface RideSound {
  /** Plays the ride's sound from `source` until `stop`. */
  play(source: RideSoundSource): void;
  /** Ends the ride's sound and releases its audio context. */
  stop(): void;
}

export const RIDE_SOUND = new InjectionToken<RideSound>('RIDE_SOUND');
