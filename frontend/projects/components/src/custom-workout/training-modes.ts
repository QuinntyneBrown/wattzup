import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  input,
  output,
  viewChildren,
} from '@angular/core';
import type { TrainingMode } from '@telo/api';

const MODES: readonly { id: TrainingMode; title: string; body: string }[] = [
  {
    id: 'hiit',
    title: 'HIIT intervals',
    body: 'Hard and easy efforts on repeat. Resistance switches at every interval.',
  },
  {
    id: 'flat',
    title: 'Flat resistance',
    body: 'One level, held the whole ride. You set the pace with your legs.',
  },
];

/**
 * "Training mode" (design-system block training-modes, L2-094 AC2): a radio group of two cards. The chosen card takes
 * the tab stop and the arrow keys move the choice, as a native radio group's do.
 */
@Component({
  selector: 'wz-training-modes',
  templateUrl: './training-modes.html',
  styleUrl: './training-modes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'training-modes', role: 'radiogroup', 'aria-label': 'Training mode' },
})
export class TrainingModes {
  readonly mode = input.required<TrainingMode>();
  readonly chosen = output<TrainingMode>();
  protected readonly modes = MODES;
  private readonly cards = viewChildren<ElementRef<HTMLButtonElement>>('card');

  protected move(event: KeyboardEvent, index: number): void {
    const by = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (by === undefined) return;
    event.preventDefault();
    const next = (index + by + MODES.length) % MODES.length;
    this.chosen.emit(MODES[next]!.id);
    this.cards()[next]?.nativeElement.focus();
  }
}
