import { DestroyRef, Injectable, inject } from '@angular/core';
import { VIDEO_PLAYER_FACTORY, type VideoPlayer } from '@telo/api';

/**
 * The video section's preview player (L2-098 AC1, AC4): one player at a time, parked at the offset with YouTube's
 * controls. Loading another video, the frame going or the page going destroys the one before (AGENTS.md, release
 * everything you acquire).
 */
@Injectable()
export class VideoPreviewPlayer {
  private readonly factory = inject(VIDEO_PLAYER_FACTORY);
  private player: VideoPlayer | null = null;
  /** Counts loads, so a player that resolves after a newer load, or after release, is destroyed at once. */
  private generation = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.release());
  }

  load(host: HTMLElement, videoId: string, offset: number): void {
    this.release();
    const generation = this.generation;
    this.factory().then(
      (player) => {
        if (generation !== this.generation) return player.destroy();
        this.player = player;
        void player.load(host, videoId, {
          startSeconds: offset,
          controls: true,
          autoplay: false,
          title: 'Video preview',
        });
      },
      // Without the player the rider can still type the offset.
      () => undefined,
    );
  }

  /** The preview's time, or `null` while no player is loaded. */
  currentTime(): number | null {
    return this.player?.currentTime() ?? null;
  }

  seekTo(seconds: number): void {
    this.player?.seekTo(seconds);
  }

  release(): void {
    this.generation++;
    this.player?.destroy();
    this.player = null;
  }
}
