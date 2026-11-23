import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FEEDBACK_MAX_LENGTH, type FeedbackContext } from '@telo/api';
import { FeedbackForm } from '@telo/components';
import { FeedbackStore } from './feedback-store';

/** What the screen that opens Send feedback hands it: the context it attaches. */
export interface FeedbackDialogData {
  readonly context: FeedbackContext;
}

/**
 * Send feedback (L2-116 to L2-118, docs/mocks/dialogs/feedback/), a CDK Dialog: its own `FeedbackStore`, released when
 * it closes, drives the form. "Close feedback", Done and Escape close it; the ride behind stays paused.
 */
@Component({
  selector: 'wz-feedback-dialog',
  templateUrl: './feedback-dialog.html',
  styleUrl: './feedback-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FeedbackForm],
  providers: [FeedbackStore],
})
export default class FeedbackDialog {
  protected readonly store = inject(FeedbackStore);
  protected readonly context = inject<FeedbackDialogData>(DIALOG_DATA).context;
  protected readonly maxLength = FEEDBACK_MAX_LENGTH;
  private readonly dialogRef = inject(DialogRef);

  protected send(): void {
    void this.store.send(this.context);
  }

  protected close(): void {
    this.dialogRef.close();
  }
}
