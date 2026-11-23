import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** How a hint reads against its target: on it, under it (warned) or over it. */
export type ClassStatTone = 'on' | 'under' | 'over';

/**
 * One live stat of the bike panel (design-system block class-stat): its label, the number and unit, and a hint under
 * them ("On target", "-47 W", "Aim 72"). A tone styles the hint and its words carry it too (L2-089 AC2, AC3).
 */
@Component({
  selector: 'wz-class-stat',
  templateUrl: './class-stat.html',
  styleUrl: './class-stat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassStat {
  readonly label = input.required<string>();
  /** The number as text, or a dash when unknown. */
  readonly value = input.required<string>();
  readonly unit = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly tone = input<ClassStatTone | null>(null);
}
