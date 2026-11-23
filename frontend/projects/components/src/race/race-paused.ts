import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The paused solo race's overlay (design-system block race-paused, docs/mocks/pages/race/paused): "Paused on Cathedral
 * Circuit" and "The world holds still until you pedal again.", a status a screen reader hears (L2-068 AC1). Presses
 * pass through it to the controls beneath.
 */
@Component({
  selector: 'wz-race-paused',
  templateUrl: './race-paused.html',
  styleUrl: './race-paused.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacePaused {
  /** The route the race is on, "Cathedral Circuit". */
  readonly route = input.required<string>();
}
