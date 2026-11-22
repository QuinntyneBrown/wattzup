import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Button,
  ClassBike,
  ClassBoard,
  ClassHeader,
  ClassLost,
  ClassResist,
  ClassSegment,
  ClassStat,
  ClassVideo,
} from '@telo/components';
import {
  BikeTelemetry,
  ResistanceController,
  RideClock,
  RideTicker,
  VideoClockSync,
  WorkoutEngine,
} from '@telo/domain';
import { LiveSessionStore } from '../live/live-session-store';
import { ClassRideStore } from './class-ride-store';

/**
 * The class ride (docs/mocks/pages/class-ride/, solo), which `ClassRidePage` shows once the rider presses Start riding on
 * World loading, or at once in a group: the header with the class and its clock,
 * the class video, and the bike panel with the segment card, Power, Cadence and the resistance stepper. Every part of the ride is
 * provided here, so leaving the page stops the clock and the ticker and releases them.
 */
@Component({
  selector: 'wz-class-ride-session',
  imports: [
    Button,
    ClassBike,
    ClassBoard,
    ClassHeader,
    ClassLost,
    ClassResist,
    ClassSegment,
    ClassStat,
    ClassVideo,
    RouterLink,
  ],
  templateUrl: './class-ride-session.html',
  styleUrl: './class-ride-session.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:beforeunload)': 'confirmLeaving($event)' },
  providers: [
    ClassRideStore,
    RideClock,
    RideTicker,
    WorkoutEngine,
    ResistanceController,
    BikeTelemetry,
    VideoClockSync,
    LiveSessionStore,
  ],
})
export class ClassRideSession {
  protected readonly store = inject(ClassRideStore);

  /** Closing or reloading the tab mid-ride asks the rider to confirm (L2-133 AC4); the listener goes with the page. */
  protected confirmLeaving(event: BeforeUnloadEvent): void {
    if (this.store.ride()) event.preventDefault();
  }
}
