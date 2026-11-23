import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The unlock goal line on Race Setup (design-system block setup-goal), shown only on the map that holds the rider's
 * next unlock: "**Finish top 3 vs Bots on Prairie Paceline** to open Cliffside Coast." (L2-047 AC3).
 */
@Component({
  selector: 'wz-setup-goal',
  templateUrl: './setup-goal.html',
  styleUrl: './setup-goal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupGoal {
  readonly goal = input.required<string>();
  /** The map the goal opens. */
  readonly opens = input.required<string>();
}
