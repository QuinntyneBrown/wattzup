import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';
import { FullscreenToggle } from '../fullscreen-toggle/fullscreen-toggle';
import { Lockup } from '../lockup/lockup';

/** What the ride's one run button does: start a ride waiting for its bike, pause it, or resume it (L2-105, L2-106). */
export type RideRun = 'start' | 'pause' | 'resume';

/** How the ride header's bike status reads: connected, lost, or with no bike at all (L2-019). */
export type RideBikeTone = 'ok' | 'alert' | 'none';

/**
 * The custom ride's header (design-system block ride-header, L2-101): the lockup, the bike status, the workout link the
 * page projects (`slot=workout`), the clock as "6:52 / 30:00" read "Elapsed 6:52 of 30:00", the run button (Start, Pause or
 * Resume, its label saying what it does), End, the page's ride controls (`slot=end`) and Full screen.
 */
@Component({
  selector: 'header[wz-ride-header]',
  imports: [Button, FullscreenToggle, Lockup],
  templateUrl: './ride-header.html',
  styleUrl: './ride-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ride-header' },
})
export class RideHeader {
  /** The bike's name, shown while connected or lost; `null` with no bike. */
  readonly bikeName = input<string | null>(null);
  /** The bike status's words: "Connected", "Disconnected", "No bike connected", "Bluetooth is off". */
  readonly bikeState = input.required<string>();
  readonly bikeTone = input<RideBikeTone>('none');
  readonly clock = input.required<string>();
  readonly total = input.required<string>();
  readonly run = input<RideRun>('pause');
  readonly runDisabled = input(false);
  readonly ran = output<void>();
  /** End: saves and submits the ride, with no confirmation (L2-108 AC1); off until the ride has started. */
  readonly endDisabled = input(false);
  readonly stopped = output<void>();
  readonly fullscreen = input.required<boolean>();
  readonly fullscreenToggled = output<void>();
}
