import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** `md` in the app header; `sm` in a ride header, whose wordmark hides below 384 px so the mark stays. */
export type LockupSize = 'md' | 'sm';

/** The TELO Ride lockup (design-system block lockup): the logo mark and the wordmark, named "Telo Ride". */
@Component({
  selector: 'wz-lockup',
  templateUrl: './lockup.html',
  styleUrl: './lockup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lockup {
  readonly size = input<LockupSize>('md');
}
