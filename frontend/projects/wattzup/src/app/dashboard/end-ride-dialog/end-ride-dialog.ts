import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { formatDuration } from '../../core/format-duration';
import { LiveStateService } from '../../core/live-state.service';
import { WORKOUT_API } from '@wattzup/api';
import { Alert, Dialog } from '@wattzup/components';

/** End this ride? (L2-051) */
@Component({
  selector: 'wz-end-ride-dialog',
  imports: [Alert, Dialog],
  templateUrl: './end-ride-dialog.html',
  styleUrl: './end-ride-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndRideDialog {
  protected readonly ref = inject(DialogRef);
  private readonly live = inject(LiveStateService);
  private readonly workouts = inject(WORKOUT_API);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  /** Read once when the dialog opens, so the sentence holds still. */
  protected readonly description = computed(() => {
    const s = this.live.state();
    const w = s?.workout;
    const elapsed = formatDuration(w?.elapsed_seconds ?? 0);
    const total = formatDuration(w?.total_seconds ?? 0);
    const level = s?.resistance ?? s?.target_resistance ?? '--';
    return `You're ${elapsed} into ${total}. Wattzup stops changing the resistance and leaves the bike at level ${level}.`;
  });

  protected async end(): Promise<void> {
    this.busy.set(true);
    this.ref.disableClose = true;
    this.failed.set(false);
    try {
      const sessionId = await this.workouts.stop();
      this.ref.close();
      if (sessionId) {
        // A saved ride opens its summary as just finished (L2-084 AC1).
        await this.router.navigate(['/sessions', sessionId], { state: { justFinished: true } });
      } else {
        await this.router.navigateByUrl('/classes');
      }
    } catch {
      this.failed.set(true);
    } finally {
      this.busy.set(false);
      this.ref.disableClose = false;
    }
  }
}
