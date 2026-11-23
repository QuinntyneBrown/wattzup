import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The gold disc with the rider's level (block level-badge, docs/design-system/). It is decoration beside text that names
 * the level, so assistive technology skips it.
 */
@Component({
  selector: 'wz-level-badge',
  templateUrl: './level-badge.html',
  styleUrl: './level-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'level-badge', 'aria-hidden': 'true' },
})
export class LevelBadge {
  readonly level = input.required<number>();
}
