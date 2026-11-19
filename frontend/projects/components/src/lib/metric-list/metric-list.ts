import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One metric: its term, formatted value and unit; `heart` marks the heart rate. */
export interface MetricItem {
  term: string;
  value: string;
  unit: string;
  heart: boolean;
}

/** The secondary ride metrics; skeletons while there is no state yet (L2-022). */
@Component({
  selector: 'wz-metric-list',
  templateUrl: './metric-list.html',
  styleUrl: './metric-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricList {
  /** Null while loading. */
  readonly metrics = input<readonly MetricItem[] | null>(null);
  readonly dimmed = input(false);

  protected readonly terms = ['Heart rate', 'Avg power', 'Speed', 'Distance', 'Energy'];
}
