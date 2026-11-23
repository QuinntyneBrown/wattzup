import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { PreparedWorld, World } from '@telo/api';
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
  ClassWorld,
} from '@telo/components';
import {
  BikeTelemetry,
  ResistanceController,
  RideClock,
  RideTicker,
  VideoClockSync,
  WorkoutEngine,
} from '@telo/domain';
import { ClassRideStore } from './class-ride-store';
import { ClassWorldScene } from './class-world-scene';
import { FullscreenButton } from '../fullscreen/fullscreen-button';

/**
 * The class ride (docs/mocks/pages/class-ride/, solo), which `ClassRidePage` shows once the rider presses Start riding on
 * World loading, or at once in a group: the header with the class and its clock,
 * the class video (in the corner of the class's world when World loading got it ready), and the bike panel with the segment card, Power, Cadence and the resistance stepper. Every part of the ride is
 * provided here, so leaving the page stops the clock and the ticker and releases them.
 */
@Component({
  selector: 'wz-class-ride-session',
  imports: [
    FullscreenButton,
    Button,
    ClassBike,
    ClassBoard,
    ClassHeader,
    ClassLost,
    ClassResist,
    ClassSegment,
    ClassStat,
    ClassVideo,
    ClassWorld,
    ClassWorldScene,
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
  ],
})
export class ClassRideSession {
  protected readonly store = inject(ClassRideStore);
  /** The class's world from World loading; `null` rides the video alone (a group ride until slice 16.4). */
  readonly world = input<World | null>(null);
  /** The world's panorama, under the world and in its place when it is not drawn. */
  readonly panorama = input<{ readonly url: string; readonly alt: string } | null>(null);
  /** The renderer World loading warmed up, with its canvas, handed over by Start riding (L2-153 AC3, AC5). */
  readonly prepared = input<PreparedWorld | null>(null);

  /** Closing or reloading the tab mid-ride asks the rider to confirm (L2-133 AC4); the listener goes with the page. */
  protected confirmLeaving(event: BeforeUnloadEvent): void {
    if (this.store.ride()) event.preventDefault();
  }
}
