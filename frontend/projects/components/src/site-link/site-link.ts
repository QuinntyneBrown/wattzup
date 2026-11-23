import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A link in the marketing site's nav or footer (block site-link, ADR 0027). Put it on the anchor so
 * it keeps its own role and keyboard behaviour: `<a wz-site-link href="#film">`.
 */
@Component({
  selector: 'a[wz-site-link]',
  templateUrl: './site-link.html',
  styleUrl: './site-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'site-link' },
})
export class SiteLink {}
