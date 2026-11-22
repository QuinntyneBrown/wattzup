import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Round } from '@telo/api';
import { formatClock } from '../metric/format-clock';

/** The bounds the ladder disables its buttons at, in seconds and rounds (L2-095 AC3, AC4). */
export interface LadderBounds {
  readonly effort: { readonly min: number; readonly max: number };
  readonly recovery: { readonly min: number; readonly max: number };
  readonly rounds: { readonly min: number; readonly max: number };
}

/** A step of one round's effort or recovery: which round, and which way. */
export interface RoundStep {
  readonly index: number;
  readonly direction: 1 | -1;
}

/**
 * The ladder block (design-system blocks ladder-block and interval-ladder, L2-095 AC2 to AC5): the plan's title and
 * "Make every round the same", then a row per round with its effort and recovery mini-steppers and its remove button,
 * the last round reading "Into cool-down", and "Add round". A button at its bound is disabled.
 */
@Component({
  selector: 'section[wz-interval-ladder]',
  templateUrl: './interval-ladder.html',
  styleUrl: './interval-ladder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ladder-block', 'aria-labelledby': 'ladder-title' },
})
export class IntervalLadder {
  readonly title = input.required<string>();
  readonly rounds = input.required<readonly Round[]>();
  readonly bounds = input.required<LadderBounds>();
  readonly effortStepped = output<RoundStep>();
  readonly recoveryStepped = output<RoundStep>();
  readonly removed = output<number>();
  readonly added = output<void>();
  readonly evened = output<void>();
  protected readonly clock = formatClock;
}
