import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RIDE_KINDS, type TraceSegment } from './ride-kind';

/**
 * The progress strip under the video (design-system block ride-progress, L2-103 AC4): the plan's segments in their
 * colours across the ride, those ridden faded, and a head at the time ridden. The page labels it in words.
 */
@Component({
  selector: 'wz-ride-progress',
  templateUrl: './ride-progress.html',
  styleUrl: './ride-progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideProgress {
  readonly segments = input.required<readonly TraceSegment[]>();
  readonly elapsed = input.required<number>();
  readonly total = input.required<number>();
  readonly label = input.required<string>();

  protected readonly viewBox = computed(() => `0 0 ${this.total()} 1`);
  /** The head's width: 0.3 % of the ride. */
  protected readonly head = computed(() => this.total() * 0.003);
  protected readonly bars = computed(() => {
    let start = 0;
    return this.segments().map((segment) => {
      const bar = {
        modifier: RIDE_KINDS[segment.kind].modifier,
        x: start,
        width: segment.duration,
        past: start + segment.duration <= this.elapsed(),
      };
      start += segment.duration;
      return bar;
    });
  });
}
