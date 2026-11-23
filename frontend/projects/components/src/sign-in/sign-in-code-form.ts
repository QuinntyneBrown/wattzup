import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { SignInError } from '@telo/api';
import { Button } from '../button/button';
import { CodeEntry } from '../code-entry/code-entry';
import { InlineMessage } from '../inline-message/inline-message';
import { Lockup } from '../lockup/lockup';
import { formatClock } from '../metric/format-clock';
import { codeRefusal, signInMessage } from './sign-in-message';

/**
 * The code screen (docs/mocks/pages/sign-in-code/): it names the email the code went to (L2-002 AC1) and offers "Send
 * a new code", disabled with the time left for 30 seconds after a send (L2-003 AC1). Six digits in `CodeEntry` are
 * confirmed at once (L2-002 AC2), and a refused code says why under them. A new code is confirmed (L2-003 AC2); a
 * refused one says why.
 */
@Component({
  selector: 'wz-sign-in-code-form',
  templateUrl: './sign-in-code-form.html',
  styleUrl: './sign-in-code-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, CodeEntry, InlineMessage, Lockup],
})
export class SignInCodeForm {
  readonly email = input.required<string>();
  readonly resendSecondsLeft = input(0);
  readonly sending = input(false);
  /** A new code was sent from this screen. */
  readonly resent = input(false);
  readonly error = input<SignInError | null>(null);
  /** How many codes were refused; each new one clears the field. */
  readonly refusals = input(0);
  /** The six digits, as soon as they are in (L2-002 AC2). */
  readonly confirm = output<string>();
  readonly resend = output();
  readonly changeEmail = output();

  protected readonly waiting = computed(() => this.resendSecondsLeft() > 0);
  protected readonly resendLabel = computed(() =>
    this.waiting()
      ? `Send a new code in ${formatClock(this.resendSecondsLeft())}`
      : 'Send a new code',
  );
  protected readonly message = computed(() => signInMessage(this.error()));
  protected readonly refusal = computed(() => codeRefusal(this.error()));
}
