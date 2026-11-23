import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Stars } from '../stars/stars';

/**
 * "Stars on every map" beside the unlock path (design-system blocks maps-aside and star-rules): the three star rules
 * (L2-039) and when racing people opens (L2-046 AC5).
 */
@Component({
  selector: 'wz-maps-aside',
  imports: [Stars],
  templateUrl: './maps-aside.html',
  styleUrl: './maps-aside.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsAside {
  protected readonly rules = [
    { stars: 1, text: 'Finish the race' },
    { stars: 2, text: 'Top 3 against the medium pack' },
    { stars: 3, text: 'Beat your best time' },
  ];
}
