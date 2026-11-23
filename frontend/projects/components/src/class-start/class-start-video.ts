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

/**
 * Class Start's video frame (design-system block class-start-video): the class cover until the player paints over it,
 * and the element the player takes over, emitted once it is drawn for the page to hand to the player (L2-084 AC1).
 */
@Component({
  selector: 'wz-class-start-video',
  templateUrl: './class-start-video.html',
  styleUrl: './class-start-video.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassStartVideo implements AfterViewInit {
  readonly videoId = input.required<string>();
  readonly title = input.required<string>();

  /** YouTube's 4:3 cover, cropped to its 16:9 picture (ADR 0014). */
  protected readonly cover = computed(
    () => `https://i.ytimg.com/vi/${encodeURIComponent(this.videoId())}/hqdefault.jpg`,
  );

  /** The element the player embeds its frame in, once it is drawn. */
  readonly frame = output<HTMLElement>();

  // Found from the host rather than with viewChild, whose query runtime would join the initial bundle (AGENTS.md).
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    this.frame.emit(
      this.host.nativeElement.querySelector<HTMLElement>('.class-start-video__player')!,
    );
  }
}
