import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DisplayNameForm } from '@telo/components';
import { DisplayNameStore } from '../session/display-name-store';

/**
 * The Display name dialog (L2-005 AC3, docs/mocks/dialogs/display-name/), a CDK Dialog opened from Profile's Settings:
 * the current name, "Cancel" and "Save". A saved name closes it; Escape, the close button and Cancel close it with
 * nothing changed, but not while a save is under way. The CDK keeps the focus inside and returns it to the row.
 */
@Component({
  selector: 'wz-display-name-dialog',
  templateUrl: './display-name-dialog.html',
  styleUrl: './display-name-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DisplayNameForm],
  providers: [DisplayNameStore],
})
export class DisplayNameDialog {
  protected readonly store = inject(DisplayNameStore);
  private readonly dialogRef = inject(DialogRef);
  protected readonly name = inject<string>(DIALOG_DATA);

  constructor() {
    this.dialogRef.keydownEvents.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      }
    });
  }

  protected async save(name: string): Promise<void> {
    if (await this.store.save(name)) {
      this.dialogRef.close();
    }
  }

  protected close(): void {
    if (!this.store.saving()) {
      this.dialogRef.close();
    }
  }
}
