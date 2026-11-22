import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * One setting in a Settings section's list (design-system block setting): its control and words, separated from the
 * one before by a hairline.
 */
@Component({
  selector: 'div[wz-setting]',
  templateUrl: './setting.html',
  styleUrl: './setting.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'setting' },
})
export class Setting {}
