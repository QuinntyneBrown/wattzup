// The one player of World Ride's background track (L2-128). It loops the world's track at half
// volume, plays and pauses as the page says, and when the browser refuses to start it before the
// page has had an interaction, it tries again at the rider's next press or key (AC6).
import type { WorldId } from '@telo/api';
import { worldTrack } from './world-music';

const RETRY_EVENTS = ['pointerdown', 'keydown'] as const;

export class WorldMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private wanted = false;
  private waiting = false;

  constructor(
    private readonly makeAudio: () => HTMLAudioElement,
    private readonly doc: Document,
  ) {}

  /** Sets the world's track, once (L2-128 AC2). */
  load(id: WorldId, source = worldTrack(id)): void {
    if (this.audio) return;
    const audio = this.makeAudio();
    audio.loop = true;
    audio.volume = 0.5;
    audio.setAttribute('src', source);
    this.audio = audio;
    if (this.wanted) this.start();
  }

  /** Sets the volume at the rider's position, from silent to full volume. */
  setVolume(volume: number): void {
    if (this.audio) this.audio.volume = Math.min(1, Math.max(0, volume));
  }

  /** Plays or pauses; pausing keeps the position (L2-128 AC2, AC3). */
  sync(play: boolean): void {
    this.wanted = play;
    if (!this.audio) return;
    if (play) this.start();
    else this.audio.pause();
  }

  /** Stops the track and drops it, when the rider leaves World Ride (L2-128 AC7). */
  destroy(): void {
    this.wanted = false;
    this.stopWaiting();
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.audio = null;
  }

  private start(): void {
    const audio = this.audio;
    if (!audio || !audio.paused) return;
    audio.play().catch((e: unknown) => {
      if (e instanceof DOMException && e.name === 'NotAllowedError') this.waitForPress();
      else console.warn('World music could not play', e);
    });
  }

  private readonly retry = (): void => {
    this.stopWaiting();
    if (this.wanted) this.start();
  };

  private waitForPress(): void {
    if (this.waiting) return;
    this.waiting = true;
    for (const type of RETRY_EVENTS) this.doc.addEventListener(type, this.retry, { capture: true });
  }

  private stopWaiting(): void {
    if (!this.waiting) return;
    this.waiting = false;
    for (const type of RETRY_EVENTS)
      this.doc.removeEventListener(type, this.retry, { capture: true });
  }
}
