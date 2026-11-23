import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { AnnouncerVoicePreset, RideSettings } from '@telo/api';
import { Segmented, type SegmentedOption } from '../segmented/segmented';
import { Setting } from '../settings/setting';
import { SwitchRow } from '../switch/switch-row';

/**
 * Settings' Sound controls (docs/mocks/pages/settings/, L2-163 AC1, L2-169 AC1): Ride sound, its volume from 0 to 100 %
 * in steps of 5, World music, Mute ride sound under a class video, and the optional on-device Race announcer controls.
 */
@Component({
  selector: 'wz-sound-settings',
  imports: [Segmented, Setting, SwitchRow],
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
  readonly raceAnnouncerToggled = output<boolean>();
  readonly announcerVoiceChosen = output<AnnouncerVoicePreset>();
  readonly announcerVolumeChanged = output<number>();
  readonly announcerCaptionsToggled = output<boolean>();

  protected readonly voices: readonly SegmentedOption<AnnouncerVoicePreset>[] = [
    { value: 'arcade', label: 'Arcade hype' },
    { value: 'commentator', label: 'Cycling commentator' },
    { value: 'coach', label: 'Calm coach' },
  ];

  protected changeVolume(event: Event): void {
    this.volumeChanged.emit(Number((event.target as HTMLInputElement).value));
  }

  protected changeAnnouncerVolume(event: Event): void {
    this.announcerVolumeChanged.emit(Number((event.target as HTMLInputElement).value));
  }
}
