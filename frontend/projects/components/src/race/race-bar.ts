import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Backend } from '@telo/api';
import { Lockup } from '../lockup/lockup';
import { RaceBarButton } from './race-bar-button';
import { formatClock } from '../metric/format-clock';

/**
 * The race's top bar (design-system block race-bar, docs/mocks/pages/race/): the lockup, the map and its route line
 * ("Cathedral Circuit · vs Bots, medium", from md), the bike and its link state (from lg), and the clock ("5:01 / 30:00",
 * the total hidden on a phone) as a timer (L2-058 AC1, AC2, AC4), then the race's controls: Pause or Resume in a solo
 * race only (L2-068); the page puts the way back to Race Setup, End or Leave (L2-069), in the `end` slot.
 */
@Component({
  selector: 'wz-race-bar',
  imports: [Lockup, RaceBarButton],
  templateUrl: './race-bar.html',
  styleUrl: './race-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceBar {
  readonly map = input.required<string>();
  /** "Cathedral Circuit · vs Bots, medium". */
  readonly route = input.required<string>();
  /** The GPU API drawing the world, or `null` while none draws it (L2-065 AC1, AC2). */
  readonly backend = input<Backend | null>(null);
  readonly bikeName = input<string | null>(null);
  readonly connected = input(false);
  /** Whole seconds of the race clock. */
  readonly elapsed = input.required<number>();
  /** The plan's length in seconds. */
  readonly total = input.required<number>();
  /** A solo race, which alone can pause and ends with End. */
  readonly solo = input(false);
  readonly paused = input(false);
  /** Pause waits for the bike while it is gone (L2-070 AC2). */
  readonly pauseDisabled = input(false);
  readonly pauseRace = output();
  readonly resumeRace = output();

  protected readonly clock = computed(() => formatClock(this.elapsed()));
  protected readonly length = computed(() => formatClock(this.total()));
}
