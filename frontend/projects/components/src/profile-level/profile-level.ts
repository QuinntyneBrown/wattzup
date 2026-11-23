import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { XpBar } from '../xp-bar/xp-bar';

/**
 * Profile's headline (block profile-level, L2-109): the level disc beside "{name} · Level {n}", the XP bar named by the
 * XP, and the line under it ("760 XP to level 8 · 23 rides · 412 km · 4-day streak"). The disc, bar and line wait for
 * the rider's progress; the headline shows what is known.
 */
@Component({
  selector: 'wz-profile-level',
  imports: [XpBar],
  templateUrl: './profile-level.html',
  styleUrl: './profile-level.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileLevel {
  readonly headline = input.required<string>();
  readonly level = input<number | null>(null);
  /** "1,840 of 2,600 XP". */
  readonly xpLabel = input<string | null>(null);
  readonly fillPercent = input(0);
  readonly meta = input<string | null>(null);
}
