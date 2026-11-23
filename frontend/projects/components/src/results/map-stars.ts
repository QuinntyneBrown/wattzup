import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MapStarsView } from '@telo/api';
import { Stars } from '../stars/stars';

/**
 * Results' stars on the map (block map-stars, L2-075): "Stars on {map}", the stars held as one image named "2 of 3
 * stars", and "+1 new star" or "+2 new stars" only when the ride earned some.
 */
@Component({
  selector: 'wz-map-stars',
  imports: [Stars],
  templateUrl: './map-stars.html',
  styleUrl: './map-stars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapStars {
  readonly view = input.required<MapStarsView>();
}
