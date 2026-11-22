import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One metric: its name, its value ("—" while unknown) and its unit. */
export interface RideMetric {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

/**
 * The ride's metrics (design-system block ride-metrics, L2-104 AC1, AC2): heart rate, average power, speed, distance
 * and energy, two columns on a phone and five from sm. Heart rate is drawn in its own colour.
 */
@Component({
  selector: 'dl[wz-ride-metrics]',
  templateUrl: './ride-metrics.html',
  styleUrl: './ride-metrics.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ride-metrics' },
})
export class RideMetrics {
  readonly metrics = input.required<readonly RideMetric[]>();
}
