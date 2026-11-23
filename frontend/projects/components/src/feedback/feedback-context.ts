import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import type { FeedbackContext } from '@telo/api';

/**
 * What Send feedback attaches (block `feedback-context`, L2-117 AC2): "Attached from Ride" and a summary on a toggle
 * that opens on the facts, each rendered as text. The list is closed until the rider opens it.
 */
@Component({
  selector: 'wz-feedback-context',
  templateUrl: './feedback-context.html',
  styleUrl: './feedback-context.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackContextDetails {
  readonly context = input.required<FeedbackContext>();
  /** While the note is sending, the toggle waits too (L2-118 AC1). */
  readonly disabled = input(false);
  protected readonly expanded = signal(false);
}
