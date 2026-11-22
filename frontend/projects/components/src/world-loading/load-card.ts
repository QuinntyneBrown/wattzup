import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { LoadStepView } from '@telo/api';
import { Progress } from '../progress/progress';
import { LoadSteps } from './load-steps';

/**
 * World loading's load card (design-system block load-card, docs/mocks/pages/world-loading/): what is happening, the
 * overall progress as a percentage and a bar, the three steps, a status a screen reader hears at each step (never each
 * percent), the facts (`facts` slot), a notice or alert (`notice` slot) and the way forward (`actions` slot) with its
 * hint under it (L2-152 AC1, AC6, AC7).
 */
@Component({
  selector: 'wz-load-card',
  imports: [LoadSteps, Progress],
  templateUrl: './load-card.html',
  styleUrl: './load-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadCard {
  /** "Getting Neon Docklands ready". */
  readonly heading = input.required<string>();
  /** 0 to 100. */
  readonly percent = input.required<number>();
  /** The bar's name: "Loading Neon Docklands". */
  readonly progressLabel = input.required<string>();
  /** The world is ready: the bar turns green. */
  readonly done = input(false);
  readonly steps = input.required<readonly LoadStepView[]>();
  /** "Downloading the world, 18 percent.", set as each step starts. */
  readonly status = input('');
  /** "Ready in a few seconds. Pedal easy while you wait." */
  readonly hint = input('');
}
