import { ChangeDetectionStrategy, Component } from '@angular/core';

/** A main navigation item (element app-header__nav-link). The current one carries `aria-current="page"`. */
@Component({
  selector: 'a[wz-app-header-link]',
  templateUrl: './app-header-link.html',
  styleUrl: './app-header-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-header__nav-link' },
})
export class AppHeaderLink {}
