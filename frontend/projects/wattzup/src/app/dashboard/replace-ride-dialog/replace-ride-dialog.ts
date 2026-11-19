import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { ReplaceRideData } from '../../core/dialog-launcher';
import { WORKOUT_API } from '@wattzup/api';
import { Alert, Dialog } from '@wattzup/components';

/** Replace the ride in progress? (L2-052) */
@Component({
  selector: 'wz-replace-ride-dialog',
  imports: [Alert, Dialog],
  templateUrl: './replace-ride-dialog.html',
  styleUrl: './replace-ride-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaceRideDialog {
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly data = inject<ReplaceRideData>(DIALOG_DATA);
  private readonly workouts = inject(WORKOUT_API);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly description = `You're ${this.data.elapsed} into ${this.data.currentSummary}. Starting ${this.data.newSummary} ends it and begins the new ride at 0:00.`;

  protected async replace(): Promise<void> {
    this.busy.set(true);
    this.failed.set(false);
    this.ref.disableClose = true;
    try {
      await this.workouts.start(this.data.plan);
      this.ref.close(true);
    } catch {
      this.failed.set(true);
    } finally {
      this.busy.set(false);
      this.ref.disableClose = false;
    }
  }
}
