import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BIKE_CONNECTION,
  CLASSES_API,
  type ClassDto,
  type ClassResult,
  type SubmitRideRequest,
  RIDE_OUTBOX,
  SCREEN_WAKE_LOCK,
  TICKER,
  VIDEO_PLAYER_FACTORY,
  type VideoPlayer,
} from '@telo/api';
import { type ClassStatTone, formatMetric } from '@telo/components';
import {
  BikeTelemetry,
  PowerModel,
  ResistanceController,
  RideClock,
  RideRecorder,
  RideTicker,
  VideoClockSync,
  WorkoutEngine,
} from '@telo/domain';
import { LiveSessionStore } from '../live/live-session-store';

/** A live stat as the bike panel shows it. */
export interface StatView {
  readonly value: string;
  readonly hint: string | null;
  readonly tone: ClassStatTone | null;
}

/**
 * The solo class ride's state (docs/detailed-designs/classes/ride-a-class), provided by the page so it goes when the
 * rider leaves. It loads the class from `CLASSES_API` and starts the ride the moment it arrives: the clock, the ticker
 * and the engine following the plan, which sends each segment's level (L2-027). The header and the segment card read
 * the ticker's whole seconds (L2-134 AC2); Power and Cadence read the bike's telemetry as it arrives (AC1). The class
 * video plays from the ride clock plus the class's sync offset (L2-088 AC1) and, on each tick, seeks back when it has
 * drifted more than 1.5 s (AC2); when it cannot play, the ride carries on without it (AC4). The rider pauses and
 * resumes it, a lost bike holds it until the bike is back (docs/detailed-designs/classes/pause-leave-or-finish-a-class,
 * L2-091, L2-092 AC4), the screen stays awake while it runs (L2-133 AC3), and at the class length it opens Results.
 */
@Injectable()
export class ClassRideStore {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly engine = inject(WorkoutEngine);
  private readonly resistance = inject(ResistanceController);
  private readonly telemetry = inject(BikeTelemetry);
  private readonly loaded = signal<ClassDto | null>(null);
  private readonly sync = inject(VideoClockSync);
  private readonly destroyRef = inject(DestroyRef);
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private readonly player = signal<VideoPlayer | null>(null);
  private readonly playerMissing = signal(false);
  private readonly pausedByRider = signal(false);
  private readonly pausedByBike = signal(false);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly beat = inject(TICKER);
  private readonly router = inject(Router);
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  private readonly outbox = inject(RIDE_OUTBOX);
  /** The ride's record for the backend, with the ride id given when the class starts (Record a ride). */
  private recorder: RideRecorder | null = null;
  private lastSecond = 0;
  private videoHost: HTMLElement | null = null;
  private destroyed = false;

  readonly ride = this.loaded.asReadonly();
  readonly elapsed = this.ticker.second;
  readonly plan = this.engine.state;
  readonly level = this.telemetry.resistance;
  readonly canControl = this.resistance.canControl;
  /** Whether the rider paused the ride: the clock, the plan and the video hold (L2-091 AC1). */
  readonly paused = this.pausedByRider.asReadonly();
  /** Whether the bike has stopped answering (`ble` disconnected, L2-017); a solo ride waits for it (L2-092 AC4). */
  readonly bikeLost = computed(() => this.connection.ble() === 'disconnected');
  /** Whether the video cannot play: its code or YouTube's did not load, or the player failed. */
  readonly videoUnavailable = computed(
    () => this.playerMissing() || this.player()?.state() === 'error',
  );

  /** Power against the segment's target: "On target" within 10 %, otherwise the signed delta (L2-089 AC2). */
  readonly power = computed<StatView>(() => {
    const power = this.telemetry.powerW();
    const target = this.plan()?.targetPower ?? null;
    if (power === null || target === null) {
      return {
        value: formatMetric(power, 0),
        hint: target === null ? null : `Target ${target} W`,
        tone: null,
      };
    }
    const watts = Math.round(power);
    if (PowerModel.onTarget(watts, target))
      return { value: String(watts), hint: 'On target', tone: 'on' };
    const delta = watts - target;
    return {
      value: String(watts),
      hint: `${delta > 0 ? '+' : '-'}${Math.abs(delta)} W`,
      tone: delta > 0 ? 'over' : 'under',
    };
  });

  /** Cadence with the segment's aim (L2-089 AC3). */
  readonly cadence = computed<StatView>(() => {
    const aim = this.plan()?.segment.cadenceAim;
    return {
      value: formatMetric(this.telemetry.cadence(), 0),
      hint: aim === undefined ? null : `Aim ${aim}`,
      tone: null,
    };
  });

