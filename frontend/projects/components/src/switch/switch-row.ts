import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Switch } from './switch';

/**
 * A labelled setting (design-system block switch-row): its label and a line of description, then the switch, named by
 * the label (hidden inside it, so the visible one is not read twice) and described by the line. `name` makes the ids unique on the page; `toggled` carries the new state.
 */
@Component({
  selector: 'wz-switch-row',
  imports: [Switch],
  templateUrl: './switch-row.html',
  styleUrl: './switch-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'switch-row' },
})
export class SwitchRow {
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly description = input('');
  readonly checked = input.required<boolean>();
  /** A setting that cannot change now: its switch is disabled and its description says why. */
  readonly disabled = input(false);
  readonly toggled = output<boolean>();
}
