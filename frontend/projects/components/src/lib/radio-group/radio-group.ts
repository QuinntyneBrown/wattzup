import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** HIIT intervals, Intervals or Flat resistance, as a radio group (L2-029). */
@Component({
  selector: 'wz-radio-group',
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioGroup {
  readonly mode = model.required<'hiit' | 'intervals' | 'flat'>();
  readonly disabled = input(false);
}
