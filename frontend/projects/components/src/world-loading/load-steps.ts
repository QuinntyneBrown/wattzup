import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { LoadStepState, LoadStepView } from '@telo/api';

/** What a screen reader hears after each step's label (L2-152 AC1). */
const SAID: Readonly<Record<LoadStepState, string>> = {
  done: 'Done',
  current: 'In progress',
  waiting: 'Waiting',
  failed: 'Failed',
  skipped: 'Not needed',
};

/**
 * World loading's steps (design-system block load-steps, docs/mocks/pages/world-loading/): an ordered list in which
 * the running step is `aria-current="step"`, and every step says its state by an icon and in words a screen reader
 * reads, never by colour alone (L2-152 AC1).
 */
@Component({
  selector: 'wz-load-steps',
  templateUrl: './load-steps.html',
  styleUrl: './load-steps.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadSteps {
  readonly steps = input.required<readonly LoadStepView[]>();

  protected readonly said = SAID;
}
