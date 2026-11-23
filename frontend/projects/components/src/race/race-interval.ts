import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Segment, SegmentKind } from '@telo/api';
import { formatClock } from '../metric/format-clock';
import { spokenDuration } from '../metric/spoken-duration';

/** How each kind reads, as a name and in "left in this …". */
const KINDS: Record<SegmentKind, { label: string; noun: string }> = {
  'warm-up': { label: 'Warm-up', noun: 'warm-up' },
  work: { label: 'Work', noun: 'effort' },
  recover: { label: 'Recover', noun: 'recovery' },
  steady: { label: 'Steady', noun: 'steady effort' },
  'cool-down': { label: 'Cool-down', noun: 'cool-down' },
};

/**
 * The race's interval panel (design-system block race-interval, docs/mocks/pages/race/): the segment with its swatch
 * and, for an effort, its round of the plan's efforts ("Work", "1 of 8"), the time left as a timer ("0:29", "29 seconds
 * left in this effort"), its progress bar, and the next segment ("Next: Recover · 3:00 at level 6", L2-061).
 */
@Component({
  selector: 'wz-race-interval',
  templateUrl: './race-interval.html',
  styleUrl: './race-interval.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceInterval {
  readonly segments = input.required<readonly Segment[]>();
  readonly index = input.required<number>();
  /** Seconds left in the segment; the countdown shows them rounded up, so it agrees with the race clock. */
  readonly remaining = input.required<number>();
  /** How much of the segment has passed, 0 to 1. */
  readonly progress = input.required<number>();

  protected readonly kind = computed(() => this.segments()[this.index()].kind);
  protected readonly label = computed(() => KINDS[this.kind()].label);
  protected readonly left = computed(() => formatClock(Math.ceil(this.remaining())));
  protected readonly spokenLeft = computed(
    () => `${spokenDuration(Math.ceil(this.remaining()))} left in this ${KINDS[this.kind()].noun}`,
  );

  /** "1 of 8" for an effort, else nothing. */
  protected readonly round = computed(() => {
    if (this.kind() !== 'work') return null;
    const efforts = this.segments().filter((segment) => segment.kind === 'work');
    const done = this.segments()
      .slice(0, this.index())
      .filter((segment) => segment.kind === 'work').length;
    return `${done + 1} of ${efforts.length}`;
  });

  protected readonly next = computed(() => {
    const next = this.segments()[this.index() + 1];
    return next
      ? {
          label: KINDS[next.kind].label,
          rest: ` · ${formatClock(next.duration)} at level ${next.level}`,
        }
      : null;
  });
}
