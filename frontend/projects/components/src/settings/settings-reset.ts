import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { Button } from '../button/button';

/** The foot of Settings (block settings-reset): what Reset to recommended does, and the button (L2-158 AC6). */
@Component({
  selector: 'wz-settings-reset',
  imports: [Button],
  templateUrl: './settings-reset.html',
  styleUrl: './settings-reset.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'settings-reset' },
})
export class SettingsReset {
  readonly resetToRecommended = output();
}
