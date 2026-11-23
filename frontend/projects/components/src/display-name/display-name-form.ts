import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Button } from '../button/button';
import { InlineMessage } from '../inline-message/inline-message';

/**
 * The display name's field, its rule and its actions (L2-005, design-system block display-name-form): "Continue" as a
 * block button on the prompt, or `cancel` and the action side by side in a dialog. The action waits for a name. Each
 * refusal of a name that breaks the rule marks the field invalid and says what is allowed, until the name is changed
 * (AC2).
 */
@Component({
  selector: 'wz-display-name-form',
  templateUrl: './display-name-form.html',
  styleUrl: './display-name-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, InlineMessage, NgTemplateOutlet],
})
export class DisplayNameForm {
  /** The name the field starts with. */
  readonly name = input('');
  /** The primary action's words. */
  readonly action = input('Continue');
  /** The words of a Cancel button beside the action, in a dialog; none on the prompt. */
  readonly cancel = input<string | null>(null);
  readonly saving = input(false);
  /** How many names were refused for breaking the rule; each new refusal shows until the name is changed. */
  readonly refusals = input(0);
  /** The save got no answer of its own. */
  readonly failed = input(false);
  readonly submitted = output<string>();
  readonly cancelled = output();

  protected readonly value = linkedSignal(() => this.name());
  protected readonly invalid = linkedSignal({
    source: this.refusals,
    computation: (refusals) => refusals > 0,
  });
  protected readonly empty = computed(() => this.value().trim() === '');

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
    this.invalid.set(false);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.empty() && !this.saving()) {
      this.submitted.emit(this.value().trim());
    }
  }
}
