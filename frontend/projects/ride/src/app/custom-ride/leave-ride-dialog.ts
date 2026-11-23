import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RideLeave } from '@telo/components';

/** What the rider chose in "Leave this ride?"; Escape and a press outside choose none, which keeps riding. */
export type LeaveChoice = 'save' | 'discard' | 'keep';

/** How far the ride went, as the popover reads it: "6:52" and "2.24 km". */
export interface LeaveRideData {
  readonly elapsed: string;
  readonly distance: string;
}

/**
 * "Leave this ride?" (L2-107, docs/mocks/dialogs/end-ride/), a CDK Dialog the custom ride opens under Library as a
 * popover: modal, labelled by its title, the focus starting on Save ride and open library, closing with the choice.
 */
@Component({
  selector: 'wz-leave-ride-dialog',
  imports: [RideLeave],
  templateUrl: './leave-ride-dialog.html',
  styleUrl: './leave-ride-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveRideDialog {
  protected readonly data = inject<LeaveRideData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<LeaveChoice>>(DialogRef);

  protected close(choice: LeaveChoice): void {
    this.dialogRef.close(choice);
  }
}
