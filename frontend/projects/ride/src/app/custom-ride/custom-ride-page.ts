import { Dialog, type DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FULLSCREEN } from '@telo/api';
import {
  RideControl,
  RideHeader,
  RideOverlay,
  RideInterval,
  RideMetrics,
  RideReadouts,
  RideVideo,
  RideView,
  RideWorkoutLink,
} from '@telo/components';
import {
  BikeTelemetry,
  ResistanceController,
  RideClock,
  RideTicker,
  RideTotals,
  VideoClockSync,
  WorkoutEngine,
} from '@telo/domain';
import { CustomRideStore } from './custom-ride-store';
import { type LeaveChoice, LeaveRideDialog, type LeaveRideData } from './leave-ride-dialog';
import { openDiagnostics } from '../diagnostics/open-diagnostics';

/**
 * The custom ride (docs/mocks/pages/custom-ride/, L2-101 to L2-104) at `/profile/custom/ride`: the ride header, the
 * telemetry with Power, Cadence and the interval card, the main view with the workout's video and the metrics, and the
 * bike control; the overlay when the ride cannot run, and "Leave this ride?" under Library (L2-105 to L2-108). Every
 * part of the ride is provided here, so leaving the page stops the clock, the ticker and the video and releases them.
 */
@Component({
  selector: 'wz-custom-ride-page',
  imports: [
    RideControl,
    RideHeader,
    RideOverlay,
    RideInterval,
    RideMetrics,
    RideReadouts,
    RideVideo,
    RideView,
    RideWorkoutLink,
    RouterLink,
  ],
  providers: [
    CustomRideStore,
    RideClock,
    RideTicker,
    WorkoutEngine,
    ResistanceController,
    BikeTelemetry,
    RideTotals,
    VideoClockSync,
  ],
  templateUrl: './custom-ride-page.html',
  styleUrl: './custom-ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'custom-ride', '(window:beforeunload)': 'confirmLeaving($event)' },
})
export default class CustomRidePage {
  protected readonly store = inject(CustomRideStore);
  protected readonly fullscreen = inject(FULLSCREEN);
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private leaving: DialogRef<LeaveChoice, LeaveRideDialog> | null = null;
  /** Whether "Leave this ride?" is open, for Library's `aria-expanded` (L2-107 AC1). */
  protected readonly leaveOpen = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.leaving?.close());
  }

  /**
   * Library: the ride pauses and "Leave this ride?" opens under the button, within the side margins on a phone, at most
   * 20 rem wide (L2-107 AC1, AC4). Escape or a press outside keeps riding. Before the ride has started there is nothing
   * to save, so the Class Library opens at once.
   */
  protected openLeave(anchor: HTMLElement): void {
    if (this.leaving) return;
    const leave = this.store.openLeave();
    if (leave === null) return;
    const margin = 20;
    this.leaving = this.dialog.open<LeaveChoice, LeaveRideData, LeaveRideDialog>(LeaveRideDialog, {
      data: leave,
      injector: this.injector,
      ariaLabelledBy: 'leave-title',
      ariaModal: true,
      autoFocus: '#leave-save',
      backdropClass: 'cdk-overlay-transparent-backdrop',
      width: `min(20rem, calc(100vw - ${2 * margin}px))`,
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(anchor)
        .withPositions([
          { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
        ])
        .withViewportMargin(margin)
        .withPush(true),
    });
    this.leaveOpen.set(true);
    this.leaving.closed.subscribe((choice) => {
      this.leaving = null;
      this.leaveOpen.set(false);
      if (choice === 'save' || choice === 'discard') this.store.leave(choice === 'save');
    });
  }

  /** Diagnostics, from the bike status, with this ride's last command in reach (L2-113 AC1, AC2). */
  protected openDiagnostics(): void {
    void openDiagnostics(this.dialog, this.injector);
  }

  protected toggleFullscreen(): void {
    if (this.fullscreen.active()) this.fullscreen.exit();
    else this.fullscreen.enter();
  }

  /** Closing or reloading the tab mid-ride asks the rider to confirm (L2-133 AC4); the listener goes with the page. */
  protected confirmLeaving(event: BeforeUnloadEvent): void {
    event.preventDefault();
  }
}
