import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The icons a side-nav link draws so far: Settings' sections. */
export type SideNavIcon = 'world' | 'sound' | 'display' | 'bike' | 'device';

/** A side-nav item (element side-nav__link): its icon and label. The page gives it the address. */
@Component({
  selector: 'a[wz-side-nav-link]',
  templateUrl: './side-nav-link.html',
  styleUrl: './side-nav-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'side-nav__link' },
})
export class SideNavLink {
  readonly icon = input.required<SideNavIcon>();
}
