import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

let nextId = 0;

/**
 * A stepper (design-system block training-stepper, L2-096 AC2, L2-097 AC2): a group named by its label, with "Less" and
 * "More" ("Less Warm-up") around its value. A button at its bound is disabled.
 */
@Component({
  selector: 'wz-training-stepper',
  templateUrl: './training-stepper.html',
  styleUrl: './training-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'training-stepper', role: 'group', '[attr.aria-labelledby]': 'id' },
})
export class TrainingStepper {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly atMin = input(false);
  readonly atMax = input(false);
  readonly less = output<void>();
  readonly more = output<void>();
  protected readonly id = `training-stepper-${nextId++}`;
}
