import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DeleteAccountForm } from '@telo/components';
import { AccountStore } from './account-store';

/**
 * The Delete my account dialog (L2-006 AC2, docs/mocks/dialogs/delete-account/), a CDK Dialog opened from Profile's
 * Settings: it says what is removed and waits for "delete". A deletion closes it and opens sign-in, which says so (AC3);
 * a failed one keeps it open. Escape, the close button and Cancel close it, but not while it is deleting.
 */
@Component({
  selector: 'wz-delete-account-dialog',
  templateUrl: './delete-account-dialog.html',
  styleUrl: './delete-account-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DeleteAccountForm],
})
export class DeleteAccountDialog {
  protected readonly store = inject(AccountStore);
  private readonly dialogRef = inject(DialogRef);

  constructor() {
    this.dialogRef.keydownEvents.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      }
    });
  }

  protected async delete(): Promise<void> {
    if (await this.store.deleteAccount()) {
      this.dialogRef.close();
      await this.store.showDeleted();
    }
  }

  protected close(): void {
    if (!this.store.deleting()) {
      this.dialogRef.close();
    }
  }
}
