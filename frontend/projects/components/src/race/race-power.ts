import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Power against the segment's target: "-47 W" under it, "+12 W" over, or "On target" within 10 % (L2-059 AC1, AC2). */
export interface RaceDelta {
  readonly text: string;
  readonly tone: 'on' | 'under' | 'over';
}

/** A gap beside the rider's place: "Ahead" with "+0:02", "Behind" with "−0:01", or "Best" with the ghost's. */
export interface RaceGap {
  readonly label: string;
  readonly value: string;
}

/**
 * The race's power and position panel (design-system block race-power, docs/mocks/pages/race/): the rider's place
 * ("5th / 10"), power as the biggest number ("371 W"), the target with the delta, and Cadence, Heart and Speed
 * (L2-059). The values arrive formatted, "—" for one that is unknown.
 */
@Component({
  selector: 'wz-race-power',
  templateUrl: './race-power.html',
  styleUrl: './race-power.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacePower {
  /** "5th", or "Ahead" or "Behind" in a solo race. */
  readonly place = input.required<string>();
  /** The field's size, or `null` in a solo race. */
  readonly field = input<number | null>(null);
  readonly gaps = input<readonly RaceGap[]>([]);
  readonly watts = input.required<string>();
  /** The segment's target in watts, or `null` once the plan has ended. */
  readonly target = input<number | null>(null);
  readonly delta = input<RaceDelta | null>(null);
  readonly cadence = input.required<string>();
  readonly heart = input.required<string>();
  readonly speed = input.required<string>();
}
