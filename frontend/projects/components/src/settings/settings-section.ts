import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One section of Settings (design-system block settings-section): a landmark labelled by its heading, a line of
 * context, and its settings separated by hairlines. `name` is its id, which the section nav links to.
 */
@Component({
  selector: 'section[wz-settings-section]',
  templateUrl: './settings-section.html',
  styleUrl: './settings-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'settings-section',
    '[id]': 'name()',
    '[attr.aria-labelledby]': "name() + '-title'",
  },
})
export class SettingsSection {
  readonly name = input.required<string>();
  readonly heading = input.required<string>();
  readonly description = input('');
}
