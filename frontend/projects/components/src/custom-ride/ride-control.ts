import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { formatClock } from '../metric/format-clock';

/** One target resistance sent: at which second of the ride, which level, whose, and its acknowledgement time. */
export interface RideSentRow {
  /** Whole seconds of the ride clock; `null` when no ride clock ran. */
  readonly rideTime: number | null;
  readonly level: number;
  readonly source: 'plan' | 'manual';
  readonly ackMs: number | null;
}

/** The levels a bar can pick, 1 to 32. */
const LEVELS = Array.from({ length: 32 }, (_, i) => i + 1);

/**
 * The bike control (design-system block ride-control, L2-028, L2-029): "Resistance" with Lower and Raise around the
 * bike's level, the 32 "Level N" bars, the current one `aria-current`, those up to it on, the note on who sets the
 * level, and "Sent to bike" under the link's name, newest first. With the bike away every control is off.
 */
@Component({
  selector: 'aside[wz-ride-control]',
  templateUrl: './ride-control.html',
  styleUrl: './ride-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ride-control', 'aria-labelledby': 'resistance-title' },
})
export class RideControl {
  /** The bike's resistance, or `null` while unknown. */
  readonly level = input<number | null>(null);
  readonly canControl = input(false);
  /** Whether a bike is connected: without one, an empty log says nothing was sent. */
  readonly connected = input(false);
  /** Who sets the level: "Following the plan — …" or "Holding a flat level …". */
  readonly mode = input.required<string>();
  /** The link's name, "BLE · 0bf669f1"; `null` with no bike. */
  readonly link = input<string | null>(null);
  readonly rows = input<readonly RideSentRow[]>([]);
  readonly lower = output<void>();
  readonly raise = output<void>();
  readonly picked = output<number>();

  protected readonly levels = LEVELS;
  protected readonly clock = formatClock;
  protected readonly atMin = computed(() => this.level() !== null && this.level()! <= 1);
  protected readonly atMax = computed(() => this.level() !== null && this.level()! >= 32);
}
