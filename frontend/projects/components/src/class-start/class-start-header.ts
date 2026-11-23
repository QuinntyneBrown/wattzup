import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Lockup } from '../lockup/lockup';

/**
 * Class Start's header (design-system block class-header, docs/mocks/pages/class-start/): the small lockup, the page's
 * back link in the `back` slot and its actions in the `end` slot, pushed to the end (L2-084 AC1).
 */
@Component({
  selector: 'wz-class-start-header',
  imports: [Lockup],
  templateUrl: './class-start-header.html',
  styleUrl: './class-start-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassStartHeader {}
