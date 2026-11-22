import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';
import { Progress } from '../progress/progress';

/** The running check's words and how far it has got (L2-162 AC2). */
export interface DeviceCheckRunningView {
  readonly label: string;
  readonly percent: number;
  readonly foot: string;
}

/** The finished check's words (L2-162 AC3): "High" holds "60 fps", and the detail. */
export interface DeviceCheckResultView {
  readonly level: string;
  readonly fps: string;
  readonly detail: string;
}

/**
 * Settings' "Check this device" (docs/mocks/pages/settings/ checking and checked, L2-162): what the check does and its
 * button; while it runs, its progress as a polite live region with "Stop the check"; when it has run, the level found
 * with "Check again". Inputs from the page, outputs to it.
 */
@Component({
  selector: 'wz-device-check',
  imports: [Button, Progress],
  templateUrl: './device-check.html',
  styleUrl: './device-check.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceCheck {
  readonly running = input<DeviceCheckRunningView | null>(null);
  readonly result = input<DeviceCheckResultView | null>(null);
  /** No 3D in this browser: nothing to check (L2-161 AC4). */
  readonly disabled = input(false);

  readonly checkStarted = output();
  readonly checkStopped = output();
}
