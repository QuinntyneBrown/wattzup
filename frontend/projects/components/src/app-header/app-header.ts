import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The app header (design-system block app-header). It lays out the slots the page fills: `brand` (an
 * `a[wz-app-header-brand]`), `nav` (the `a[wz-app-header-link]` items, inside the navigation landmark "Main") and `end`.
 * It knows no route: the app puts the router links in the slots and marks the current one with `aria-current`.
 */
@Component({
  selector: 'wz-app-header',
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {}
