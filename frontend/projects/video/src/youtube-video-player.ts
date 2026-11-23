import { signal } from '@angular/core';
import type { PlayerOptions, PlayerState, VideoPlayer } from '@telo/api';

/** The IFrame Player API's script, the one script the CSP lets in from YouTube (L2-131 AC1, ADR 0012). */
const API_URL = 'https://www.youtube.com/iframe_api';
/** YouTube's privacy-enhanced domain, which sets no cookies until playback (L2-088 AC5). */
const EMBED_HOST = 'https://www.youtube-nocookie.com';
const PLAYING = 1;
const PAUSED = 2;

/** The part of `YT.Player` Telo Ride uses. */
interface YtPlayer {
  getIframe(): HTMLIFrameElement;
  getCurrentTime(): number;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

interface YtEvent {
  readonly target: YtPlayer;
  readonly data?: number;
}

interface YtNamespace {
  Player: new (element: HTMLElement, options: object) => YtPlayer;
}

type YtWindow = Window & { YT?: YtNamespace; onYouTubeIframeAPIReady?: () => void };

let loading: Promise<YtNamespace> | null = null;

/** Loads the IFrame API once per page. A blocked or failed script rejects, and the next player tries again. */
function loadApi(document: Document): Promise<YtNamespace> {
  const window = document.defaultView as YtWindow;
  if (window.YT?.Player) return Promise.resolve(window.YT);
  loading ??= new Promise<YtNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT!);
    };
    const script = document.createElement('script');
    script.src = API_URL;
    script.async = true;
    script.onerror = () => {
      script.remove();
      loading = null;
      reject(new Error('The YouTube IFrame API did not load.'));
    };
    document.head.append(script);
  });
  return loading;
}

/**
 * The class video from YouTube's privacy-enhanced embed (docs/detailed-designs/classes/ride-a-class, ADR 0012). It
 * plays from the start it is given, or waits parked there with autoplay off; with controls off, the frame is also out
 * of the tab order, since the ride controls
 * it. A script that cannot load, or a player error, leaves it in `error`.
 */
export class YouTubeVideoPlayer implements VideoPlayer {
  private readonly current = signal<PlayerState>('loading');
  private player: YtPlayer | null = null;
  private destroyed = false;

  readonly state = this.current.asReadonly();

  async load(host: HTMLElement, videoId: string, options: PlayerOptions): Promise<void> {
    let api: YtNamespace;
    try {
      api = await loadApi(host.ownerDocument);
    } catch {
      this.current.set('error');
      return;
    }
    if (this.destroyed) return;
    const element = host.ownerDocument.createElement('div');
    host.append(element);
    this.player = new api.Player(element, {
      host: EMBED_HOST,
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        controls: options.controls ? 1 : 0,
        disablekb: options.controls ? 0 : 1,
        playsinline: 1,
        rel: 0,
        // Parked, the video opens at its start: seekTo from the cued state would play it.
        ...(options.autoplay ? {} : { start: Math.floor(options.startSeconds) }),
      },
      events: {
        onReady: ({ target }: YtEvent) => {
          const frame = target.getIframe();
          frame.setAttribute('title', options.title);
          if (!options.controls) frame.setAttribute('tabindex', '-1');
          if (!options.autoplay) return;
          target.seekTo(options.startSeconds, true);
          target.playVideo();
        },
        onStateChange: ({ data }: YtEvent) => {
          if (data === PLAYING) this.current.set('playing');
          else if (data === PAUSED) this.current.set('paused');
        },
        onError: () => this.current.set('error'),
      },
    });
  }

  currentTime(): number {
    return this.player?.getCurrentTime() ?? 0;
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  seekTo(seconds: number): void {
    this.player?.seekTo(seconds, true);
  }

  destroy(): void {
    this.destroyed = true;
    this.player?.destroy();
    this.player = null;
  }
}
