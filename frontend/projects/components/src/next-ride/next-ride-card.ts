import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { NextRideView } from '@telo/api';

/**
 * Home's Next ride card (block next-ride, L2-033): the offered map's photo with its tag, "Your next unlock" and the goal,
 * the map it opens with its place, the rider's best there, and the page's action ("Race {map}") in the `action` slot. At
 * lg (1024 px) or wider it splits 3 : 2, photo to text; below, it stacks, and nothing in it is wider than the viewport.
 */
@Component({
  selector: 'wz-next-ride-card',
  templateUrl: './next-ride-card.html',
  styleUrl: './next-ride-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextRideCard {
  readonly view = input.required<NextRideView>();
}
