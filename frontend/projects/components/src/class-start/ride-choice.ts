import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { radioStep } from '../radio-group/radio-step';

/** One way to ride: its id, its title and body, its icon, and whether it can be chosen. */
export interface RideOption {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly icon: 'alone' | 'group';
  readonly disabled: boolean;
}

/**
 * "How do you want to ride?" on Class Start (design-system blocks ride-choice and ride-option; WAI-ARIA radio group):
 * the chosen option carries `aria-checked="true"` and is the one in the tab order; the arrow keys move between the
 * options that can be chosen. An option that cannot be chosen is `aria-disabled` and says why in its body (L2-085
 * AC1, AC5). The page projects its Start or Join button.
 */
@Component({
  selector: 'wz-ride-choice',
  templateUrl: './ride-choice.html',
  styleUrl: './ride-choice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideChoice {
  readonly options = input.required<readonly RideOption[]>();
  readonly selected = input.required<string>();
  readonly choose = output<string>();

  // The options are found in the host rather than by viewChildren, whose code would join the initial bundle.
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected pick(option: RideOption): void {
    if (!option.disabled) this.choose.emit(option.id);
  }

  protected move(event: KeyboardEvent, index: number): void {
    const options = this.options();
    const next = radioStep(
      event.key,
      index,
      options.map((option) => option.disabled),
    );
    if (next === null) return;
    event.preventDefault();
    this.choose.emit(options[next].id);
    this.host.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }
}
