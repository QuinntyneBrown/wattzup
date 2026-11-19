import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/** A large numeral with its unit and a sub-line (block `readout`). */
@Component({
  selector: 'wz-readout',
  templateUrl: './readout.html',
  styleUrl: './readout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Readout {
  readonly kind = input.required<'power' | 'cadence'>();
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly unit = input.required<string>();
  /** Marks the value as an estimate (L2-021). */
  readonly estimate = input<string | null>(null);
  protected readonly descriptionId = `readout-est-${++nextId}`;
}
