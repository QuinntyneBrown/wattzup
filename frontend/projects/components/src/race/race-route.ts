import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { RouteProfileView } from '@telo/api';

let nextId = 0;

/**
 * The race's route panel (design-system block race-route, docs/mocks/pages/race/): the grade coloured by how the road
 * reads ("+0.5%", a downhill one with a true minus), the metres climbed, the distance ridden ("1.62 km"), and the
 * route profile as one image ("Route profile, 43 m of elevation") with the part ridden, the segment strip and a line
 * at the rider's place (L2-062 AC1, AC2). Hidden on a phone.
 */
@Component({
  selector: 'wz-race-route',
  templateUrl: './race-route.html',
  styleUrl: './race-route.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceRoute {
  readonly view = input.required<RouteProfileView>();
  /** Kilometres ridden, two decimals ("1.62"). */
  readonly distance = input.required<string>();

  /** The clip path's id, one per panel, so two panels never share it. */
  protected readonly clipId = `race-route-done-${nextId++}`;
  protected readonly grade = computed(() =>
    this.view().gradeText.replace('%', '').replace('-', '−'),
  );
}
