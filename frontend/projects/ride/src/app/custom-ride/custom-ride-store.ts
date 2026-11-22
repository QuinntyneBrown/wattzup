import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  ANNOUNCER,
  BIKE_CONNECTION,
  BLUETOOTH_SUPPORT,
  REMEMBERED_BIKE,
  RIDE_OUTBOX,
  SCREEN_WAKE_LOCK,
  VIDEO_PLAYER_FACTORY,
  type VideoPlayer,
} from '@telo/api';
import {
  type RideBikeTone,
  type RideDelta,
  type RideMetric,
  type RideOverlayKind,
  type RideRun,
  type TraceSegment,
  formatClock,
  formatMetric,
} from '@telo/components';
import {
  BikeTelemetry,
  PowerModel,
  PowerTrace,
  RideClock,
  RideRecorder,
  ResistanceController,
  RideTicker,
  RideTotals,
  VideoClockSync,
  WorkoutEngine,
  bikeStatus,
  bleLinkName,
  customWorkoutLabel,
  intervalPlace,
  planLength,
  planStateAt,
  traceMaxWatts,
  videoOf,
} from '@telo/domain';
import { CustomWorkoutStore } from '../custom-workout/custom-workout-store';
import { customStepAnnouncement } from '../rides/step-announcement';

/** A ride shorter than this is not worth keeping (L2-108 AC3). */
const MIN_SAVED_SECONDS = 60;

/**
 * The custom ride's state (docs/detailed-designs/custom-workout/ride-a-custom-workout), provided by the page so it goes
 * when the rider leaves. With a bike connected it rides the plan of Custom workout's draft from the moment it opens;
 * with none it waits at 0:00 for one and for Start (L2-106). Then the clock, the ticker and the engine follow the plan,
 * which sends each segment's level as the target resistance (L2-100 AC2). The header, the readouts' targets and the
 * interval card read the ticker's whole seconds (L2-134 AC2); Power and Cadence read the bike's telemetry as it arrives.
 * The rider pauses and resumes it, and a lost bike pauses it until the rider resumes (L2-105). End, the plan's end and
 * Library's "Save ride" submit it, unless it lasted under a minute (L2-107, L2-108).
 */
@Injectable()
export class CustomRideStore {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly engine = inject(WorkoutEngine);
  private readonly telemetry = inject(BikeTelemetry);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly support = inject(BLUETOOTH_SUPPORT);
  private readonly rememberedBike = inject(REMEMBERED_BIKE);
  private readonly remembered = this.rememberedBike.get();
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  private readonly draft = inject(CustomWorkoutStore).draft;
  private readonly totals = inject(RideTotals);
  private readonly resistance = inject(ResistanceController);
  private readonly outbox = inject(RIDE_OUTBOX);
  private readonly router = inject(Router);
  /** The ride's facts, second by second, for its submission (L2-108). */
  private readonly recorder = new RideRecorder();
  /** The seconds recorded: the trace and the totals have moved on to it. */
  private readonly recorded = signal(0);
  private lastSecond = 0;
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private readonly sync = inject(VideoClockSync);
  private readonly player = signal<VideoPlayer | null>(null);
  private readonly playerMissing = signal(false);
  private videoHost: HTMLElement | null = null;
  private destroyed = false;
  /** Whether the rider paused the ride, or a lost bike paused it for them (L2-105 AC1, AC2). */
  private readonly pausedByRider = signal(false);
  /** Whether the ride has started: at once with a bike, otherwise by Start once one is connected (L2-106). */
  private readonly started = signal(false);
  /** Whether the ride has ended: at the plan's length, or by End. */
  private readonly ended = signal(false);
  /** Whether the bike has stopped answering since the ride started (`ble` not connected, L2-017). */
  readonly bikeLost = computed(
    () => this.started() && !this.ended() && this.connection.ble() !== 'connected',
  );

  /** The plan as the ride started it; editing the workout leaves this ride (L2-101 AC3). */
  readonly plan = inject(CustomWorkoutStore).plan();
  readonly lengthSeconds = planLength(this.plan);
  readonly workout = customWorkoutLabel(this.draft());
  /** The workout's YouTube video, or `null` without one (L2-098 AC6). */
  readonly videoId = videoOf(this.draft());
  /** Where in the video the ride's 0:00 falls, in seconds (L2-098 AC3). */
  private readonly offset = this.draft().video.offset;
  /** Whether the video cannot play: its code or YouTube's did not load, or the player failed. */
  readonly videoUnavailable = computed(
    () => this.playerMissing() || this.player()?.state() === 'error',
  );
  /** The whole seconds ridden, never past the plan's length. */
  readonly elapsed = computed(() => Math.min(this.ticker.second(), this.lengthSeconds));
  readonly clockText = computed(() => formatClock(this.elapsed()));
  readonly totalText = formatClock(this.lengthSeconds);
  /** The rider's power for each second of the plan, for the trace; released with the page. */
  private readonly trace = new PowerTrace(this.lengthSeconds);
  /** The seconds each point of the trace averages: at most 900 points, however long the plan. */
  readonly bucket = Math.max(1, Math.ceil(this.lengthSeconds / 900));
  readonly traceMax = traceMaxWatts(this.plan);
  readonly segments: readonly TraceSegment[] = this.plan.segments.map((segment) => ({
    kind: segment.kind,
    duration: segment.duration,
    target: PowerModel.target(segment.cadenceAim, segment.level),
  }));
  readonly averages = computed(() => {
    this.recorded();
    return this.trace.averages(this.bucket);
  });

