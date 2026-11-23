import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
} from '@angular/core';

/**
 * The element a video preview's player embeds its frame in, emitted once it is drawn for the page to hand to the
 * player. One frame is drawn per video, so a new link draws a new frame, and the old one goes with its player's frame.
 */
@Component({
  selector: 'wz-video-frame',
  templateUrl: './video-frame.html',
  styleUrl: './video-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoFrame implements AfterViewInit {
  readonly drawn = output<HTMLElement>();

  // Found from the host rather than with viewChild, whose query runtime would join the initial bundle (AGENTS.md).
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    this.drawn.emit(this.host.nativeElement.querySelector<HTMLElement>('.video-frame')!);
  }
}
