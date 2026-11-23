import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Segment, SegmentKind } from '@telo/api';
import { formatClock } from '../metric/format-clock';

/** How each kind reads, its profile element and its bar height in the profile's 32-unit box. */
const KINDS: Record<SegmentKind, { label: string; element: string; y: number }> = {
  'warm-up': { label: 'Warm-up', element: 'warmup', y: 24 },
  work: { label: 'Work', element: 'work', y: 8 },
  recover: { label: 'Recover', element: 'rest', y: 26 },
  steady: { label: 'Steady', element: 'steady', y: 14 },
  'cool-down': { label: 'Cool-down', element: 'cooldown', y: 24 },
};

/** The gap between two bars of the profile, as a share of the plan's length (the mock's 3.6 of 1800). */
const GAP = 0.002;

/**
 * The segment card of the bike panel (design-system blocks class-segment and class-profile): the segment's kind with
 * its swatch, the time left as a timer ("Recover: 1:30 left"), its progress bar, and the plan's resistance profile
 * (L2-089 AC1). It spans both columns on a phone.
 */
@Component({
  selector: 'wz-class-segment',
  templateUrl: './class-segment.html',
  styleUrl: './class-segment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassSegment {
  readonly segments = input.required<readonly Segment[]>();
  readonly index = input.required<number>();
  /** Seconds left in the segment; the countdown shows them rounded up, so it agrees with the ride clock. */
  readonly remaining = input.required<number>();
  /** How much of the segment has passed, 0 to 1. */
  readonly progress = input.required<number>();

  protected readonly kind = computed(() => this.segments()[this.index()].kind);
  protected readonly label = computed(() => KINDS[this.kind()].label);
  protected readonly left = computed(() => formatClock(Math.ceil(this.remaining())));
  protected readonly length = computed(() =>
    this.segments().reduce((total, segment) => total + segment.duration, 0),
  );

  protected readonly bars = computed(() => {
    const gap = this.length() * GAP;
    let start = 0;
    return this.segments().map((segment) => {
      const { element, y } = KINDS[segment.kind];
      const bar = {
        element: `class-profile__${element}`,
        x: start + gap,
        width: Math.max(0, segment.duration - 2 * gap),
        y,
        height: 32 - y,
      };
      start += segment.duration;
      return bar;
    });
  });
}
