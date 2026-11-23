import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Lockup } from '../lockup/lockup';

/** The header's link to Home (element app-header__brand): the lockup, named "Home" by the app's `aria-label`. */
@Component({
  selector: 'a[wz-app-header-brand]',
  imports: [Lockup],
  templateUrl: './app-header-brand.html',
  styleUrl: './app-header-brand.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-header__brand' },
})
export class AppHeaderBrand {}
