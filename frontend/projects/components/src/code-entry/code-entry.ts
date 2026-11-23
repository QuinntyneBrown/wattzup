import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  afterRenderEffect,
  computed,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';

const LENGTH = 6;

/**
 * Six digits in one field, drawn as six cells (design-system block code-entry). Anything but a digit is dropped, so a
 * pasted or offered code ("12 34-56") is taken as typed, and `completed` fires once six digits are in (L2-002 AC5).
 * A refusal's words go under the cells as an alert and mark the field invalid; each new refusal clears the field and
 * puts the focus back in it (AC3).
 */
@Component({
  selector: 'wz-code-entry',
  templateUrl: './code-entry.html',
  styleUrl: './code-entry.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEntry {
  readonly error = input<string | null>(null);
  readonly disabled = input(false);
  /** How many codes were refused; each new one clears the field. */
  readonly refusals = input(0);
  readonly completed = output<string>();

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private focusedFor = 0;

  protected readonly value = linkedSignal({ source: this.refusals, computation: () => '' });
  protected readonly cells = computed(() =>
    Array.from({ length: LENGTH }, (_, index) => this.value()[index] ?? ''),
  );

  constructor() {
    afterRenderEffect(() => {
      const refusals = this.refusals();
      if (refusals > this.focusedFor && !this.disabled()) {
        this.focusedFor = refusals;
        this.field().nativeElement.focus();
      }
    });
  }

  protected onInput(event: Event): void {
    const field = event.target as HTMLInputElement;
    const digits = field.value.replace(/\D/g, '').slice(0, LENGTH);
    field.value = digits;
    this.value.set(digits);
    if (digits.length === LENGTH) {
      this.completed.emit(digits);
    }
  }
}
