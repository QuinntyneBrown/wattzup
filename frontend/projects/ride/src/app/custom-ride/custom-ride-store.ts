import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BIKE_CONNECTION, BLUETOOTH_SUPPORT, REMEMBERED_BIKE, SCREEN_WAKE_LOCK } from '@telo/api';
import {
  type RideBikeTone,
  type RideDelta,
  type RideMetric,
  type TraceSegment,
  formatClock,
  formatMetric,
} from '@telo/components';
import {
  BikeTelemetry,
  PowerModel,
  PowerTrace,
  RideClock,
  RideTicker,
  RideTotals,
  WorkoutEngine,
  bikeStatus,
  customWorkoutLabel,
  intervalPlace,
  planLength,
  planStateAt,
  traceMaxWatts,
} from '@telo/domain';
import { CustomWorkoutStore } from '../custom-workout/custom-workout-store';

/**
 * The custom ride's state (docs/detailed-designs/custom-workout/ride-a-custom-workout), provided by the page so it goes
 * when the rider leaves. It rides the plan of Custom workout's draft from the moment it opens: the clock, the ticker
 * and the engine following the plan, which sends each segment's level as the target resistance (L2-100 AC2). The
 * header, the readouts' targets and the interval card read the ticker's whole seconds (L2-134 AC2); Power and Cadence
 * read the bike's telemetry as it arrives. At the plan's end the clock stops at its length; what follows is slice
 * 21.4's.
 */
@Injectable()
export class CustomRideStore {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly engine = inject(WorkoutEngine);
  private readonly telemetry = inject(BikeTelemetry);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly support = inject(BLUETOOTH_SUPPORT);
  private readonly remembered = inject(REMEMBERED_BIKE).get();
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  private readonly draft = inject(CustomWorkoutStore).draft;
  private readonly totals = inject(RideTotals);
  /** The seconds recorded: the trace and the totals have moved on to it. */
  private readonly recorded = signal(0);
  private lastSecond = 0;

  /** The plan as the ride started it; editing the workout leaves this ride (L2-101 AC3). */
  readonly plan = inject(CustomWorkoutStore).plan();
  readonly lengthSeconds = planLength(this.plan);
  readonly workout = customWorkoutLabel(this.draft());
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
    this.wakeLock.hold();
    this.clock.start();
    this.ticker.start();
    this.engine.follow(this.plan);
    this.ticker.ticks.pipe(takeUntilDestroyed(destroyRef)).subscribe((second) => {
      this.record(Math.min(second, this.lengthSeconds));
      if (second >= this.lengthSeconds) this.end();
    });
    // The lock is bound on the route, whose injector outlives the page.
    destroyRef.onDestroy(() => this.wakeLock.release());
  }

  /**
   * Each second ridden at the bike's power and speed (L2-022 AC2, L2-023 AC5); seconds a hidden tab skipped count at
   * those of the moment.
   */
  private record(second: number): void {
    for (let s = this.lastSecond; s < second; s++) this.totals.onRunningSecond();
    this.trace.record(second, this.telemetry.powerW());
    this.lastSecond = Math.max(this.lastSecond, second);
    this.recorded.set(this.lastSecond);
  }

  /** The plan's end: the clock stops at its length. */
  private end(): void {
    this.clock.pause();
    this.ticker.stop();
    this.wakeLock.release();
  }

  private round(watts: number | null): number | null {
    return watts === null ? null : Math.round(watts);
  }
}
