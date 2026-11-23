import { effect, signal, type EffectRef, type Injector } from '@angular/core';
import type {
  LobbyAnnouncerContext,
  RaceAnnouncer,
  RaceAnnouncerSource,
  RaceCallout,
  ThermalGovernor,
} from '@telo/api';
import { WebAudioAnnouncerMixer } from './audio/web-audio-announcer-mixer';
import { RaceAnnouncerDirector } from './director/race-announcer-director';
import { BrowserThermalGovernor } from './thermal/browser-thermal-governor';
import { KokoroWorkerClient, STATIC_LOBBY_PHRASES } from './worker/kokoro-worker-client';

const MIN_BANNER_DURATION_MS = 3_500;

/**
 * Full on-device race announcer implementation (L1-028, L2-170 to L2-175):
 * coordinates the deterministic director, thermal auto-governor, off-thread Kokoro worker client,
 * Web Audio ducking mixer, and 3.5 s visual caption banner with graceful error degradation.
 */
export class LocalRaceAnnouncer implements RaceAnnouncer {
  private readonly calloutSignal = signal<RaceCallout | null>(null);
  private readonly mutedSignal = signal(false);
  private audioDegraded = false;
  private bannerTimer: ReturnType<typeof setTimeout> | null = null;
  private sourceEffect: EffectRef | null = null;
  private volumeEffect: EffectRef | null = null;

  readonly activeCallout = this.calloutSignal.asReadonly();
  readonly ducking: RaceAnnouncer['ducking'];

  constructor(
    private readonly injector: Injector,
    private readonly director = new RaceAnnouncerDirector(),
    private readonly worker = new KokoroWorkerClient(),
    private readonly mixer = new WebAudioAnnouncerMixer(),
    private readonly governor: ThermalGovernor = new BrowserThermalGovernor(),
    private readonly now: () => number = () => Date.now(),
  ) {
    this.ducking = this.mixer.ducking;
  }

  async prepareLobby(context: LobbyAnnouncerContext): Promise<void> {
    if (this.audioDegraded) return;
    try {
      await this.worker.precache(STATIC_LOBBY_PHRASES, context.voice);
    } catch {
      // Graceful degradation: captions remain available if pre-caching fails (L2-175 AC2).
      this.audioDegraded = true;
    }
  }

  start(source: RaceAnnouncerSource): void {
    this.stop();
    this.audioDegraded = false;
    this.mutedSignal.set(false);
    this.director.reset();
    this.governor.start();

    this.volumeEffect = effect(
      () => {
        this.mixer.setVolume(source.volume());
      },
      { injector: this.injector },
    );

    this.sourceEffect = effect(
      () => {
        const snapshot = source.snapshot();
        const audioOn = source.audioEnabled() && !this.mutedSignal() && !this.audioDegraded;
        const captionsOn = source.captionsEnabled();
        if (!audioOn && !captionsOn) return;

        const callout = this.director.evaluate(snapshot, this.now());
        if (!callout) return;

        if (captionsOn) {
          this.showBanner(callout);
        }

        if (audioOn) {
          void this.speak(callout, source.voice(), source.volume());
        }
      },
      { injector: this.injector },
    );
  }

  pause(): void {
    this.director.clearPending();
    this.mixer.stopActive();
  }

  resume(): void {
    // Intentionally does not replay stale callouts (L2-170 AC5).
  }

  mute(): void {
    this.mutedSignal.set(true);
    this.mixer.stopActive();
  }

  stop(): void {
    this.sourceEffect?.destroy();
    this.sourceEffect = null;
    this.volumeEffect?.destroy();
    this.volumeEffect = null;
    this.clearBannerTimer();
    this.calloutSignal.set(null);
    this.governor.stop();
    this.mixer.dispose();
    this.worker.dispose();
  }

  private async speak(
    callout: RaceCallout,
    voice: LobbyAnnouncerContext['voice'],
    volume: number,
  ): Promise<void> {
    try {
      const cached = this.worker.getCached(callout.text, voice);
      if (cached) {
        await this.mixer.play(cached, volume);
        return;
      }
      if (!this.governor.allowLiveSynthesis()) {
        // Under serious/critical thermal pressure, skip live synthesis; captions remain (L2-173 AC3).
        return;
      }
      const pcm = await this.worker.synthesize(callout.text, voice);
      await this.mixer.play(pcm, volume);
    } catch {
      // Disable audio cleanly without harming BLE, clock, or 3D rendering (L2-175 AC2).
      this.audioDegraded = true;
      this.mixer.stopActive();
    }
  }

  private showBanner(callout: RaceCallout): void {
    this.clearBannerTimer();
    this.calloutSignal.set(callout);
    this.bannerTimer = setTimeout(() => {
      this.bannerTimer = null;
      this.calloutSignal.set(null);
    }, MIN_BANNER_DURATION_MS);
  }

  private clearBannerTimer(): void {
    if (this.bannerTimer !== null) {
      clearTimeout(this.bannerTimer);
      this.bannerTimer = null;
    }
  }
}
