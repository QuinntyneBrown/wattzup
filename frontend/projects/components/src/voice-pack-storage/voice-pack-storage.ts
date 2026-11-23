import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { VoicePackState } from '@telo/api';
import { Button } from '../button/button';
import { Setting } from '../settings/setting';

/**
 * Settings → This device row for the opt-in race announcer voice pack (L2-168):
 * shows Absent, Downloading (with progress and Cancel), Ready (with MB and Delete), or Error.
 */
@Component({
  selector: 'wz-voice-pack-storage',
  imports: [Button, Setting],
  templateUrl: './voice-pack-storage.html',
  styleUrl: './voice-pack-storage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoicePackStorage {
  readonly state = input.required<VoicePackState>();

  readonly downloadRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly deleteRequested = output<void>();

  protected readonly percent = computed(() => {
    const { downloadedBytes, totalBytes } = this.state();
    if (totalBytes <= 0) return 0;
    return Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
  });

  protected readonly sizeLabel = computed(() => {
    const s = this.state();
    if (s.status === 'ready') {
      const mb = Math.max(1, Math.round(s.totalBytes / (1024 * 1024)));
      return `Race announcer · ${mb} MB`;
    }
    if (s.status === 'downloading') {
      const doneMb = Math.round(s.downloadedBytes / (1024 * 1024));
      const totalMb = Math.max(1, Math.round(s.totalBytes / (1024 * 1024)));
      return `${this.percent()} % · ${doneMb} / ${totalMb} MB`;
    }
    return 'Not downloaded';
  });
}
