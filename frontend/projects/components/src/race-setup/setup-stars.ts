import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * "Stars here" on Race Setup (design-system block setup-stars): the three star rules of L2-039, the earned ones struck
 * through with the hidden text " (earned)" (L2-047 AC2). Stars are earned in rule order, so `earned` counts them.
 */
@Component({
  selector: 'wz-setup-stars',
  templateUrl: './setup-stars.html',
  styleUrl: './setup-stars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupStars {
  readonly earned = input(0);

  protected readonly rules = [
    'Finish the race',
    'Top 3 against the medium pack',
    'Beat your best time',
  ];
}
