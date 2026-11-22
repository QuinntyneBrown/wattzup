import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A page's own navigation (design-system block side-nav): a scrolling row below lg and a column from lg. The page
 * names it (`aria-label`) and projects one `<li>` per `wz-side-nav-link`.
 */
@Component({
  selector: 'nav[wz-side-nav]',
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'side-nav' },
})
export class SideNav {}
