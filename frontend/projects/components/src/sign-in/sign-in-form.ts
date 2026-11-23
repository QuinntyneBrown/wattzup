import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import type { SignInError } from '@telo/api';
import { Button } from '../button/button';
import { InlineMessage } from '../inline-message/inline-message';
import { Lockup } from '../lockup/lockup';
import { signInMessage } from './sign-in-message';

/**
 * The sign-in screen (docs/mocks/pages/sign-in/): one email field and "Send my code", which reads "Sending your code…"
 * while the request runs (L2-001 AC2). An invalid address is marked under the field; a failed or refused send says so
 * above the button (L2-001 AC3, AC5, L2-003 AC4). Opened after the account was deleted, it says so under the lead
 * (L2-006 AC3).
 */
@Component({
  selector: 'wz-sign-in-form',
  templateUrl: './sign-in-form.html',
  styleUrl: './sign-in-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, InlineMessage, Lockup],
})
export class SignInForm {
  /** The email last typed, kept when the rider comes back. */
  readonly email = input('');
  readonly sending = input(false);
  readonly error = input<SignInError | null>(null);
  /** The rider has just deleted their account. */
  readonly accountDeleted = input(false);
  /** The email as typed, when the rider chooses "Send my code". */
  readonly send = output<string>();

  protected readonly value = linkedSignal(() => this.email());
  protected readonly invalid = computed(() => this.error()?.code === 'invalid_email');
  protected readonly message = computed(() => signInMessage(this.error()));

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.sending()) {
      this.send.emit(this.value());
    }
  }
}
