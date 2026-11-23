import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Stars (design-system block stars): `count` stars, the first `earned` filled in gold, as one image named "{earned} of
 * {count} stars", so the number never rests on colour alone (L2-039, L2-046 AC2).
 */
@Component({
  selector: 'wz-stars',
  templateUrl: './stars.html',
  styleUrl: './stars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'stars',
    role: 'img',
    '[class.stars--md]': "size() === 'md'",
    '[class.stars--lg]': "size() === 'lg'",
    '[attr.aria-label]': 'label()',
  },
})
export class Stars {
  readonly earned = input.required<number>();
  readonly count = input(3);
  /** sm 14 px, md 16 px, lg 28 px with wider gaps (Results' stars on the map). */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  protected readonly label = computed(() => `${this.earned()} of ${this.count()} stars`);
  protected readonly slots = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index < this.earned()),
  );
}
