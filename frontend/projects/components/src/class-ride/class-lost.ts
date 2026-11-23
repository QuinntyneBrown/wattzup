import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';

/**
 * The lost-bike alert over the class ride (design-system block class-lost, docs/mocks/pages/class-ride/disconnected
 * and solo-disconnected): "Lost the bike", what happens to the ride meanwhile, and Reconnect (L2-092).
 */
@Component({
  selector: 'wz-class-lost',
  imports: [Button],
  templateUrl: './class-lost.html',
  styleUrl: './class-lost.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassLost {
  /** What the ride does while the bike is away: it pauses in solo, and goes on in a group. */
  readonly body = input.required<string>();
  readonly reconnect = output();
}
