import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * A control on the race's top bar (design-system race-bar's `race-bar__btn`, docs/mocks/pages/race/): an icon, with its
 * label from sm; `quiet` for the way out. On a phone it is 48 px, as anything pressed mid-ride (L2-072 AC3). The
 * element is the consumer's button or link, so a link keeps its own routing.
 */
@Component({
  selector: 'a[wz-race-bar-button], button[wz-race-bar-button]',
  templateUrl: './race-bar-button.html',
  styleUrl: './race-bar-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'race-bar__btn', '[class.race-bar__btn--quiet]': 'quiet()' },
})
export class RaceBarButton {
  /** The visible label; the control's accessible name is its own `aria-label`. */
  readonly label = input.required<string>();
  readonly quiet = input(false, { transform: booleanAttribute });
}
