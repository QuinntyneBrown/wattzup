import { Injectable, computed, inject } from '@angular/core';
import { HEART_RATE_STRAP } from '@telo/api';
import { BikeTelemetry } from './bike-telemetry';

/**
 * The heart rate a ride shows (docs/detailed-designs/bike/show-heart-rate): the strap's bpm when it reports one, else
 * the bike's, else `null`, read "—" and announced as "No heart rate" (L2-030). The strap and the bike each blank
 * their own value after 5 quiet seconds, so a dropped strap gives way within 5 seconds (L2-031 AC4).
 */
@Injectable()
export class HeartRateSource {
  private readonly strap = inject(HEART_RATE_STRAP);
  private readonly telemetry = inject(BikeTelemetry);

  readonly bpm = computed(() => this.strap.bpm() ?? this.telemetry.heartRate());
  readonly announcement = computed(() => {
    const bpm = this.bpm();
    return bpm === null ? 'No heart rate' : `Heart rate ${bpm} bpm`;
  });
}
