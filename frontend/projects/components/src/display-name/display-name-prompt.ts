import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Lockup } from '../lockup/lockup';
import { DisplayNameForm } from './display-name-form';

/**
 * The display name prompt (L2-005 AC1, docs/mocks/pages/sign-in-name/): "What should other riders call you?" on the
 * sign-in panel, with the name's form and "Continue".
 */
@Component({
  selector: 'wz-display-name-prompt',
  templateUrl: './display-name-prompt.html',
  styleUrl: './display-name-prompt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DisplayNameForm, Lockup],
})
export class DisplayNamePrompt {
  readonly saving = input(false);
  readonly refusals = input(0);
  readonly failed = input(false);
  readonly submitted = output<string>();
}
