import { DestroyRef, Injectable, Injector, computed, effect, inject, signal } from '@angular/core';
import {
  ANNOUNCER,
  RIDE_SETTINGS,
  type RaceAnnouncer,
  type RaceAnnouncerSnapshot,
  type RaceCallout,
} from '@telo/api';
import { RaceStore } from './race-store';

/**
 * Lazily loads `@telo/ai`'s `LocalRaceAnnouncer` on the Racing screen only when audio or captions
 * are enabled, binds live `RaceStore` metrics, forwards callouts to the polite ARIA announcer, and
 * releases all worker/audio/observer resources when the rider leaves the race (L2-170 to L2-175).
 */
@Injectable()
export class RaceAnnouncerController {
  private readonly race = inject(RaceStore);
  private readonly settingsStore = inject(RIDE_SETTINGS);
  private readonly screenReader = inject(ANNOUNCER);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly instance = signal<RaceAnnouncer | null>(null);
  private readonly mutedSignal = signal(false);
  private loading = false;
  private disposed = false;
  private lastAnnouncedId: string | null = null;

  readonly muted = this.mutedSignal.asReadonly();
  readonly activeCallout = computed<RaceCallout | null>(() => {
    if (!this.settingsStore.settings().announcerCaptions) return null;
    return this.instance()?.activeCallout() ?? null;
  });

  readonly snapshot = computed<RaceAnnouncerSnapshot>(() => {
    const map = this.race.map();
    const plan = this.race.plan();
    const rows = this.race.boardRows();
    const rawPlace = this.race.place();
    const parsedPlace = rawPlace ? Number.parseInt(rawPlace, 10) : 1;
    const position = Number.isFinite(parsedPlace) && parsedPlace > 0 ? parsedPlace : 1;
    const aheadRow = position > 1 ? rows[position - 2] : null;
    const distanceMeters = Number(this.race.distance()) * 1000;
    const totalMeters = map ? map.distanceKm * 1000 : 0;
    const remainingMeters = Math.max(0, totalMeters - distanceMeters);
    const remainingSeconds = Math.max(0, this.race.total() - this.race.elapsed());
    const seg = map && plan ? map.plan.segments[plan.index] : null;
    const cadence = Number(this.race.cadence());

    return {
      running: this.race.running(),
      paused: this.race.paused(),
      countdownSeconds: null,
      position,
      totalRiders: this.race.fieldSize() || 1,
      aheadName: aheadRow ? aheadRow.name : null,
      aheadGapMeters: null,
      targetResistance: seg?.level ?? this.race.resistance() ?? 0,
      cadenceRpm: Number.isFinite(cadence) ? cadence : 0,
      targetCadenceRpm: seg?.cadenceAim ?? 0,
      ghostGapMeters: null,
      stageIndex: plan?.index ?? 0,
      stageTitle: seg?.kind ?? 'Stage',
      remainingMeters,
      remainingSeconds,
      finished: false,
    };
  });

  constructor() {
    effect(() => {
      const s = this.settingsStore.settings();
      if ((s.raceAnnouncer || s.announcerCaptions) && !this.instance() && !this.loading) {
        void this.activate();
      }
    });

    effect(() => {
      const paused = this.race.paused();
      const announcer = this.instance();
      if (!announcer) return;
      if (paused) announcer.pause();
      else announcer.resume();
    });

    effect(() => {
      const callout = this.activeCallout();
      if (callout && callout.id !== this.lastAnnouncedId) {
        this.lastAnnouncedId = callout.id;
        this.screenReader.announce(callout.text);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.disposed = true;
      this.instance()?.stop();
      this.instance.set(null);
    });
  }

  toggleMute(): void {
    const next = !this.mutedSignal();
    this.mutedSignal.set(next);
    if (next) {
      this.instance()?.mute();
    }
  }

  private async activate(): Promise<void> {
    this.loading = true;
    try {
      const { LocalRaceAnnouncer, OpfsVoicePackStore } = await import('@telo/ai');
      if (this.disposed) return;
      const voicePack = new OpfsVoicePackStore();
      void voicePack.refresh();
      const announcer = new LocalRaceAnnouncer(this.injector);
      this.instance.set(announcer);
      announcer.start({
        snapshot: this.snapshot,
        audioEnabled: computed(
          () =>
            voicePack.state().status === 'ready' &&
            this.settingsStore.settings().raceAnnouncer &&
            !this.mutedSignal(),
        ),
        captionsEnabled: computed(() => this.settingsStore.settings().announcerCaptions),
        voice: computed(() => this.settingsStore.settings().announcerVoice),
        volume: computed(() => this.settingsStore.settings().announcerVolume),
      });
    } finally {
      this.loading = false;
    }
  }
}
