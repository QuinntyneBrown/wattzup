import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { APP_UPDATES, RIDE_ACTIVITY } from '@telo/api';
import { Toast, ToastRegion } from '@telo/components';

/**
 * The offer of a new version (L2-150 AC2, docs/mocks/pages/home/update-ready.html): a toast with Reload once the new
 * version is ready, held while a ride is in progress and shown when it ends. It stays until Reload or ×.
 */
@Component({
  selector: 'wz-update-prompt',
  templateUrl: './update-prompt.html',
  styleUrl: './update-prompt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Toast, ToastRegion],
})
export class UpdatePrompt {
  private readonly updates = inject(APP_UPDATES);
  private readonly activity = inject(RIDE_ACTIVITY);
  private readonly dismissed = signal(false);
  protected readonly shown = computed(
    () => this.updates.ready() && !this.activity.inProgress() && !this.dismissed(),
  );

  protected reload(): void {
    void this.updates.reload();
  }

  protected dismiss(): void {
    this.dismissed.set(true);
  }
}
