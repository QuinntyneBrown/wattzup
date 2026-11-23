import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The streak in the app header (element app-header__streak, L2-032 AC2): a flame in warn and the numeral, hidden from
 * assistive technology, named by visually hidden text ("4-day streak"), since ARIA does not announce a name on a plain
 * span. The app leaves it out when there is no streak (AC3).
 */
@Component({
  selector: 'wz-app-header-streak',
  templateUrl: './app-header-streak.html',
  styleUrl: './app-header-streak.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-header__streak' },
})
export class AppHeaderStreak {
  readonly days = input.required<number>();
}
