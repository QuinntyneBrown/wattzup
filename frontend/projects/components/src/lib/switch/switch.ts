import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Warm-up and Cool-down switches (L2-029). */
@Component({
  selector: 'wz-switch',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Switch {
  readonly warmup = model.required<boolean>();
  readonly cooldown = model.required<boolean>();
  readonly disabled = input(false);
}
