import { Injectable } from '@angular/core';

/** How far the video may drift from the ride clock plus the offset before it seeks back (L2-088 AC2). */
export const DRIFT_LIMIT_SECONDS = 1.5;

/**
 * Keeps the class video on the ride clock (docs/detailed-designs/classes/ride-a-class): the clock leads, and the video
 * should be at the ride's elapsed time plus the class's sync offset (ADR 0012).
 */
@Injectable()
export class VideoClockSync {
  /** The time to seek the video to when it is more than 1.5 s from `elapsed + offset`, otherwise `null`. */
  check(videoTime: number, elapsed: number, offset: number): number | null {
    const due = elapsed + offset;
    return Math.abs(videoTime - due) > DRIFT_LIMIT_SECONDS ? due : null;
  }
}
