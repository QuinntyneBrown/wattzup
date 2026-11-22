import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A short fact in a rounded tag (design-system block pill): the load card's bike, quality and graphics API. `ok` is the
 * green of a connected bike; the words carry the fact, so the tone never does alone.
 */
@Component({
  selector: 'span[wz-pill]',
  templateUrl: './pill.html',
  styleUrl: './pill.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pill', '[class.pill--ok]': "tone() === 'ok'" },
})
export class Pill {
  readonly tone = input<'ok' | null>(null);
}
