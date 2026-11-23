import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * An on/off switch (design-system block switch): a native button with `role="switch"`, its state in `aria-checked`
 * and in the knob's side, never in colour alone. The consumer names it with its content and flips it on click.
 */
@Component({
  selector: 'button[wz-switch]',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'switch', type: 'button', role: 'switch', '[attr.aria-checked]': 'checked()' },
})
export class Switch {
  readonly checked = input.required<boolean>();
}
