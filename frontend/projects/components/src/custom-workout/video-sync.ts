import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Switch } from '../switch/switch';
import { Button } from '../button/button';
import { VideoFrame } from './video-frame';

/** The element a preview player is to load `videoId` in. */
export interface VideoFrameDrawn {
  readonly host: HTMLElement;
  readonly videoId: string;
}

let nextId = 0;

/**
 * "Ride along to a video" (design-system blocks setup-toggle and video-sync, L2-098): the switch and, while it is on, the
 * YouTube link (invalid with its message), the preview player's frame, "Ride 0:00 starts at" with its half-second
 * nudges, "Use video's current time", "Check" and the help text. The page owns the player; this draws its frame.
 */
@Component({
  selector: 'wz-video-sync',
  imports: [Button, Switch, VideoFrame],
  templateUrl: './video-sync.html',
  styleUrl: './video-sync.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'setup__video' },
})
export class VideoSync {
  readonly on = input.required<boolean>();
  readonly link = input.required<string>();
  /** The link's message while it is not YouTube's; `null` while it is. */
  readonly error = input<string | null>(null);
  /** The video the preview plays, `null` while there is none. */
  readonly videoId = input<string | null>(null);
  /** The offset as the field reads it ("0:12.0"). */
  readonly offset = input.required<string>();
  readonly atZero = input(false);

  readonly toggled = output<boolean>();
  readonly linkChanged = output<string>();
  readonly offsetTyped = output<string>();
  readonly earlier = output<void>();
  readonly later = output<void>();
  readonly useCurrentTime = output<void>();
  readonly check = output<void>();
  readonly frame = output<VideoFrameDrawn>();

  protected readonly id = `video-sync-${nextId++}`;
  /** One frame per video: a new id draws a new frame. */
  protected readonly frames = computed(() => {
    const id = this.videoId();
    return id === null ? [] : [id];
  });

  protected typed(event: Event): void {
    const field = event.target as HTMLInputElement;
    this.offsetTyped.emit(field.value);
    // A time the page refuses leaves the offset as it was: put its text back.
    field.value = this.offset();
  }

  protected changed(event: Event): void {
    this.linkChanged.emit((event.target as HTMLInputElement).value);
  }
}
