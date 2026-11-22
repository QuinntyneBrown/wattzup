import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';

/**
 * "Leave this ride?" (design-system block ride-leave, L2-107): how far the ride went, and the three choices, each
 * emitted: save it and open the library, discard it and open the library, or keep riding. The dialog that holds it
 * labels it by `leave-title` and starts the focus on `#leave-save`.
 */
@Component({
  selector: 'wz-ride-leave',
  imports: [Button],
  templateUrl: './ride-leave.html',
  styleUrl: './ride-leave.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ride-leave' },
})
export class RideLeave {
  /** The ride's clock, as "6:52". */
  readonly elapsed = input.required<string>();
  /** The distance ridden, as "2.24 km". */
  readonly distance = input.required<string>();
  readonly saved = output<void>();
  readonly discarded = output<void>();
  readonly kept = output<void>();
}
