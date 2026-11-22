import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { RideSettings } from '@telo/api';
import { Setting } from '../settings/setting';
import { SwitchRow } from '../switch/switch-row';

/**
 * Settings' Sound controls (docs/mocks/pages/settings/, L2-163 AC1): Ride sound, its volume from 0 to 100 % in steps of
 * 5, World music and Mute ride sound under a class video. The volume changes as the rider drags. Inputs from the page,
 * outputs to it.
 */
@Component({
  selector: 'wz-sound-settings',
  imports: [Setting, SwitchRow],
  templateUrl: './sound-settings.html',
  styleUrl: './sound-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoundSettings {
  readonly settings = input.required<RideSettings>();

  readonly rideSoundToggled = output<boolean>();
  readonly volumeChanged = output<number>();
  readonly worldMusicToggled = output<boolean>();
  readonly muteUnderVideoToggled = output<boolean>();

  protected changeVolume(event: Event): void {
    this.volumeChanged.emit(Number((event.target as HTMLInputElement).value));
  }
}
