import { InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';

/** What the player is doing: loading until it plays, and `error` once it cannot (blocked, offline, removed). */
export type PlayerState = 'loading' | 'playing' | 'paused' | 'error';

/**
 * How a video loads: where it starts, whether YouTube's controls show, whether it plays at once or waits parked at its
 * start (Class Start, L2-084 AC1), and the frame's accessible title.
 */
export interface PlayerOptions {
  readonly startSeconds: number;
  readonly controls: boolean;
  readonly autoplay: boolean;
  readonly title: string;
}

/**
 * A class video player (docs/detailed-designs/classes/ride-a-class, ADR 0012). Only the `video` library implements
 * it, with YouTube's privacy-enhanced embed; pages and stores use it through `VIDEO_PLAYER_FACTORY`.
 */
export interface VideoPlayer {
  readonly state: Signal<PlayerState>;
  /**
   * Embeds `videoId` in `host` and plays it from `options.startSeconds`, or parks it there when `autoplay` is off; a
   * failure shows in `state`, never rejects.
   */
  load(host: HTMLElement, videoId: string, options: PlayerOptions): Promise<void>;
  /** The video's time, in seconds. */
  currentTime(): number;
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  /** Removes the player and its frame. */
  destroy(): void;
}

/** Resolves a new player; the class ride binds it to a dynamic import, so the player's code loads with a ride. */
export type VideoPlayerFactory = () => Promise<VideoPlayer>;

export const VIDEO_PLAYER_FACTORY = new InjectionToken<VideoPlayerFactory>('VIDEO_PLAYER_FACTORY');
