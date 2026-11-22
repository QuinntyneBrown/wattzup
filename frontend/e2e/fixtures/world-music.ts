// The world's track as the page plays it (`main`'s WorldMusicPlayer, L2-163): every `play()` of an audio element,
// recorded with its source, so a spec can say which track played without hearing it.
import type { Page } from '@playwright/test';

export class WorldMusic {
  private constructor(private readonly page: Page) {}

  /** Call before the page loads. */
  static async install(page: Page): Promise<WorldMusic> {
    await page.addInitScript(() => {
      const played: string[] = [];
      (window as unknown as { __played: string[] }).__played = played;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        if (this instanceof HTMLAudioElement) played.push(this.getAttribute('src') ?? '');
        return play.call(this);
      };
    });
    return new WorldMusic(page);
  }

  /** The sources of the audio the page asked to play, in order. */
  played(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { __played: string[] }).__played);
  }
}
