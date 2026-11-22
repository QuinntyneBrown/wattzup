import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Power against its target: "On target" within 10 %, otherwise the signed delta, over or under. */
export interface RideDelta {
  readonly text: string;
  readonly tone: 'on' | 'over' | 'under';
}

/**
 * The custom ride's readouts (design-system block ride-readouts, L2-102 AC1): Power with its target and how far off it
 * the rider is, Cadence with its aim, then the interval card the page projects.
 */
@Component({
  selector: 'wz-ride-readouts',
  templateUrl: './ride-readouts.html',
  styleUrl: './ride-readouts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ride-readouts' },
})
export class RideReadouts {
  /** Watts, or "—" while unknown. */
  readonly power = input.required<string>();
  readonly target = input<number | null>(null);
  readonly delta = input<RideDelta | null>(null);
  /** Rpm, or "—" while unknown. */
  readonly cadence = input.required<string>();
  readonly aim = input<number | null>(null);
}
