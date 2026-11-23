import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';
import { Setting } from '../settings/setting';
import { SwitchRow } from '../switch/switch-row';

/** The Saved worlds row's words: "3 worlds · 61 MB", the worlds named, and whether Clear saved worlds shows. */
export interface SavedWorldsRow {
  readonly value: string;
  readonly hint: string;
  readonly clear: boolean;
}

/**
 * Settings' This device (docs/mocks/pages/settings/, L2-165): Saved worlds with their number, size and names and Clear
 * saved worlds, or None saved; then Keep worlds after a ride. The row is empty until the worlds are listed. Inputs
 * from the page, outputs to it.
 */
@Component({
  selector: 'wz-device-settings',
  imports: [Button, Setting, SwitchRow],
  templateUrl: './device-settings.html',
  styleUrl: './device-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceSettings {
  readonly savedWorlds = input.required<SavedWorldsRow | null>();
  readonly keepWorlds = input.required<boolean>();

  readonly cleared = output<void>();
  readonly keepWorldsToggled = output<boolean>();
}
