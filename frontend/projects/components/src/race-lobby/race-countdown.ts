import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The race countdown (the design system's countdown, L2-056 AC1, AC2): a full-screen overlay over the lobby, a timer
 * that says "Race starts in 3" assertively, with one big numeral, 3, 2, 1 and Go. Each step is a new numeral, so it
 * fades and scales in over 200 ms, and only fades under reduced motion. It only draws the step it is given.
 */
@Component({
  selector: 'wz-race-countdown',
  templateUrl: './race-countdown.html',
  styleUrl: './race-countdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceCountdown {
  /** "3", "2", "1" or "Go". */
  readonly step = input.required<string>();

  protected readonly steps = computed(() => [this.step()]);
  protected readonly label = computed(() =>
    this.step() === 'Go' ? 'Go' : `Race starts in ${this.step()}`,
  );
}
