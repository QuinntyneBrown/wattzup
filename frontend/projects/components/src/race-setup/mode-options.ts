import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import type { RaceMode } from '@telo/api';
import { radioStep } from '../radio-group/radio-step';

/** One race mode: its id, title and body, its icon, and whether it can be chosen. */
export interface ModeOption {
  readonly id: RaceMode;
  readonly title: string;
  readonly body: string;
  readonly icon: 'ghost' | 'bots' | 'riders';
  readonly disabled: boolean;
}

/**
 * "Race mode" on Race Setup (design-system blocks mode-options and mode-option; WAI-ARIA radio group): the chosen mode
 * carries `aria-checked="true"` and is the one in the tab order; the arrow keys move between the modes that can be
 * chosen (L2-048 AC4). A mode that cannot be chosen is `aria-disabled`, carries a lock and says why in its body (AC2).
 */
@Component({
  selector: 'wz-mode-options',
  templateUrl: './mode-options.html',
  styleUrl: './mode-options.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeOptions {
  readonly options = input.required<readonly ModeOption[]>();
  readonly selected = input.required<RaceMode>();
  readonly choose = output<RaceMode>();

  // The options are found in the host rather than by viewChildren, whose code would join the initial bundle.
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected pick(option: ModeOption): void {
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
