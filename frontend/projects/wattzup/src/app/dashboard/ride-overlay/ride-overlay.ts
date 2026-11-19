import {
  ChangeDetectionStrategy,
  Component,
  effect,
  type ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { RideOverlayText } from '../../core/ride-overlay-text';
import { Icon } from '@wattzup/components';

/** The veil over the dashboard when the bike can't be used (L2-058). */
@Component({
  selector: 'wz-ride-overlay',
  imports: [Icon, RouterLink],
  templateUrl: './ride-overlay.html',
  styleUrl: './ride-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideOverlay {
  readonly overlay = input.required<RideOverlayText>();
  readonly reconnecting = input(false);
  readonly reconnect = output();
  readonly diagnostics = output();

  /** The summary opens as just finished: `Done` and `Ride saved` (L2-085 AC2). */
  protected readonly justFinished = { justFinished: true };
  private readonly seeYourRide = viewChild<ElementRef<HTMLAnchorElement>>('seeYourRide');

  constructor() {
    // Ride complete takes focus to See your ride (L2-084 AC3).
    effect(() => this.seeYourRide()?.nativeElement.focus());
  }
}
