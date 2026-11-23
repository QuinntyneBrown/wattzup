import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

/** A named time in the film that the visitor can jump to. */
export interface FilmChapter {
  /** Seconds into the film. */
  at: number;
  /** The time as it is shown: "0:21". */
  time: string;
  title: string;
}

/**
 * The marketing site's pitch film (block film, ADR 0027). Until the visitor presses play or picks a
 * chapter it shows the still as a button over a film that is not fetched (`preload="none"`); then
 * the film plays with the browser's own controls and takes the focus. The chapter chosen is
 * `aria-current` while the film plays. The narration is not in the picture, so the film carries
 * its captions as a track.
 */
@Component({
  selector: 'wz-film',
  templateUrl: './film.html',
  styleUrl: './film.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'film' },
})
export class Film {
  readonly src = input.required<string>();
  /** The WebVTT captions of the narration. */
  readonly captions = input.required<string>();
  readonly still = input.required<string>();
  /** The film's name for assistive technology: "Meet Telo Ride". */
  readonly label = input.required<string>();
  /** The play button's name: "Play the Telo Ride film". */
  readonly playLabel = input.required<string>();
  /** The length shown on the still: "2:19". */
  readonly length = input.required<string>();
  readonly chapters = input<readonly FilmChapter[]>([]);

  protected readonly playing = signal(false);
  protected readonly current = signal(0);
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  constructor() {
    // Release the media: a removed element can keep its buffered film until it is collected.
    inject(DestroyRef).onDestroy(() => {
      const video = this.video().nativeElement;
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
  }

  /** Plays from a chapter; the play button starts at the beginning. */
  protected play(index: number | null = null): void {
    this.current.set(index ?? 0);
    this.playing.set(true);
    const video = this.video().nativeElement;
    video.currentTime = index === null ? 0 : this.chapters()[index].at;
    // A browser may refuse to play; the controls are there for the visitor to press.
    video.play().catch(() => undefined);
    video.focus({ preventScroll: true });
  }
}
