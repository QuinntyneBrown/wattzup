import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { MapRating } from '@telo/api';
import { formatBest } from '../metric/format-best';

/**
 * A map's facts on Race Setup (design-system blocks setup-facts and setup-fact): Distance, Climbing, Rated and Your
 * best, which is absent when the map has no best (L2-047 AC1, AC4).
 */
@Component({
  selector: 'wz-setup-facts',
  templateUrl: './setup-facts.html',
  styleUrl: './setup-facts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupFacts {
  readonly distanceKm = input.required<number>();
  readonly climbingM = input.required<number>();
  readonly rating = input.required<MapRating>();
  readonly bestSeconds = input<number | null>(null);

  protected readonly facts = computed(() => {
    const best = this.bestSeconds();
    return [
      { label: 'Distance', number: String(this.distanceKm()), unit: 'km' },
      { label: 'Climbing', number: String(this.climbingM()), unit: 'm' },
      { label: 'Rated', number: this.rating(), unit: null },
      ...(best === null ? [] : [{ label: 'Your best', number: formatBest(best), unit: null }]),
    ];
  });
}
