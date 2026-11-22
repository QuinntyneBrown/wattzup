import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Segment } from '@telo/api';
import { ClassProfile } from '../class-library/class-profile';
import { formatClock } from '../metric/format-clock';

/** One line of the preview: its name and what it reads. */
export interface PlanPreviewFact {
  readonly name: string;
  readonly value: string;
}

/**
 * "Your ride" (design-system block plan-preview, L2-099): the plan's total, its resistance profile from 0:00 to the
 * total, its facts and the legend. Start ride joins its foot in slice 21.3.
 */
@Component({
  selector: 'aside[wz-plan-preview]',
  imports: [ClassProfile],
  templateUrl: './plan-preview.html',
  styleUrl: './plan-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'plan-preview', 'aria-labelledby': 'preview-title' },
})
export class PlanPreview {
  readonly segments = input.required<readonly Segment[]>();
  readonly totalSeconds = input.required<number>();
  readonly facts = input.required<readonly PlanPreviewFact[]>();
  protected readonly total = computed(() => formatClock(this.totalSeconds()));
}
