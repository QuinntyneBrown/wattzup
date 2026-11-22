import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FULLSCREEN } from '@telo/api';
import {
  RideHeader,
  RideInterval,
  RideMetrics,
  RideReadouts,
  RideView,
  RideWorkoutLink,
} from '@telo/components';
import {
  BikeTelemetry,
  ResistanceController,
  RideClock,
  RideTicker,
  RideTotals,
  WorkoutEngine,
} from '@telo/domain';
import { CustomRideStore } from './custom-ride-store';

/**
 * The custom ride (docs/mocks/pages/custom-ride/, L2-101 to L2-104) at `/profile/custom/ride`: the ride header, the
 * telemetry with Power, Cadence and the interval card, the main view and the metrics. Every part of the ride is provided here, so leaving the page
 * stops the clock and the ticker and releases them.
 */
@Component({
  selector: 'wz-custom-ride-page',
  imports: [
    RideHeader,
    RideInterval,
    RideMetrics,
    RideReadouts,
    RideView,
    RideWorkoutLink,
    RouterLink,
  ],
  providers: [
    CustomRideStore,
    RideClock,
    RideTicker,
    WorkoutEngine,
    ResistanceController,
    BikeTelemetry,
    RideTotals,
  ],
  templateUrl: './custom-ride-page.html',
  styleUrl: './custom-ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'custom-ride', '(window:beforeunload)': 'confirmLeaving($event)' },
})
export default class CustomRidePage {
  protected readonly store = inject(CustomRideStore);
  protected readonly fullscreen = inject(FULLSCREEN);

  protected toggleFullscreen(): void {
    if (this.fullscreen.active()) this.fullscreen.exit();
    else this.fullscreen.enter();
  }

  /** Closing or reloading the tab mid-ride asks the rider to confirm (L2-133 AC4); the listener goes with the page. */
  protected confirmLeaving(event: BeforeUnloadEvent): void {
    event.preventDefault();
  }
}
