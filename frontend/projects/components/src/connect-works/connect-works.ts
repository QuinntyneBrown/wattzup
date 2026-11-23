import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { SupportedBike } from '@telo/api';

/** Connect Bike's "Works with" list (design-system block connect-works): one column on a phone, two from sm. */
@Component({
  selector: 'wz-connect-works',
  templateUrl: './connect-works.html',
  styleUrl: './connect-works.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectWorks {
  readonly bikes = input.required<readonly SupportedBike[]>();
}
