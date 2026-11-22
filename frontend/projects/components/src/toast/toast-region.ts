import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Where a page's toasts show (design-system block toast-region): fixed at the foot of the screen, centred on a phone
 * and at the end from 640 px, above the page. It is a polite live region from the start, so a toast put in it is read.
 */
@Component({
  selector: 'div[wz-toast-region]',
  templateUrl: './toast-region.html',
  styleUrl: './toast-region.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'toast-region', 'aria-live': 'polite' },
})
export class ToastRegion {}
