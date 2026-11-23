import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Segment } from '@telo/api';
import { ClassProfile } from '../class-library/class-profile';
import { formatClock } from '../metric/format-clock';

/**
 * "What the bike will do" on Class Start (design-system block class-plan): the class's length, its resistance profile
 * as an image named "Resistance profile", and the plan's structure with its expected average power (L2-084 AC2).
 */
@Component({
  selector: 'wz-class-plan',
  imports: [ClassProfile],
  templateUrl: './class-plan.html',
  styleUrl: './class-plan.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassPlan {
  readonly lengthSeconds = input.required<number>();
  readonly segments = input.required<readonly Segment[]>();
  /** "8 × 0:30 · 3:00 → 1:30 recover · ~154 W average". */
  readonly summary = input.required<string>();

  protected readonly total = computed(() => formatClock(this.lengthSeconds()));
}
