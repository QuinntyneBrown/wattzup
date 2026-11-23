import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { StandingsRow } from '@telo/api';

/**
 * The final standings on Results (block standings, L2-073 AC3): an ordered list named "Final standings", every rider
 * with a jersey dot, the name as text, a bot marker named "Bot" (an icon as well as its name) and the finish time; the
 * rider's row in volt with `aria-current="true"`.
 */
@Component({
  selector: 'wz-standings',
  templateUrl: './standings.html',
  styleUrl: './standings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Standings {
  readonly rows = input.required<readonly StandingsRow[]>();
}
