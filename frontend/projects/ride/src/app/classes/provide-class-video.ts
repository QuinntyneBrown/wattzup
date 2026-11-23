import type { Provider } from '@angular/core';
import { VIDEO_PLAYER_FACTORY } from '@telo/api';

/**
 * The class video's player for the routes that show it, Class Start and the class ride: the `video` library is
 * imported only when a page asks for a player (AGENTS.md, lazy loading first).
 */
export function provideClassVideo(): Provider {
  return {
    provide: VIDEO_PLAYER_FACTORY,
    useValue: () => import('@telo/video').then((video) => new video.YouTubeVideoPlayer()),
  };
}