  /** The bike status (L2-019): the bike's name while connected or lost, and its words. */
  readonly bike = computed(() => {
    const name = (this.connection.bike() ?? this.remembered)?.name ?? null;
    const status = bikeStatus(this.connection.ble(), this.support.state(), name);
    // While the ride waits for its lost bike, reconnecting included, the status says so in red (L2-105 AC2).
    if (this.bikeLost() && status.rideLabel === 'No bike connected')
      return { name, state: 'Disconnected', tone: 'alert' as RideBikeTone };
    const tone: RideBikeTone =
      status.rideLabel === 'Connected'
        ? 'ok'
        : status.rideLabel === 'Disconnected'
          ? 'alert'
          : 'none';
    const named = tone !== 'none';
    return { name: named ? name : null, state: status.rideLabel, tone };
  });

  /** The plan's segment at this whole second; the last one once the plan is done. */
  private readonly state = computed(
    () =>
      planStateAt(this.plan, this.elapsed() * 1000) ??
      planStateAt(this.plan, this.lengthSeconds * 1000 - 1),
  );

  /** The interval card (L2-102 AC2). */
  readonly interval = computed(() => {
    const state = this.state();
    if (state === null) return null;
    const place = intervalPlace(this.plan, state.index);
    return {
      kind: state.segment.kind,
      round: place.round,
      next: place.next,
      left: Math.ceil(state.remainingMs / 1000),
      percent: state.progress * 100,
    };
  });

  readonly target = computed(() => this.state()?.targetPower ?? null);
  readonly aim = computed(() => this.state()?.segment.cadenceAim ?? null);
  readonly power = computed(() => formatMetric(this.round(this.telemetry.powerW()), 0));
  readonly cadence = computed(() => formatMetric(this.telemetry.cadence(), 0));
  /** Power against the target: "On target" within 10 %, otherwise the signed delta (L2-102 AC1). */
  readonly delta = computed<RideDelta | null>(() => {
    const power = this.round(this.telemetry.powerW());
    const target = this.target();
    if (power === null || target === null) return null;
    if (PowerModel.onTarget(power, target)) return { text: 'On target', tone: 'on' };
    const delta = power - target;
    return {
      text: `${delta > 0 ? '+' : '-'}${Math.abs(delta)} W`,
      tone: delta > 0 ? 'over' : 'under',
    };
  });

  /** The bike's reported resistance, which the aside reads (L2-026 AC1). */
  readonly level = this.telemetry.resistance;
  readonly canControl = this.resistance.canControl;
  readonly connected = computed(() => this.connection.ble() === 'connected');
  /** Who sets the level (L2-028). */
  readonly mode =
    this.draft().mode === 'flat'
      ? 'Holding a flat level for the whole ride.'
      : 'Following the plan — levels change with each interval.';
  /** The link "Sent to bike" names, "BLE · 0bf669f1", with a bike (L2-029 AC4). */
  readonly link = computed(() => {
    const bike = this.connection.bike() ?? this.remembered;
    return bike === null ? null : bleLinkName(bike.kind);
  });
  /** "Sent to bike", newest first, at most 50 rows (L2-029 AC1, AC3). */
  readonly sent = this.resistance.log;

  /**
   * The header's run button: Start until the ride has started, off until a bike is connected (L2-106 AC1, AC3); then
   * Pause while it runs and Resume once paused, off while the bike is lost (L2-105).
   */
  readonly run = computed<RideRun>(() =>
    !this.started() ? 'start' : this.pausedByRider() ? 'resume' : 'pause',
  );
  readonly endDisabled = computed(() => !this.started());
  readonly runDisabled = computed(() =>
    this.started() ? this.bikeLost() : this.connection.ble() !== 'connected',
  );

