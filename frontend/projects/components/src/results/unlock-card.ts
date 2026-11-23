import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { UnlockCardView } from '@telo/api';

/**
 * Results' gold card for a map the ride opened (block unlock-card, L2-076): the map's photo, "{map} is open" and its
 * place line, with the page's action projected below (`slot="action"`, a gold "Ride {map}" link). It is the one moment
 * the app celebrates with motion: the card fades in and scales up, then its photo comes into colour; under reduced
 * motion it only fades. The motion is CSS, so it holds nothing to release.
 */
@Component({
  selector: 'wz-unlock-card',
  templateUrl: './unlock-card.html',
  styleUrl: './unlock-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnlockCard {
  readonly view = input.required<UnlockCardView>();
}
