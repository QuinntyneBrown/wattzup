import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { LevelView } from '@telo/api';
import { LevelBadge } from '../level-badge/level-badge';
import { XpBar } from '../xp-bar/xp-bar';

/**
 * The level link in the app header (element app-header__level, L2-032 AC2): the gold badge, then from sm (640 px) the XP
 * bar and "1,840 / 2,600 XP". What it draws is hidden from assistive technology: the app names the link with the
 * view's `ariaLabel` ("Level 7, 1840 of 2600 XP"), which says it all, and links it to Profile.
 */
@Component({
  selector: 'a[wz-app-header-level]',
  imports: [LevelBadge, XpBar],
  templateUrl: './app-header-level.html',
  styleUrl: './app-header-level.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-header__level' },
})
export class AppHeaderLevel {
  readonly level = input.required<LevelView>();
}