  /**
   * The overlay over the telemetry, or `null` while the ride can run: Bluetooth off, no bike before the start (L2-106
   * AC2), or the bike lost since (L2-105 AC2).
   */
  readonly overlay = computed<RideOverlayKind | null>(() => {
    if (this.ended()) return null;
    if (this.support.state() === 'adapter-off') return 'bluetooth-off';
    if (!this.started()) return this.connection.ble() === 'connected' ? null : 'connect';
    return this.bikeLost() ? 'lost' : null;
  });
  /** The bike's name for the overlay's words. */
  readonly bikeName = computed(() => (this.connection.bike() ?? this.remembered)?.name ?? null);

  /** The progress strip's label (L2-103 AC4). */
  readonly progressLabel = computed(
    () => `Ride progress: ${this.clockText()} of ${this.totalText}`,
  );

  /** The trace's label (L2-103 AC3). */
  readonly traceLabel = computed(() => {
    const power = this.round(this.telemetry.powerW());
    const now = power === null ? 'no power yet' : `${power} watts now`;
    return `Power against the plan: ${now} against a ${this.target()} watt target, ${this.clockText()} of ${this.totalText} ridden`;
  });

  /** Heart rate, average power, speed, distance and energy (L2-104 AC1). */
  readonly metrics = computed<readonly RideMetric[]>(() => {
    this.recorded();
    const avg = this.totals.avgPowerW();
    return [
      { label: 'Heart rate', value: formatMetric(this.telemetry.heartRate(), 0), unit: 'bpm' },
      {
        label: 'Avg power',
        value: formatMetric(avg === null ? null : Math.round(avg), 0),
        unit: 'W',
      },
      { label: 'Speed', value: formatMetric(this.telemetry.speedKmh(), 1), unit: 'km/h' },
      { label: 'Distance', value: formatMetric(this.totals.distanceKm(), 2), unit: 'km' },
      { label: 'Energy', value: String(this.totals.energyKcal()), unit: 'kcal' },
    ];
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Each step, said once as it starts, in the interval card's words (L2-141 AC2).
    const announcer = inject(ANNOUNCER);
    const step = computed(() => this.state()?.index ?? null);
    effect(() => {
      const index = step();
      if (index === null) return;
      const segment = this.plan.segments[index]!;
      announcer.announce(customStepAnnouncement(segment, intervalPlace(this.plan, index).round));
    });
    // From Start ride the bike is connected and the ride starts at once; with none it waits for Start (L2-106).
    if (this.connection.ble() === 'connected') this.begin();
    // A lost bike pauses the ride where it is; when the bike is back, the ride stays paused until Resume (L2-105).
    effect(() => {
      if (this.bikeLost()) untracked(() => this.pause());
    });
    this.ticker.ticks.pipe(takeUntilDestroyed(destroyRef)).subscribe((second) => {
      this.record(Math.min(second, this.lengthSeconds));
      if (second >= this.lengthSeconds) this.end();
      else this.syncVideo();
    });
    destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.player()?.destroy();
      // The lock is bound on the route, whose injector outlives the page.
      this.wakeLock.release();
    });
  }

  /**
   * Plays the workout's video in `host`, the frame the page draws when the workout has one, from the ride clock plus
   * its offset, without controls (L2-103 AC2, L2-088 AC1, AC5); called once. When it cannot load, the ride goes on.
   */
  playVideo(host: HTMLElement): void {
    const videoId = this.videoId;
    if (videoId === null || this.videoHost) return;
    this.videoHost = host;
    this.playerFactory().then(
      (player) => {
        if (this.destroyed) return player.destroy();
        this.player.set(player);
        void player.load(host, videoId, {
          startSeconds: this.offset + this.clock.elapsedMs() / 1000,
          controls: false,
          // Before the start the video waits at its offset; Start plays it.
          autoplay: this.started(),
          title: this.workout,
        });
      },
      () => this.playerMissing.set(true),
    );
  }

  /**
   * Each second ridden at the bike's power and speed (L2-022 AC2, L2-023 AC5); seconds a hidden tab skipped count at
   * those of the moment.
   */
  private record(second: number): void {
    const power = this.telemetry.powerW();
    const target = this.target();
    const onTarget = power !== null && target !== null && PowerModel.onTarget(power, target);
    this.recorder.record(power, this.telemetry.speedKmh(), second - this.lastSecond, onTarget);
    for (let s = this.lastSecond; s < second; s++) this.totals.onRunningSecond();
    this.trace.record(second, this.telemetry.powerW());
    this.lastSecond = Math.max(this.lastSecond, second);
    this.recorded.set(this.lastSecond);
  }

  /**
   * The overlay's action: Connect bike opens the browser's chooser (L2-106 AC2), Reconnect tries the lost bike at once
   * rather than at the connection's next retry (L2-105 AC2), and Check again asks the browser for Bluetooth again.
   */
  act(): void {
    const overlay = this.overlay();
    if (overlay === 'connect') void this.connectBike();
    else if (overlay === 'lost') this.connection.reconnectNow();
    else if (overlay === 'bluetooth-off') void this.support.recheck();
  }

  /** Start, Pause or Resume, as the run button reads. */
  toggleRun(): void {
    if (!this.started()) this.begin();
    else if (this.pausedByRider()) this.resume();
    else this.pause();
  }

  /**
   * Holds the clock, and with it the plan, the readouts' targets and the video; the resistance controls stay enabled
   * (L2-105 AC1). A paused clock publishes no second, so the engine sends nothing (L2-027 AC3).
   */
  pause(): void {
    if (this.pausedByRider()) return;
    this.pausedByRider.set(true);
    this.clock.pause();
    this.player()?.pause();
  }

  /** Carries the ride on from where it held, with the video back on the clock plus its offset. */
  resume(): void {
    if (!this.pausedByRider() || this.bikeLost()) return;
    this.pausedByRider.set(false);
    this.clock.resume();
    const player = this.player();
    player?.seekTo(this.offset + this.clock.elapsedMs() / 1000);
    player?.play();
  }

  raise(): void {
    void this.resistance.nudge(1);
  }

  lower(): void {
    void this.resistance.nudge(-1);
  }

  /** A "Level N" bar: N becomes the target, as the rider's own (L2-028 AC2). */
  pick(level: number): void {
    void this.resistance.setManual(level);
  }

  /** Starts the ride: the clock, the ticker and the engine following the plan, and the video from its offset. */
  private begin(): void {
    if (this.started() || this.connection.ble() !== 'connected') return;
    this.started.set(true);
    this.wakeLock.hold();
    this.clock.start();
    this.ticker.start();
    this.engine.follow(this.plan);
    const player = this.player();
    player?.seekTo(this.offset);
    player?.play();
  }

  /** Picks a bike in the browser's chooser, from the rider's press, connects it and remembers it for next time. */
  private async connectBike(): Promise<void> {
    try {
      const bike = await this.connection.requestBike();
      if (bike === null || this.destroyed) return;
      await this.connection.connect();
      this.rememberedBike.save(bike);
    } catch {
      // A chooser that is blocked or a bike that fails to connect leaves the overlay as it was.
    }
  }

  /**
   * Library (L2-107 AC1): the ride pauses while the rider decides, and the popover reads how far it went; `null` before
   * the ride has started, when the Class Library opens at once.
   */
  openLeave(): { readonly elapsed: string; readonly distance: string } | null {
    if (!this.started() || this.ended()) {
      void this.router.navigateByUrl('/classes');
      return null;
    }
    this.pause();
    return {
      elapsed: this.clockText(),
      distance: `${formatMetric(this.totals.distanceKm(), 2)} km`,
    };
  }

  /**
   * Save ride and open library, or Discard and open library (L2-107 AC3): the ride stops, a saved one of a minute or
   * more goes to the outbox, and the Class Library opens.
   */
  leave(save: boolean): void {
    if (!this.started() || this.ended()) return;
    this.stop();
    if (save) this.submit();
    void this.router.navigateByUrl('/classes');
  }

  /**
   * End, the plan's end, or End with the bike lost (L2-108 AC1, AC2; L2-105 AC4): the ride stops, and with a minute or
   * more ridden it goes to the outbox, which keeps it on the device and sends it to the backend; Profile opens. A ride
   * under a minute is discarded, and Profile says it was too short to save (AC3).
   */
  end(): void {
    if (!this.started() || this.ended()) return;
    this.stop();
    const saved = this.submit();
    void this.router.navigateByUrl('/profile', { state: saved ? {} : { rideTooShort: true } });
  }

  /** Hands a ride of a minute or more to the outbox, which keeps it on the device and sends it; `false` if too short. */
  private submit(): boolean {
    const facts = this.recorder.facts(new Date());
    if (facts.elapsedSeconds < MIN_SAVED_SECONDS) return false;
    this.outbox.submit({ ...facts, kind: 'custom' });
    return true;
  }

  /** The ride stops where it is: the clock, the ticker and the video, and the screen may sleep. */
  private stop(): void {
    this.ended.set(true);
    this.clock.pause();
    this.ticker.stop();
    this.player()?.pause();
    this.wakeLock.release();
  }

  /** On each tick, a video more than 1.5 s off the ride clock plus the offset seeks back to it (L2-088 AC2). */
  private syncVideo(): void {
    const player = this.player();
    if (player?.state() !== 'playing') return;
    const seek = this.sync.check(player.currentTime(), this.clock.elapsedMs() / 1000, this.offset);
    if (seek !== null) player.seekTo(seek);
  }

  private round(watts: number | null): number | null {
    return watts === null ? null : Math.round(watts);
  }
}
