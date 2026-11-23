import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatBest } from '../metric/format-best';
import { Stars } from '../stars/stars';

/**
 * One map on Map Select (design-system block map-row), on the page's link to Race Setup when the map is open or on
 * its disabled button when it is locked (L2-046 AC2 to AC4). The page projects the map's name, its accessible name.
 * An open map shows its stars and, once ridden, its best; a locked one a greyed photo, a lock, its goal, and says it is
 * locked in hidden text, as colour and the lock are not words (L2-046 AC3, AC4).
 */
@Component({
  selector: 'a[wz-map-row], button[wz-map-row]',
  imports: [Stars],
  templateUrl: './map-row.html',
  styleUrl: './map-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'map-row',
    '[class.map-row--next]': "status() === 'next'",
    '[class.map-row--locked]': "status() !== 'open'",
  },
})
export class MapRow {
  /** Where the map stands on the rider's path; named apart from `RouterLink`'s `state`, which shares the element. */
  readonly status = input.required<'open' | 'next' | 'locked'>();
  readonly thumbnail = input.required<string>();
  readonly distanceKm = input.required<number>();
  readonly climbingM = input.required<number>();
  readonly rating = input.required<string>();
  readonly stars = input(0);
  /** What opens a locked map: "Finish top 3 vs Bots on Prairie Paceline" (L2-040 AC6). */
  readonly goal = input<string | null>(null);
  /** The best time in seconds, or `null` before the map is ridden. */
  readonly bestSeconds = input<number | null>(null);

  /** "18.4 km · 90 m climbing · Easy". */
  protected readonly facts = computed(
    () => `${this.distanceKm()} km · ${this.climbingM()} m climbing · ${this.rating()}`,
  );
  protected readonly best = computed(() => {
    const seconds = this.bestSeconds();
    return seconds === null ? null : formatBest(seconds);
  });
}
