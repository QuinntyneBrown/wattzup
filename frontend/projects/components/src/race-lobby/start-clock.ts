import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * The lobby's start clock (the design system's race-lobby clock elements, L2-051 AC2): the status line, the clock as a
 * timer named "Starts in {n} seconds", the hint, a notice when a rider has left (L2-055 AC1), and the "I'm ready"
 * toggle, a button with `aria-pressed` that reads "You're ready" with a check once pressed (L2-053 AC1). It only draws
 * what it is given and says when the toggle is pressed.
 */
@Component({
  selector: 'wz-start-clock',
  templateUrl: './start-clock.html',
  styleUrl: './start-clock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartClock {
  readonly status = input.required<string>();
  /** Whole seconds to the start. */
  readonly seconds = input.required<number>();
  readonly hint = input.required<string>();
  readonly ready = input.required<boolean>();
  readonly notice = input<string | null>(null);
  /** Pressed: the rider says they are ready, or no longer. */
  readonly readyToggled = output<void>();

  protected readonly face = computed(() => {
    const whole = Math.max(0, Math.floor(this.seconds()));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  });
  protected readonly label = computed(() => {
    const whole = Math.max(0, Math.floor(this.seconds()));
    return `Starts in ${whole} ${whole === 1 ? 'second' : 'seconds'}`;
  });
}
