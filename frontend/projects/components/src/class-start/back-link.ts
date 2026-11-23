import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A link back to the screen before (design-system block back-link): an arrow, then the projected name ("Classes").
 * The page puts it on its link and gives it the address.
 */
@Component({
  selector: 'a[wz-back-link]',
  templateUrl: './back-link.html',
  styleUrl: './back-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'back-link' },
})
export class BackLink {}
