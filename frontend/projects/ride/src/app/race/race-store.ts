import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  type Backend,
  chicagoRailPass,
  BIKE_CONNECTION,
  GHOST_API,
  type MapDto,
  MAPS_API,
  MAPS_KEY,
  MONOTONIC_TIME,
  type PackStrengthId,
  type RaceMode,
  type RaceResult,
  type SubmitRideRequest,
  type RealPlace,
  RIDE_OUTBOX,
  type SceneRider,
  type SceneryRequest,
  type SceneryState,
  RIDE_SOUND,
  RIDE_ACTIVITY,
  SCREEN_WAKE_LOCK,
  TICKER,
} from '@telo/api';
import { type RaceBoardRow, type RaceDelta, type RaceGap, formatMetric } from '@telo/components';
import {
  BikeTelemetry,
  BotPack,
  CoastPolicy,
  FinishLine,
  GhostReplay,
  PowerModel,
  type RaceField,
  ResistanceController,
  RideClock,
  RideRecorder,
  RideTicker,
  VirtualSpeedModel,
  type Standing,
  WorkoutEngine,
  YOU,
  finalStandings,
  formatGap,
  ordinal,
  rankStandings,
  planStateAt,
  routeProfile,
  routeProfileView,
} from '@telo/domain';
import { catchError, of, take } from 'rxjs';
import { LiveSessionStore, SERVICE_LOST_NOTICE } from '../live/live-session-store';
import { liveRaceStandings } from './live-race-standings';

/** A race has no class video over its ride sound. */
const NO_VIDEO = signal(false).asReadonly();

/**
 * The race's state (docs/detailed-designs/race/ride-a-race), provided by the page so it goes when the rider leaves. It
 * reads the map of the address from `MAPS_API` and starts the race the moment it arrives: the clock, the ticker and the
 * engine following the map's plan, which sends each segment's level (L2-063 AC2). The screen stays awake while it runs
 * (L2-133 AC3). Its opponents (docs/detailed-designs/race/race-the-ghost-and-bots) are nine bots, or the ghost of the
 * rider's best in a solo race; each tick ranks them with the rider (L2-060, L2-059 AC1, AC4, AC5). A riders-online race
 * (`?mode=online&session=…`) first joins its session again and starts its clock at the session's server-time start,
 * read through the measured offset, so every rider's clock reads the same at the same moment (L2-121 AC3, L2-056 AC4);
 * until that start it holds at 0:00, and without a seat or an offset it starts at once and rides on with the bike.
 */
