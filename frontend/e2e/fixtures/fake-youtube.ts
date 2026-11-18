// The YouTube player, faked (ADR 0012): `https://www.youtube.com/iframe_api` is answered with a
// script that defines a fake `YT.Player`, the nocookie embed with a blank page, and any other
// request off localhost fails the test. Tests drive the player's states and times and read the
// calls the app made.
import type { Page, Route } from '@playwright/test';

export type FakePlayerState = 'unstarted' | 'playing' | 'paused' | 'buffering' | 'ended';
export interface PlayerCall {
  name: string;
  args: unknown[];
}
export interface FakePlayerInfo {
  src: string;
  title: string;
  calls: PlayerCall[];
}

/** Runs in the page as the body of the iframe_api script. */
function fakeIframeApi(): void {
  const CODES: Record<string, number> = {
    unstarted: -1,
    ended: 0,
    playing: 1,
    paused: 2,
    buffering: 3,
  };
  interface Events {
    onReady?: (e: { target: unknown }) => void;
    onStateChange?: (e: { data: number; target: unknown }) => void;
    onError?: (e: { data: number; target: unknown }) => void;
  }
  interface Control {
    players: FakePlayer[];
    title: string;
    refusePlay: boolean;
  }
  const w = window as unknown as {
    YT?: unknown;
    __fakeYT?: Control;
    onYouTubeIframeAPIReady?: () => void;
  };
  const control: Control = w.__fakeYT ?? { players: [], title: '', refusePlay: false };
  w.__fakeYT = control;
  class FakePlayer {
    time = 0;
    state = -1;
    readonly calls: { name: string; args: unknown[] }[] = [];
    readonly src: string;
    constructor(
      readonly el: HTMLIFrameElement,
      readonly opts: { events?: Events },
    ) {
      this.src = el.getAttribute('src') ?? '';
      control.players.push(this);
      setTimeout(() => opts.events?.onReady?.({ target: this }), 0);
    }
    emit(name: string): void {
      this.state = CODES[name] ?? -1;
      this.opts.events?.onStateChange?.({ data: this.state, target: this });
    }
    fail(code: number): void {
      this.opts.events?.onError?.({ data: code, target: this });
    }
    seekTo(seconds: number, allowSeekAhead: boolean): void {
      this.calls.push({ name: 'seekTo', args: [seconds, allowSeekAhead] });
      this.time = seconds;
    }
    playVideo(): void {
      this.calls.push({ name: 'playVideo', args: [] });
      if (!control.refusePlay) this.emit('playing');
    }
    pauseVideo(): void {
      this.calls.push({ name: 'pauseVideo', args: [] });
      this.emit('paused');
    }
    getCurrentTime(): number {
      return this.time;
    }
    getPlayerState(): number {
      return this.state;
    }
    getVideoData(): { title: string } {
      return { title: control.title };
    }
    destroy(): void {
      this.calls.push({ name: 'destroy', args: [] });
    }
  }
  w.YT = { Player: FakePlayer, PlayerState: { ...CODES, UNSTARTED: -1 } };
  w.onYouTubeIframeAPIReady?.();
}

/** A 1 × 1 PNG standing in for every YouTube thumbnail (ADR 0014). */
const THUMBNAIL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

export class FakeYouTube {
  readonly offsite: string[] = [];
  /** Every thumbnail the page asked i.ytimg.com for. */
  readonly thumbnails: string[] = [];
  private thumbnailsFail = false;

  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    await this.page.route(
      (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
      (route: Route) => this.answer(route),
    );
  }

  private async answer(route: Route): Promise<void> {
    const url = new URL(route.request().url());
    if (url.href === 'https://www.youtube.com/iframe_api') {
      await route.fulfill({
        contentType: 'text/javascript',
        body: `(${fakeIframeApi.toString()})();`,
      });
    } else if (url.hostname === 'i.ytimg.com') {
      this.thumbnails.push(url.href);
      await (this.thumbnailsFail
        ? route.fulfill({ status: 404, body: '' })
        : route.fulfill({ contentType: 'image/png', body: THUMBNAIL }));
    } else if (url.hostname === 'www.youtube-nocookie.com') {
      await route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>player</title>',
      });
    } else {
      this.offsite.push(url.href);
      await route.abort();
    }
  }

  /** Answers every thumbnail with 404 from now on (L2-079 AC6). */
  failThumbnails(): void {
    this.thumbnailsFail = true;
  }

  /** The title the fake reports for every video; call it before the page loads. */
  async setTitle(title: string): Promise<void> {
    await this.page.addInitScript((t) => {
      (window as unknown as { __fakeYT: unknown }).__fakeYT = {
        players: [],
        title: t,
        refusePlay: false,
      };
    }, title);
  }

  /** Whether `playVideo` is refused, as a browser blocking autoplay does. */
  async refusePlay(refuse: boolean): Promise<void> {
    await this.page.evaluate((r) => {
      (window as unknown as { __fakeYT: { refusePlay: boolean } }).__fakeYT.refusePlay = r;
    }, refuse);
  }

  /** The newest player: moves it to `state` at `time`, as the rider or YouTube would. */
  async drive(state: FakePlayerState, time?: number): Promise<void> {
    await this.page.evaluate(
      ([s, t]) => {
        const p = (
          window as unknown as {
            __fakeYT: { players: { time: number; emit(n: string): void }[] };
          }
        ).__fakeYT.players.at(-1)!;
        if (typeof t === 'number') p.time = t;
        p.emit(s as string);
      },
      [state, time] as const,
    );
  }

  /** The newest player's time, as the rider scrubbing it would leave it. */
  async scrubTo(time: number): Promise<void> {
    await this.page.evaluate((t) => {
      const w = window as unknown as { __fakeYT: { players: { time: number }[] } };
      w.__fakeYT.players.at(-1)!.time = t;
    }, time);
  }

  /** Raises YouTube error `code` on the newest player. */
  async fail(code: number): Promise<void> {
    await this.page.evaluate((c) => {
      const w = window as unknown as { __fakeYT: { players: { fail(n: number): void }[] } };
      w.__fakeYT.players.at(-1)!.fail(c);
    }, code);
  }

  /** Every player created so far, oldest first. */
  players(): Promise<FakePlayerInfo[]> {
    return this.page.evaluate(() => {
      const w = window as unknown as {
        __fakeYT?: { players: { src: string; calls: PlayerCall[] }[]; title: string };
      };
      return (w.__fakeYT?.players ?? []).map((p) => ({
        src: p.src,
        title: w.__fakeYT!.title,
        calls: p.calls.slice(),
      }));
    });
  }
}
