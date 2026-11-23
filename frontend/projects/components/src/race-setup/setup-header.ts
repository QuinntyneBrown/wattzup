import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Lockup } from '../lockup/lockup';

/**
 * Race Setup's header (design-system block setup-header, docs/mocks/pages/race-setup/): the small lockup, the page's
 * back link in the `back` slot and its actions in the `end` slot, pushed to the end (L2-047 AC1).
 */
@Component({
  selector: 'wz-setup-header',
  imports: [Lockup],
  templateUrl: './setup-header.html',
  styleUrl: './setup-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupHeader {}
