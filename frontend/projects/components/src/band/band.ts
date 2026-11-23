import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BandSurface = 'canvas' | 'panel';

/**
 * A section of the marketing page (block band, ADR 0027), labelled by its `h2`. The section's id is
 * its `anchor`; the heading's is `{anchor}-h` and it can take focus by script, so a link to the
 * section can move focus to it.
 */
@Component({
  selector: 'section[wz-band]',
  templateUrl: './band.html',
  styleUrl: './band.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'band',
    '[class.band--panel]': 'surface() === "panel"',
    '[attr.id]': 'anchor()',
    '[attr.aria-labelledby]': 'headingId()',
  },
})
export class Band {
  readonly anchor = input.required<string>();
  readonly kicker = input<string>();
  readonly heading = input.required<string>();
  readonly lead = input<string>();
  readonly surface = input<BandSurface>('canvas');

  protected readonly headingId = computed(() => `${this.anchor()}-h`);
}
