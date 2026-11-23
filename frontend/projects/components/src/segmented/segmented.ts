import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { radioStep } from '../radio-group/radio-step';

/** One choice of a segmented control. */
export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/**
 * A choice of a few options side by side (design-system block segmented): a WAI-ARIA radio group of buttons, the chosen
 * one `aria-checked` and drawn filled, its words carrying the choice too. Only the chosen option is in the tab order;
 * the arrow keys move the choice and the focus. The consumer labels it (`aria-labelledby`).
 */
@Component({
  selector: 'wz-segmented',
  templateUrl: './segmented.html',
  styleUrl: './segmented.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'segmented', role: 'radiogroup' },
})
export class Segmented<T extends string> {
  readonly options = input.required<readonly SegmentedOption<T>[]>();
  readonly value = input.required<T>();
  readonly disabled = input(false);
  readonly chosen = output<T>();

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('option');

  protected onKey(event: KeyboardEvent, index: number): void {
    const next = radioStep(
      event.key,
      index,
      this.options().map(() => false),
    );
    if (next === null) return;
    event.preventDefault();
    this.chosen.emit(this.options()[next]!.value);
    this.buttons()[next]?.nativeElement.focus();
  }
}
