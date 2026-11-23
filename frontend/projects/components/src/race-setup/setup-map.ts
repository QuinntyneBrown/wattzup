import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MapRating } from '@telo/api';
import { SetupFacts } from './setup-facts';
import { SetupStars } from './setup-stars';

/**
 * The map column of Race Setup (design-system block setup-map): its photo, name and route line, its facts and the stars
 * here (L2-047 AC1, AC2, AC4).
 */
@Component({
  selector: 'wz-setup-map',
  imports: [SetupFacts, SetupStars],
  templateUrl: './setup-map.html',
  styleUrl: './setup-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupMap {
  readonly photoUrl = input.required<string>();
  readonly name = input.required<string>();
  /** "Cathedral Circuit · A cobbled European old town on race day". */
  readonly routeLine = input.required<string>();
  readonly distanceKm = input.required<number>();
  readonly climbingM = input.required<number>();
  readonly rating = input.required<MapRating>();
  readonly bestSeconds = input<number | null>(null);
  readonly earned = input(0);
}
