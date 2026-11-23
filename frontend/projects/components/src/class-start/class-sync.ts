import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * "Video link and sync" on Class Start (design-system block class-sync): a disclosure, collapsed at first, that shows
 * the class's video on YouTube (in a new tab) and the video time the ride starts from, "Synced from 0:12.0"
 * (L2-084 AC3). The link is built from the video id only (ADR 0014).
 */
@Component({
  selector: 'wz-class-sync',
  templateUrl: './class-sync.html',
  styleUrl: './class-sync.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassSync {
  readonly videoId = input.required<string>();
  readonly syncOffsetSeconds = input.required<number>();

  protected readonly expanded = signal(false);

  protected readonly link = computed(
    () => `https://www.youtube.com/watch?v=${encodeURIComponent(this.videoId())}`,
  );
  protected readonly linkText = computed(() => `youtube.com/watch?v=${this.videoId()}`);

  /** "0:12.0": minutes, seconds and tenths. */
  protected readonly offset = computed(() => {
    const tenths = Math.round(this.syncOffsetSeconds() * 10);
    const minutes = Math.floor(tenths / 600);
    const seconds = (tenths % 600) / 10;
    return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`;
  });
}
