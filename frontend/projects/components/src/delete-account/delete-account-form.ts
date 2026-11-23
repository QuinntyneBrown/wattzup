import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Button } from '../button/button';
import { InlineMessage } from '../inline-message/inline-message';

/**
 * The confirmation in the Delete my account dialog (L2-006 AC2, design-system block delete-account-form): the field for
 * "delete", "Cancel" and "Delete my account", which stays disabled until "delete" is typed (case and surrounding spaces
 * do not matter). While deleting it reads "Deleting…"; a failed deletion keeps the word and says so (AC3).
 */
@Component({
  selector: 'wz-delete-account-form',
  templateUrl: './delete-account-form.html',
  styleUrl: './delete-account-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, InlineMessage],
})
export class DeleteAccountForm {
  readonly deleting = input(false);
  /** The deletion got no answer of its own. */
  readonly failed = input(false);
  /** The rider typed "delete" and chose "Delete my account". */
  readonly confirmed = output();
  readonly cancelled = output();

  protected readonly value = signal('');
  protected readonly ready = computed(() => this.value().trim().toLowerCase() === 'delete');

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.ready() && !this.deleting()) {
      this.confirmed.emit();
    }
  }
}
