import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Lockup } from '../lockup/lockup';

/**
 * The marketing site's header (block site-nav, ADR 0027): the lockup linking home, and the links
 * and action it is given as content (`a[wz-site-link]`, `a[wz-button]`).
 */
@Component({
  selector: 'header[wz-site-nav]',
  imports: [Lockup],
  templateUrl: './site-nav.html',
  styleUrl: './site-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'site-nav' },
})
export class SiteNav {
  readonly homeHref = input('/');
}
