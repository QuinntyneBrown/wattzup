import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The race's lost-bike alert (design-system block race-lost, docs/mocks/pages/race/disconnected, solo-disconnected and
 * dnf): "Lost the bike" or "Did not finish", what happens to the race, and the page's action in the `action` slot,
 * Reconnect or the way back to Race Setup (L2-070). The bike's name in the body is data, rendered as text.
 */
@Component({
  selector: 'wz-race-lost',
  templateUrl: './race-lost.html',
  styleUrl: './race-lost.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceLost {
  readonly heading = input.required<string>();
  readonly body = input.required<string>();
}
