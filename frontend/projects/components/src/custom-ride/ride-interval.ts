import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Segment, SegmentKind } from '@telo/api';
import { formatClock } from '../metric/format-clock';
import { RIDE_KINDS as KINDS } from './ride-kind';

/**
 * The current interval (design-system block ride-interval, L2-102 AC2): its kind and round, the time left in it, a bar
 * that eases over each second (a timer, so reduced motion keeps it), and what comes next, or "Last stretch".
 */
@Component({
  selector: 'wz-ride-interval',
  templateUrl: './ride-interval.html',
  styleUrl: './ride-interval.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ride-interval',
    '[style.--value]': 'percent() + "%"',
    '[class.ride-kind--warmup]': 'modifier() === "warmup"',
    '[class.ride-kind--work]': 'modifier() === "work"',
    '[class.ride-kind--rest]': 'modifier() === "rest"',
    '[class.ride-kind--steady]': 'modifier() === "steady"',
    '[class.ride-kind--cooldown]': 'modifier() === "cooldown"',
  },
})
export class RideInterval {
  readonly kind = input.required<SegmentKind>();
  readonly round = input<{ readonly number: number; readonly of: number } | null>(null);
  /** Whole seconds left in the interval. */
  readonly left = input.required<number>();
  /** How much of the interval has passed, 0 to 100. */
  readonly percent = input.required<number>();
  readonly next = input<Segment | null>(null);

  protected readonly label = computed(() => KINDS[this.kind()].label);
  protected readonly modifier = computed(() => KINDS[this.kind()].modifier);
  protected readonly countdown = computed(() => formatClock(this.left()));
  protected readonly now = computed(() => Math.round(this.percent()));
  protected readonly nextLabel = computed(() => {
    const next = this.next();
    return next === null ? null : KINDS[next.kind].label;
  });
  protected readonly clock = formatClock;
}
