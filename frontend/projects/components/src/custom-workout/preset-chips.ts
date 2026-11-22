import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** A plan's chip: its id and its name. */
export interface PresetChip {
  readonly id: string;
  readonly name: string;
}

/**
 * The "Plans" chips (design-system block preset-chips, L2-095 AC1, AC6): the chosen one is pressed and, once its rounds
 * change, reads "· edited" after its name.
 */
@Component({
  selector: 'wz-preset-chips',
  templateUrl: './preset-chips.html',
  styleUrl: './preset-chips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'preset-chips', role: 'group', 'aria-label': 'Plans' },
})
export class PresetChips {
  readonly presets = input.required<readonly PresetChip[]>();
  readonly chosen = input.required<string>();
  readonly edited = input(false);
  readonly picked = output<string>();
}
