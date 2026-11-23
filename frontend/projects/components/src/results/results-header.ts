import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Lockup } from '../lockup/lockup';

/**
 * Results' header (block results-header, docs/mocks/pages/results/): the lockup and what was ridden, "Old Town Criterium
 * · vs Bots", with no navigation. Full screen joins it with slice 24.2.
 */
@Component({
  selector: 'wz-results-header',
  imports: [Lockup],
  templateUrl: './results-header.html',
  styleUrl: './results-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsHeader {
  readonly context = input.required<string>();
}