  constructor() {
    const route = inject(ActivatedRoute).snapshot;
    const id = route.paramMap.get('id') ?? '';
    // A group ride arrives with its session (`?session=`) and holds the hub connection for as long as it lasts, joining
    // the session as it connects; a solo ride holds none (L2-120 AC1, AC4). A refused join leaves the ride for Class
    // Start, which reads the sessions again and offers the next one (L2-122 AC2, L2-086 AC3), or for the Class Library
    // when the class is locked (L2-082).
    const sessionId = route.queryParamMap.get('session');
    if (sessionId !== null) {
      const live = inject(LiveSessionStore);
      void live.join({ kind: 'class', classId: id, sessionId });
      effect(() => {
        const refused = live.refused();
        if (refused === null) return;
        untracked(
          () =>
            void this.router.navigate(
              refused === 'class_locked' ? ['/classes'] : ['/classes', id],
              {
                replaceUrl: true,
              },
            ),
        );
      });
    }
    inject(CLASSES_API)
      .get(id)
      .pipe(takeUntilDestroyed())
      .subscribe((dto) => this.start(dto));
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.player()?.destroy();
      // The lock is bound on the route, whose injector outlives the page.
      this.wakeLock.release();
    });
  }

  /** Plays the class video in `host`, the frame the page renders once the class has arrived; called once. */
  playVideo(host: HTMLElement): void {
    const ride = this.loaded();
    if (!ride || this.videoHost) return;
    this.videoHost = host;
    this.playerFactory().then(
      (player) => {
        if (this.destroyed) return player.destroy();
        this.player.set(player);
        void player.load(host, ride.video.videoId, {
          startSeconds: ride.video.syncOffsetSeconds + this.clock.elapsedMs() / 1000,
          controls: false,
          autoplay: true,
          title: ride.title,
        });
      },
      () => this.playerMissing.set(true),
    );
  }

  /** Holds the clock, the plan and the video where they are (L2-091 AC1, L2-088 AC3). */
  pause(): void {
    if (this.pausedByRider()) return;
    this.pausedByRider.set(true);
    if (!this.pausedByBike()) this.hold();
  }

  /** Carries the ride on from where it was held, with the video back on the clock (L2-091 AC2). */
  resume(): void {
    const ride = this.loaded();
    if (!this.pausedByRider() || !ride) return;
    this.pausedByRider.set(false);
    if (!this.pausedByBike()) this.carryOn(ride);
  }

  /** Tries the lost bike at once, rather than at the connection's next retry: the alert's Reconnect. */
  reconnect(): void {
    this.connection.reconnectNow();
  }

  raise(): void {
    void this.resistance.nudge(1);
  }

  lower(): void {
    void this.resistance.nudge(-1);
  }

  private start(dto: ClassDto): void {
    this.loaded.set(dto);
    this.recorder = new RideRecorder();
    this.wakeLock.hold();
    this.clock.start();
    this.ticker.start();
    this.engine.follow(dto.plan);
    this.ticker.ticks.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((second) => {
      this.record(Math.min(second, dto.lengthSeconds));
      if (second >= dto.lengthSeconds) this.finish(dto);
      else this.syncVideo(dto);
    });
    // The bike is watched on a beat of its own: the ride clock's ticks stop while the ride is held.
    this.beat.seconds
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.followBike(dto));
  }

  /**
   * A solo ride waits for a lost bike: checked once a second, it holds within a second of the drop and carries on
   * within a second of the bike's return, unless the rider paused it meanwhile (L2-092 AC4). The alert shows at once.
   */
  private followBike(ride: ClassDto): void {
    const lost = this.bikeLost();
    if (lost === this.pausedByBike()) return;
    this.pausedByBike.set(lost);
    if (this.pausedByRider()) return;
    if (lost) this.hold();
    else this.carryOn(ride);
  }

  /**
   * The plan's end: the clock stops at the class length, the video pauses, the ride is submitted (L2-044 AC2), and
   * Results opens with the class's result and the ride in the navigation's state (L2-093 AC2, L2-078 AC1). Leaving the
   * page releases the rest.
   */
  private finish(ride: ClassDto): void {
    this.clock.pause();
    this.ticker.stop();
    this.player()?.pause();
    this.wakeLock.release();
    const submitted = this.submit(ride);
    const classResult: ClassResult = {
      classId: ride.id,
      title: ride.title,
      elapsedSeconds: ride.lengthSeconds,
      outputKj: submitted?.outputKj ?? 0,
      onTargetShare: submitted?.onTargetShare ?? 0,
    };
    void this.router.navigateByUrl('/results', { state: { classResult, ride: submitted } });
  }

  /**
   * Each second ridden at the bike's power and speed (L2-022 AC2), on target when the power is within 10 % of the
   * segment's target (L2-037 AC3); seconds a hidden tab skipped count at those of the moment, and a held ride's clock
   * does not tick.
   */
  private record(second: number): void {
    const power = this.telemetry.powerW();
    const target = this.plan()?.targetPower ?? null;
    const onTarget = power !== null && target !== null && PowerModel.onTarget(power, target);
    this.recorder?.record(power, this.telemetry.speedKmh(), second - this.lastSecond, onTarget);
    this.lastSecond = second;
  }

  /**
   * Hands the finished class with its record to the outbox, which sends it to the backend (L2-044 AC2) and outlives the
   * page; Results follows it there. The ride as submitted, or none before the ride began.
   */
  private submit(ride: ClassDto): SubmitRideRequest | null {
    if (!this.recorder) return null;
    const submitted: SubmitRideRequest = {
      ...this.recorder.facts(new Date()),
      kind: 'class',
      classId: ride.id,
    };
    this.outbox.submit(submitted);
    return submitted;
  }

  private hold(): void {
    this.clock.pause();
    this.player()?.pause();
  }

  private carryOn(ride: ClassDto): void {
    this.clock.resume();
    const player = this.player();
    player?.seekTo(ride.video.syncOffsetSeconds + this.clock.elapsedMs() / 1000);
    player?.play();
  }

  private syncVideo(ride: ClassDto): void {
    const player = this.player();
    if (player?.state() !== 'playing') return;
    // A player that became ready during a pause starts playing on its own; it follows the pause instead.
    if (this.pausedByRider() || this.pausedByBike()) return player.pause();
    const elapsed = this.clock.elapsedMs() / 1000;
    const seek = this.sync.check(player.currentTime(), elapsed, ride.video.syncOffsetSeconds);
    if (seek !== null) player.seekTo(seek);
  }
}
