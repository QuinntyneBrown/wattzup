import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Lockup } from '../lockup/lockup';

/**
 * The marketing site's footer (block site-footer, ADR 0027): the lockup, a line about Telo Ride,
 * the links it is given as content (`a[wz-site-link]`) and the legal line.
 */
@Component({
  selector: 'footer[wz-site-footer]',
  imports: [Lockup],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'site-footer' },
})
export class SiteFooter {
  readonly blurb = input.required<string>();
  readonly legal = input.required<string>();
}
