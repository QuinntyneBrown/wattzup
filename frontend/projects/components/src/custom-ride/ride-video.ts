import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { InlineMessage } from '../inline-message/inline-message';

/**
 * The custom ride's video (design-system block ride-video, L2-103 AC2): 16:9 below lg and filling the column from lg,
 * the video's cover under the frame its player embeds in, emitted once drawn for the page to hand to the player. When
 * the video cannot play, a notice says the ride goes on without it (L2-088 AC4).
 */
@Component({
  selector: 'wz-ride-video',
  imports: [InlineMessage],
  templateUrl: './ride-video.html',
  styleUrl: './ride-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ride-video' },
})
export class RideVideo implements AfterViewInit {
  readonly videoId = input.required<string>();
  /** What the video is, for its cover's text. */
  readonly title = input.required<string>();
  readonly unavailable = input(false);
  readonly frame = output<HTMLElement>();

  /** YouTube's 4:3 cover, cropped to its 16:9 picture (ADR 0014). */
  protected readonly cover = computed(
    () => `https://i.ytimg.com/vi/${encodeURIComponent(this.videoId())}/hqdefault.jpg`,
  );

  // Found from the host rather than with viewChild, as the class video's is.
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    this.frame.emit(this.host.nativeElement.querySelector<HTMLElement>('.ride-video__player')!);
  }
}
