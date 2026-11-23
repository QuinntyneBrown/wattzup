import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Segment } from '@telo/api';
import { Button } from '../button/button';
import { ClassProfile } from '../class-library/class-profile';
import { formatClock } from '../metric/format-clock';

/** One line of the preview: its name and what it reads. */
export interface PlanPreviewFact {
  readonly name: string;
  readonly value: string;
}

/**
 * "Your ride" (design-system block plan-preview, L2-099): the plan's total, its resistance profile from 0:00 to the
 * total, its facts, the legend and Start ride, off with the reason under it while the ride cannot start (L2-099 AC4,
 * L2-100 AC3).
 */
@Component({
  selector: 'aside[wz-plan-preview]',
  imports: [Button, ClassProfile],
  templateUrl: './plan-preview.html',
  styleUrl: './plan-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'plan-preview', 'aria-labelledby': 'preview-title' },
})
export class PlanPreview {
  readonly segments = input.required<readonly Segment[]>();
  readonly totalSeconds = input.required<number>();
  readonly facts = input.required<readonly PlanPreviewFact[]>();
  /** Why the ride cannot start, shown under Start ride, which is then off; `null` when it can. */
  readonly blocked = input<string | null>(null);
  readonly started = output<void>();
  protected readonly total = computed(() => formatClock(this.totalSeconds()));
}
