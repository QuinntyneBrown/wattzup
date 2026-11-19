// The ride commands: Pause, Resume, End and Reconnect (L2-046, L2-051, L2-058).
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { BIKE_API, WORKOUT_API } from '@wattzup/api';
import { DialogLauncher } from './dialog-launcher';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class RideActions {
  private readonly workouts = inject(WORKOUT_API);
  private readonly toasts = inject(ToastService);
  private readonly bike = inject(BIKE_API);
  private readonly dialogs = inject(DialogLauncher);
  private readonly _reconnecting = signal(false);
  readonly reconnecting = this._reconnecting.asReadonly();

  pause(): Promise<void> {
    return this.run(() => this.workouts.pause(), "Couldn't pause the ride");
  }

  resume(): Promise<void> {
    return this.run(() => this.workouts.resume(), "Couldn't resume the ride");
  }

  /** `Reconnect` on the lost-bike overlay (L2-058 AC5, L2-004). */
  async reconnect(): Promise<void> {
    this._reconnecting.set(true);
    try {
      await this.bike.reconnect();
    } catch (e) {
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      if (status !== 401 && status !== 409) {
        this.toasts.show({
          tone: 'danger',
          title: "Couldn't reconnect",
          text: "The Wattzup server didn't answer. Try again.",
        });
      }
    } finally {
      this._reconnecting.set(false);
    }
  }

  end(): void {
    void this.dialogs.openEndRide();
  }

  private async run(request: () => Promise<void>, title: string): Promise<void> {
    try {
      await request();
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      this.toasts.show({
        tone: 'danger',
        title,
        text: "The Wattzup server didn't answer. Try again.",
      });
    }
  }
}
