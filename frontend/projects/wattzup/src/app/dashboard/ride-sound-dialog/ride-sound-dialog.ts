import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Alert, Dialog, Slider } from '@wattzup/components';
import { RideSound } from '../../core/ride-sound.service';

/** Ride sound: on or off, and its volume (L2-129 AC2, AC3, AC8). */
@Component({
  selector: 'wz-ride-sound-dialog',
  imports: [Alert, Dialog, Slider],
  templateUrl: './ride-sound-dialog.html',
  styleUrl: './ride-sound-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideSoundDialog {
  protected readonly ref = inject(DialogRef);
  protected readonly sound = inject(RideSound);

  /** Runs inside the rider's press, so the browser lets the sound start. */
  protected toggle(on: boolean): void {
    if (on) this.sound.turnOn();
    else this.sound.turnOff();
  }
}
