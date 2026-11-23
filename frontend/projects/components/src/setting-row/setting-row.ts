import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The icons a Settings row draws so far. */
export type SettingRowIcon = 'bike' | 'settings' | 'workout' | 'person' | 'sign-out' | 'trash';

/**
 * One row of Profile's Settings (design-system block setting-row): an icon, a title, a line under it and a chevron.
 * Put it on the native element so it keeps its role: `<button wz-setting-row title="Display name" [body]="name">`
 * opens a dialog, `<a wz-setting-row routerLink="…">` goes to a screen. A `danger` row's action cannot be undone (Delete
 * my account): its icon and title take the danger colour, and its words say so too.
 */
@Component({
  selector: 'a[wz-setting-row], button[wz-setting-row]',
  templateUrl: './setting-row.html',
  styleUrl: './setting-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'setting-row', '[class.setting-row--danger]': 'danger()' },
})
export class SettingRow {
  readonly icon = input.required<SettingRowIcon>();
  readonly title = input.required<string>();
  readonly body = input('');
  readonly danger = input(false);
}
