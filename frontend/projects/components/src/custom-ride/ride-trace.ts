import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { TraceSegment } from './ride-kind';
import { TRACE_HEIGHT, traceArea, traceBlocks, tracePoints } from './ride-trace-geometry';

/**
 * Power against the plan (design-system block ride-trace, L2-103 AC3): the plan's target blocks, the rider's power as a
 * line over its area, the playhead at the time ridden, and the maximum at the top. The page labels it in words.
 */
@Component({
  selector: 'wz-ride-trace',
  templateUrl: './ride-trace.html',
  styleUrl: './ride-trace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ride-trace' },
})
export class RideTrace {
  readonly segments = input.required<readonly TraceSegment[]>();
  /** The rider's average power over each bucket of seconds ridden. */
  readonly averages = input.required<readonly number[]>();
  readonly bucket = input.required<number>();
  /** Whole seconds ridden. */
  readonly elapsed = input.required<number>();
  /** The plan's length in seconds: the trace's width. */
  readonly total = input.required<number>();
  /** The watts at the top. */
  readonly max = input.required<number>();
  readonly label = input.required<string>();

  protected readonly height = TRACE_HEIGHT;
  protected readonly viewBox = computed(() => `0 0 ${this.total()} ${TRACE_HEIGHT}`);
  protected readonly grid = [100, 200, 300, 400, 500];
  protected readonly blocks = computed(() =>
    traceBlocks(this.segments(), this.max(), this.elapsed()),
  );
  protected readonly points = computed(() =>
    tracePoints(this.averages(), this.bucket(), this.max()),
  );
  protected readonly area = computed(() => traceArea(this.averages(), this.bucket(), this.max()));
}
