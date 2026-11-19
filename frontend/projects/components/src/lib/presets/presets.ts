import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** One preset chip and whether it shows pressed. */
export interface PresetChip {
  id: string;
  label: string;
  pressed: boolean;
}

/** The preset chips; a pressed one carries `aria-pressed` (L2-029). */
@Component({
  selector: 'wz-presets',
  templateUrl: './presets.html',
  styleUrl: './presets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Presets {
  readonly items = input.required<readonly PresetChip[]>();
  readonly disabled = input(false);
  readonly choose = output<string>();
}
