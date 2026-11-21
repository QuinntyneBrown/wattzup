import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Dialog } from '@wattzup/components';
import { RideSound } from '../../core/ride-sound.service';

/** Ride sound: on or off (L2-129 AC2). */
@Component({
  selector: 'wz-ride-sound-dialog',
  imports: [Dialog],
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
