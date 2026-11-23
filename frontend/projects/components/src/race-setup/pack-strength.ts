import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { PackStrengthId } from '@telo/api';
import { radioStep } from '../radio-group/radio-step';

const notes: Record<PackStrengthId, string> = {
  easy: 'Around 130 W. Good for learning the course.',
  medium: 'Around 190 W. A top 3 here earns the second star.',
  hard: 'Around 250 W. Expect to hurt.',
};

/**
 * "Pack strength" on Race Setup (design-system block pack; WAI-ARIA radio group): easy, medium and hard, the chosen one
 * in the tab order and moved by the arrow keys, with the note for the chosen strength (L2-049 AC1 to AC3).
 */
@Component({
  selector: 'wz-pack-strength',
  templateUrl: './pack-strength.html',
  styleUrl: './pack-strength.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackStrength {
  readonly selected = input.required<PackStrengthId>();
  readonly choose = output<PackStrengthId>();

  protected readonly strengths: readonly PackStrengthId[] = ['easy', 'medium', 'hard'];
  protected readonly note = computed(() => notes[this.selected()]);

  // The options are found in the host rather than by viewChildren, whose code would join the initial bundle.
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected move(event: KeyboardEvent, index: number): void {
    const next = radioStep(event.key, index, [false, false, false]);
    if (next === null) return;
    event.preventDefault();
    this.choose.emit(this.strengths[next]);
    this.host.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }
}