@Injectable()
export class RaceStore {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly engine = inject(WorkoutEngine);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly telemetry = inject(BikeTelemetry);
  private readonly resistanceControl = inject(ResistanceController);
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  /** Whether a ride is in progress, so a new version of the app waits for its end (L2-150 AC2). */
  private readonly activity = inject(RIDE_ACTIVITY);
  private readonly sound = inject(RIDE_SOUND);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute).snapshot;
  private readonly mapId = this.route.paramMap.get('mapId') ?? '';
  private readonly loaded = signal<MapDto | null>(null);
  private readonly ghosts = inject(GHOST_API);
  private readonly ridden = signal(0);
  readonly raceMetres = this.ridden.asReadonly();
  private readonly outbox = inject(RIDE_OUTBOX);
  /** The ride's record for the backend, with the ride id given when the race starts (Record a ride). */
  private recorder: RideRecorder | null = null;
  private lastSecond = 0;
  private field: RaceField | null = null;
  /** The rider and the field by place, ranked once a second on the race's tick (L2-060 AC3). */
  private readonly standings = signal<readonly Standing[]>([]);
  private readonly riders = signal<readonly SceneRider[]>([]);
  /** The field at its places, metres from the rider, for the world to draw (L2-064 AC3). */
  readonly sceneRiders = this.riders.asReadonly();
  private readonly beat = inject(TICKER);
  private readonly pausedByRider = signal(false);
  /** Whether the bike has reported the rider stopped since the pause, so the next stroke carries the race on. */
  private stoppedSincePause = false;
  /** A solo race held still while the bike is away (L2-070 AC5). */
  private readonly parkedByBike = signal(false);
  /** The race second the bike was lost at in a bots or riders-online race, and the speed the rider coasts from. */
  private lostAt: number | null = null;
  private coastFromMs = 0;
  /** The rider's speed at the last tick, m/s, which a lost bike's coast starts from. */
  private lastSpeedMs = 0;
  /** The coasting speed while the bike is lost, m/s (L2-070 AC2). */
  private readonly coast = signal<number | null>(null);
  /** The race ended for the rider as a DNF: 15 seconds without the bike (L2-070 AC4). */
  readonly dnf = signal(false);
  private readonly router = inject(Router);
  /** The map's distance, where the race ends for the rider (L2-071 AC1). */
  private line: FinishLine | null = null;

  /** Whom the race is against, and how hard the bots ride (`?mode=bots&pack=medium`, slice 7.2). */
  readonly mode: RaceMode =
    (['solo', 'bots', 'online'] as const).find(
      (mode) => mode === this.route.queryParamMap.get('mode'),
    ) ?? 'bots';
  private readonly pack: PackStrengthId =
    (['easy', 'medium', 'hard'] as const).find(
      (pack) => pack === this.route.queryParamMap.get('pack'),
    ) ?? 'medium';

  /** The riders-online session the rider holds a seat in, from the lobby's Go (L2-056 AC3). */
  private readonly session =
    this.mode === 'online' ? this.route.queryParamMap.get('session') : null;
  private readonly live = inject(LiveSessionStore);
  private readonly time = inject(MONOTONIC_TIME);
  private startTimer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;

  readonly map = this.loaded.asReadonly();
  /** Whether the rider paused the solo race: the clock, the distance and the standings hold (L2-068 AC1). */
  readonly paused = this.pausedByRider.asReadonly();
  /** Race Setup for the map, where Leave and End go (L2-069). */
  readonly setup: readonly string[] = ['/race', this.mapId];
  readonly elapsed = this.ticker.second;
  /**
   * Where the plan is; past its end, its last segment at 0:00, since nothing more is sent and its level holds until the
   * finish (L2-071 AC2).
   */
  readonly plan = computed(() => {
    const now = this.engine.state();
    const map = this.loaded();
    if (now || !map || this.elapsed() < this.total()) return now;
    const last = planStateAt(map.plan, this.total() * 1000 - 1);
    return last && { ...last, remainingMs: 0, progress: 1 };
  });

  /** The plan's length in seconds. */
  readonly total = computed(
    () => this.loaded()?.plan.segments.reduce((sum, segment) => sum + segment.duration, 0) ?? 0,
  );

  /** "Cathedral Circuit · vs Bots, medium", "· vs your best" or "· Live race" (L2-058 AC1, AC2). */
  readonly routeLine = computed(() => {
    const against =
      this.mode === 'solo'
        ? 'vs your best'
        : this.mode === 'online'
          ? 'Live race'
          : `vs Bots, ${this.pack}`;
    return [this.loaded()?.routeName, against].filter(Boolean).join(' · ');
  });

  /** The scene's description, one image (L2-064 AC4): "The Old Town Criterium world: a cobbled …". */
  readonly sceneLabel = computed(() => {
    const map = this.loaded();
    return map
      ? `The ${map.name} world: ${map.place.charAt(0).toLowerCase()}${map.place.slice(1)}`
      : '';
  });

  /** Power in whole watts, or "—" while it is unknown (L2-059 AC1). */
  readonly watts = computed(() => {
    const power = this.telemetry.powerW();
    return formatMetric(power === null ? null : Math.round(power), 0);
  });
  readonly target = computed(() => this.plan()?.targetPower ?? null);

  /** "-47 W" under the target, "+12 W" over it, or "On target" within 10 % (L2-059 AC1, AC2). */
  readonly delta = computed<RaceDelta | null>(() => {
    const power = this.telemetry.powerW();
    const target = this.target();
    if (power === null || target === null) return null;
    const watts = Math.round(power);
    if (PowerModel.onTarget(watts, target)) return { text: 'On target', tone: 'on' };
    const delta = watts - target;
    return delta > 0
      ? { text: `+${delta} W`, tone: 'over' }
      : { text: `-${-delta} W`, tone: 'under' };
  });

  readonly cadence = computed(() => formatMetric(this.telemetry.cadence(), 0));
  /** The bike's own heart rate; the strap joins with its slice (L2-030, L2-031). */
  readonly heart = computed(() => formatMetric(this.telemetry.heartRate(), 0));
  /** The virtual speed in km/h from power, `main`'s formula (L2-059 AC3), or the coast while the bike is lost (L2-070 AC2). */
  readonly speedKmh = computed(() => {
    const coast = this.coast();
    if (coast !== null) return coast * 3.6;
    const power = this.telemetry.powerW();
    return power === null ? null : VirtualSpeedModel.speedKmh(power);
  });
  readonly speed = computed(() => formatMetric(this.speedKmh(), 1));

  /** The GPU API drawing the world once it has started, for the bar's tag (L2-065 AC1). */
  readonly backend = signal<Backend | null>(null);
  /** True once neither WebGPU nor WebGL 2 could draw the world: the map's panorama stays (L2-065 AC2). */
  readonly worldUnavailable = signal(false);
  /** The rider's Google Maps Platform key this device holds, which the scenery panel starts with (L2-066 AC8). */
  private readonly mapsKey = inject(MAPS_KEY);
  readonly storedMapsKey = this.mapsKey.get() ?? '';
  /** The real place and key to stream as 3D Tiles, once the rider presses "Stream it" (L2-066 AC3). */
  readonly scenery = signal<SceneryRequest | null>(null);
  /** Whether Google refused the key or the tiles stream, for the scenery panel (L2-066 AC4, AC7). */
  readonly sceneryState = signal<SceneryState | null>(null);

  /** Keeps the key on this device only and streams the place with it; a new key streams again. */
  streamScenery(place: RealPlace, key: string): void {
    this.mapsKey.save(key);
    this.sceneryState.set(null);
    this.scenery.set({ place, key });
  }

  /** The world moves while the race runs and holds still while it is paused or over. */
  readonly running = computed(() => !this.paused() && !this.dnf());

  /** The map's route profile, `main`'s, built once from its plan and its world's terrain (L2-062). */
  private readonly profile = computed(() => {
    const map = this.loaded();
    return map ? routeProfile(map.terrain, map.plan.segments, map.distanceKm * 1000) : null;
  });

  /** What the route panel draws at the race clock's second. */
  readonly routeView = computed(() => {
    const map = this.loaded();
    const profile = this.profile();
    return map && profile
      ? routeProfileView(
          profile,
          map.plan.segments,
          this.elapsed(),
          profile.stepMetres ? this.ridden() : 0,
        )
      : null;
  });

  /** Kilometres ridden at the virtual speed, two decimals ("1.62", L2-062 AC1). */
  readonly distance = computed(() => (this.ridden() / 1000).toFixed(2));

  /** The bike's reported resistance (L2-063 AC1), and whether Lower and Raise can reach it (L2-028 AC4). */
  readonly resistance = this.telemetry.resistance;
  readonly canControl = this.resistanceControl.canControl;

  /** The board's notice while the service is lost and the race carries on (L2-126 AC1); `null` otherwise. */
  readonly boardNotice = computed(() => (this.live.serviceLost() ? SERVICE_LOST_NOTICE : null));

  /** "Standings · 10 riders", or "You vs your best" in a solo race (L2-060 AC1, AC4). */
  readonly boardHeading = computed(() =>
    this.mode === 'solo' ? 'You vs your best' : `Standings · ${this.standings().length} riders`,
  );

  readonly boardRows = computed<RaceBoardRow[]>(() =>
    this.standings().map((row) => ({
      id: row.id,
      place: row.place,
      name: row.name,
      jersey: row.jersey,
      bot: row.bot,
      you: row.you,
      gap: row.you ? '' : row.dnf ? 'DNF' : formatGap(row.gap),
      dnf: row.dnf ?? false,
    })),
  );

  private readonly you = computed(() => this.standings().find((row) => row.you) ?? null);

  /** "5th", or in a solo race "Ahead" or "Behind" the ghost, level counting as ahead (L2-059 AC1, AC4). */
  readonly place = computed(() => {
    const you = this.you();
    if (!you) return '';
    if (this.mode === 'solo') return you.place === 1 ? 'Ahead' : 'Behind';
    return ordinal(you.place);
  });

  /** The field's size beside the place; none in a solo race. */
  readonly fieldSize = computed(() => (this.mode === 'solo' ? null : this.standings().length));

  /** The gaps to the riders either side ("Ahead +0:02", "Behind −0:01"), or the ghost's ("Best +0:01"). */
  readonly gaps = computed<RaceGap[]>(() => {
    const rows = this.standings();
    const you = this.you();
    if (!you) return [];
    if (this.mode === 'solo') {
      const ghost = rows.find((row) => !row.you);
      return ghost ? [{ label: 'Best', value: formatGap(ghost.gap) }] : [];
    }
    const ahead = rows[you.place - 2];
    const behind = rows[you.place];
    const value = (row: Standing) => (row.dnf ? 'DNF' : formatGap(row.gap));
    return [
      ...(ahead ? [{ label: 'Ahead', value: value(ahead) }] : []),
      ...(behind ? [{ label: 'Behind', value: value(behind) }] : []),
    ];
  });

  readonly bikeName = computed(() => this.connection.bike()?.name ?? null);
  readonly connected = computed(() => this.connection.ble() === 'connected');
  /** Whether the bike has stopped answering (`ble` disconnected, L2-017). */
  readonly bikeLost = computed(() => this.connection.ble() === 'disconnected');

  /** The alert over the race while the bike is lost, or once the race is a DNF (L2-070 AC1, AC4, AC5). */
  readonly lostAlert = computed(() => {
    const bike = this.bikeName() ?? 'The bike';
    if (this.dnf())
      return {
        heading: 'Did not finish',
        body: `${bike} didn’t come back within 15 seconds, so this race counts as a DNF and earns no XP.`,
        dnf: true,
      };
    if (!this.bikeLost()) return null;
    return {
      heading: 'Lost the bike',
      body: CoastPolicy.parks(this.mode)
        ? `${bike} stopped answering. Your ride is parked until the bike is back, then carries on from where it stopped.`
        : `${bike} stopped answering. Your rider coasts for 15 seconds while we reconnect; after that the race counts as a DNF.`,
      dnf: false,
    };
  });

  constructor() {
    const joined =
      this.session === null
        ? null
        : this.live.join({ kind: 'race', mapId: this.mapId, sessionId: this.session });
    inject(MAPS_API)
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe((maps) => {
        const map = maps.find((each) => each.id === this.mapId);
        if (!map) return;
        this.loaded.set(map);
        if (joined === null) this.start(map);
        else void joined.then(() => this.waitForStart(map));
      });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      clearTimeout(this.startTimer);
    });
    // The lock and the sound are bound on the route, whose injector outlives the page.
    this.destroyRef.onDestroy(() => {
      this.wakeLock.release();
      this.activity.end();
      this.sound.stop();
    });
  }

  /**
   * Starts a riders-online race at its session's start on the monotonic clock, holding at 0:00 until then; one opened
   * after the start rides from the session's time (L2-121 AC3).
   */
  private waitForStart(map: MapDto): void {
    if (this.destroyed) return;
    const race = this.live.race();
    const offset = this.live.offsetMs();
    if (race === null || offset === null) return this.start(map);
    const at = Date.parse(race.startsAt) - offset;
    const wait = at - this.time.now();
    if (wait <= 0) return this.start(map, at);
    this.startTimer = setTimeout(() => this.start(map, at), wait);
  }

  /** Starts the race: now, or from `at`, a riders-online session's start on the monotonic clock. */
  private start(map: MapDto, at?: number): void {
    this.loaded.set(map);
    this.recorder = new RideRecorder();
    this.wakeLock.hold();
    this.activity.begin();
    // Ride sound follows the pedalling at the race's speed, quiet while paused or out of the race (L2-163).
    this.sound.play({
      cadence: this.telemetry.cadence,
      speedKmh: this.speedKmh,
      resistance: this.telemetry.resistance,
      running: this.running,
      videoPlaying: NO_VIDEO,
      ...(map.world === 'chicago'
        ? { railPass: computed(() => chicagoRailPass(this.raceMetres(), this.elapsed())) }
        : {}),
    });
    this.clock.start(at);
    this.ticker.start();
    this.line = new FinishLine(map.distanceKm * 1000);
    this.engine.follow(map.plan);
    this.startField(map);
    this.ticker.ticks
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((second) => this.ride(second));
    // The pedals are watched on a beat of their own: the race clock's ticks stop while the race is held.
    this.beat.seconds.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.watchBike();
      this.watchPedals();
    });
  }

  /**
   * Leave, on its way to Race Setup: a riders-online race tells its session, which marks the rider DNF for everyone at
   * once (L2-124 AC1); the route then closes the connection.
   */
  leave(): void {
    if (this.mode === 'online') this.live.leaveRace();
  }

  /** Holds a solo race where it is; a bots or riders-online race has no Pause (L2-068 AC1, AC3). */
  pause(): void {
    if (this.mode !== 'solo' || this.pausedByRider()) return;
    this.pausedByRider.set(true);
    this.stoppedSincePause = false;
    if (!this.parkedByBike()) this.clock.pause();
  }

  /** Carries the race on from where it stopped (L2-068 AC2). */
  resume(): void {
    if (!this.pausedByRider()) return;
    this.pausedByRider.set(false);
    if (!this.parkedByBike()) this.clock.resume();
  }

  /** Tries the lost bike at once, rather than at the connection's next retry: the alert's Reconnect. */
  reconnect(): void {
    this.connection.reconnectNow();
  }

  /**
   * The bike, checked once a second. A solo race parks within a second of the drop and carries on within a second of
   * its return, unless the rider paused it meanwhile (L2-070 AC5). Any other race starts the rider's coast from their
   * speed at the drop, and a bike back in time ends it (AC2, AC3); the race's ticks ride the coast.
   */
  private watchBike(): void {
    const lost = this.bikeLost();
    if (this.dnf()) return;
    if (CoastPolicy.parks(this.mode)) {
      if (lost === this.parkedByBike()) return;
      this.parkedByBike.set(lost);
      if (this.pausedByRider()) return;
      if (lost) this.clock.pause();
      else this.clock.resume();
    } else if (lost && this.lostAt === null) {
      this.lostAt = this.lastSecond;
      this.coastFromMs = this.lastSpeedMs;
      this.coast.set(this.lastSpeedMs);
    } else if (!lost && this.lostAt !== null) {
      this.lostAt = null;
      this.coast.set(null);
    }
  }

  /** Fifteen seconds without the bike: the race stops for the rider where it is, a DNF that submits nothing. */
  private endAsDnf(): void {
    this.dnf.set(true);
    this.lostAt = null;
    this.clock.pause();
    this.ticker.stop();
    this.wakeLock.release();
    this.activity.end();
  }

  /**
   * Pedalling carries a paused race on, checked once a second: once the bike has reported the rider stopped (cadence 0
   * or none) since the pause, the next cadence above 0 resumes it, so the stroke under the rider's press does not.
   */
  private watchPedals(): void {
    if (!this.pausedByRider()) return;
    const cadence = this.telemetry.cadence();
    if (cadence === null || cadence === 0) this.stoppedSincePause = true;
    else if (this.stoppedSincePause) this.resume();
  }

  /**
   * The race's opponents: nine bots paced by the pack, or in a solo race the ghost of the rider's best on the map, the
   * medium pace when there is none or it cannot be read (L2-067 AC1, AC2; L2-050 AC4). Riders online are the
   * service's, ranked by `rankLive` (slice 15.3).
   */
  private startField(map: MapDto): void {
    if (this.mode === 'bots') {
      this.field = new BotPack(map.id, this.pack);
      this.rank();
    } else if (this.mode === 'online') {
      this.rank();
    } else if (this.mode === 'solo') {
      this.ghosts
        .bestRide(map.id)
        .pipe(
          take(1),
          catchError(() => of(null)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((trace) => {
          this.field = new GhostReplay(trace);
          this.rank();
        });
    }
  }

  /**
   * Ranks the rider and the field at the last second ridden, the gaps at the rider's speed of the moment; riders
   * online are ranked by the service.
   */
  private rank(): void {
    if (this.mode === 'online') return this.rankLive();
    if (!this.field || !this.line) return;
    const power = this.telemetry.powerW();
    const speed =
      this.coast() ?? (power === null || power <= 0 ? null : VirtualSpeedModel.speedMs(power));
    const second = this.lastSecond;
    const field = this.line.holdAll(this.field.advance(second), second);
    const you = this.line.hold(YOU, this.ridden(), second);
    this.standings.set(rankStandings(field, you, speed, this.line.crossings));
    this.riders.set(field.map((rider) => ({ jersey: rider.jersey, metres: rider.metres - you })));
  }

  /**
   * A riders-online race: reports the rider's distance and power to the session (L2-123 AC1), then draws the board from
   * the service's latest standings, and the world's riders at the service's distances (L2-123 AC3).
   */
  private rankLive(): void {
    if (!this.line) return;
    const you = this.line.hold(YOU, this.ridden(), this.lastSecond);
    this.live.report(you, this.telemetry.powerW() ?? 0);
    const race = this.live.race();
    const standings = this.live.raceStandings();
    this.standings.set(liveRaceStandings(standings, race));
    this.riders.set(
      (standings?.rows ?? [])
        .filter((row) => row.seat !== race?.seat)
        .map((row) => ({ jersey: row.jersey, metres: row.distanceMetres - you })),
    );
  }

  /**
   * The line: the finish time is the race clock's second, the place is where the rider crossed it, and Results opens
   * with the result and the ride; the clock and the ticker stop, and leaving the page releases the rest (L2-071 AC1).
   * The ride is submitted as it ends (L2-044 AC2).
   */
  private finish(second: number): void {
    const you = this.you();
    this.clock.pause();
    this.ticker.stop();
    this.wakeLock.release();
    this.activity.end();
    const raceResult: RaceResult = {
      mapId: this.mapId,
      mapName: this.map()?.name ?? '',
      mode: this.mode,
      pack: this.mode === 'solo' ? null : this.pack,
      finishTimeS: second,
      place: you?.place ?? 1,
      field: this.standings().length || 1,
      standings: finalStandings(this.standings(), this.line?.crossings ?? new Map(), second),
    };
    const ride = this.submit(raceResult);
    void this.router.navigateByUrl('/results', { state: { raceResult, ride } });
  }

  /**
   * Hands the finished race with its record to the outbox, which sends it to the backend (L2-044 AC2) and outlives the
   * page; Results follows it there. The ride as submitted, or none before the race began.
   */
  private submit(result: RaceResult): SubmitRideRequest | null {
    if (!this.recorder) return null;
    const ride: SubmitRideRequest = {
      ...this.recorder.facts(new Date()),
      kind: 'race',
      mapId: result.mapId,
      mode: result.mode,
      pack: result.mode === 'online' ? null : result.pack,
      place: result.place,
      fieldSize: result.field,
      ...(this.session ? { sessionId: this.session } : {}),
    };
    this.outbox.submit(ride);
    return ride;
  }

  /** Raise and Lower send the next level as the rider's own (L2-028 AC1). */
  raise(): void {
    void this.resistanceControl.nudge(1);
  }

  lower(): void {
    void this.resistanceControl.nudge(-1);
  }

  /**
   * Each second of the clock the rider covers the virtual speed of their power; seconds a hidden tab skipped count at
   * the power of the moment. Without power, stopped, the rider rides no further.
   */
  private ride(second: number): void {
    const seconds = second - this.lastSecond;
    this.lastSecond = second;
    if (this.lostAt !== null) return this.rideTheCoast(second, seconds);
    const power = this.telemetry.powerW();
    this.lastSpeedMs = power !== null && power > 0 ? VirtualSpeedModel.speedMs(power) : 0;
    const target = this.target();
    const onTarget = power !== null && target !== null && PowerModel.onTarget(power, target);
    this.recorder?.record(power, this.lastSpeedMs * 3.6, seconds, onTarget);
    if (seconds > 0) this.ridden.update((metres) => metres + this.lastSpeedMs * seconds);
    this.rank();
    if (this.line && this.ridden() >= this.line.metres) this.finish(second);
  }

  /** While the bike is lost the rider rides the coast's decaying speed, and 15 seconds of it are a DNF (L2-070). */
  private rideTheCoast(second: number, seconds: number): void {
    const since = second - (this.lostAt ?? second);
    const speed = CoastPolicy.speedMs(this.coastFromMs, since);
    this.coast.set(speed);
    this.recorder?.record(null, speed * 3.6, seconds);
    if (seconds > 0) this.ridden.update((metres) => metres + speed * seconds);
    this.rank();
    if (this.line && this.ridden() >= this.line.metres) this.finish(second);
    else if (CoastPolicy.isDnf(since)) this.endAsDnf();
  }
}
