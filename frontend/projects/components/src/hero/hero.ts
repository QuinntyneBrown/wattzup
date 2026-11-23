import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The marketing site's first section (block hero, ADR 0027). The heading is the page's `h1`; under
 * it the lead, the actions given as `[slot=action]` content and a note. The picture beside it is
 * decoration.
 */
@Component({
  selector: 'section[wz-hero]',
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hero' },
})
export class Hero {
  /** The line over the heading: "From the Telo family". */
  readonly kicker = input<string>();
  readonly heading = input.required<string>();
  readonly lead = input.required<string>();
  /** The line under the actions: "Runs in Chrome or Edge." */
  readonly note = input<string>();
  readonly image = input.required<string>();
}
