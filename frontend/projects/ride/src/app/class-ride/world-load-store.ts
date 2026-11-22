import {
  DestroyRef,
  Injectable,
  type WritableSignal,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BIKE_CONNECTION,
  REMEMBERED_BIKE,
  type Backend,
  CLASSES_API,
  type ClassDto,
  MONOTONIC_TIME,
  type PreparedWorld,
  type World,
  WORLD_DOWNLOADER,
  WORLD_PANORAMAS,
  WorldDownloadError,
  type WorldDownloadProgress,
  type WorldRenderer,
  type WorldStartProgress,
  type WorldTier,
  panoramaUrl,
  RIDE_SETTINGS,
} from '@telo/api';
import { formatClock } from '@telo/components';
import { PlanSummary, worldQuality } from '@telo/domain';
import { LiveSessionStore } from '../live/live-session-store';
import { startStepping } from './start-stepping';
import {
  TIER_NAME,
  type WorldLoadPhase,
  type WorldLoadView,
  worldLoadView,
} from './world-load-view';

/** A session's start in the rider's time, "7:39 PM", as the class ride writes it. */
const LOCAL_TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/** World loading is slow once it has run this long without the world being ready (L2-155 AC1). */
const SLOW_SECONDS = 20;

/** Whether this browser can draw a 3D world: WebGPU, or else WebGL 2 (L2-156 AC4). */
function draws3d(): boolean {
  if ((navigator as Navigator & { gpu?: unknown }).gpu) return true;
  const gl = document.createElement('canvas').getContext('webgl2');
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return gl !== null;
}

/**
 * World loading for a solo world class (L2-151, L2-152, L2-156; docs/detailed-designs/classes/load-a-class-world/),
 * provided by the class ride page, so leaving it releases everything the load acquired. It imports the `world`
 * library, which holds `main`'s worlds and draws the class's world as `main` gives it, downloads the world's assets
 * through `WORLD_DOWNLOADER`, then starts `main`'s renderer on a canvas that is never shown: `start` builds the scene's
 * programs over a few frames and rehearses the ride's first frame, so the shaders are built and the first frames warm
 * when it resolves. `start` reports the programs it builds in batches and the frame rate its warm-up held (slice 16.2),
 * and a build that fails at a level steps down to the one below (`startStepping`). After 20 seconds without the world
 * being ready it warns and offers Low or the panorama (L2-155). Where neither WebGPU nor WebGL 2 draws, the panorama is
 * all there is to download. A group ride (`?session=`) joins its session here, counts down to its start and starts
 * with everyone then, ready or not; the world follows when it is ready (slice 16.4).
 */
@Injectable()
export class WorldLoadStore {
  private readonly downloader = inject(WORLD_DOWNLOADER);
  /** The rider's World settings: the level, step-down and graphics API the world starts with (L2-159, L2-160, L2-161). */
  private readonly settings = inject(RIDE_SETTINGS).settings;
  private readonly drawing = computed(() => worldQuality(this.settings()));
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly remembered = inject(REMEMBERED_BIKE).get();
  private readonly live = inject(LiveSessionStore);
  private readonly time = inject(MONOTONIC_TIME);
  private readonly router = inject(Router);
  /** The group session's start on the monotonic clock, its start as server time, and the time now, once seated. */
  private readonly groupAt = signal<number | null>(null);
  private readonly groupStartsAt = signal<string | null>(null);
  private readonly groupNow = signal(0);
  /** The session's seats taken of its capacity, from the class's sessions; `null` until read, or if they cannot be. */
  private readonly seats = signal<{ readonly taken: number; readonly capacity: number } | null>(
    null,
  );
  private countdown: ReturnType<typeof setTimeout> | null = null;
  private readonly abort = new AbortController();
  private renderer: WorldRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private frame: number | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  /** When World loading opened, and when the shaders started building, as `Date.now()`. */
  private readonly openedAt = Date.now();
  private shadersFrom: number | null = null;

  /** The class ride replaces World loading: the rider pressed Start riding, or the group's session started. */
  readonly riding: WritableSignal<boolean>;
  /** Whether the ride is in a group session (`?session=`): it starts with everyone at the session's start (L2-154). */
  readonly group: boolean;
  /** The started renderer and its canvas, handed to the class ride by Start riding (L2-153 AC3, AC5). */
  readonly prepared = signal<PreparedWorld | null>(null);
  /** The class's id, for Back to class. */
  readonly classId: string;
  readonly dto = signal<ClassDto | null>(null);
  /** The class's world as `main` draws it, once the world library has loaded. */
  readonly world = signal<World | null>(null);
  private readonly phase = signal<WorldLoadPhase>('downloading');
  private readonly progress = signal<WorldDownloadProgress>({ received: 0, total: 0 });
  private readonly startPercent = signal(0);
  private readonly backend = signal<Backend | null>(null);
  /** Neither WebGPU nor WebGL 2 draws here, or the renderer could not start: the class rides the panorama. */
  private readonly panoramaOnly = signal(false);
  /** The quality level the world is built at: `main`'s starting level, or Low (L2-152 AC7, L2-155 AC3). */
  private readonly tier = signal<WorldTier>('low');
  private readonly programs = signal<{ built: number; total: number } | null>(null);
  private readonly warmed = signal<{ fps: number; tier: WorldTier } | null>(null);
  /** Whole seconds since World loading opened, and spent on the shaders, read once a second (L2-155 AC1). */
  private readonly seconds = signal(0);
  private readonly shaderSeconds = signal(0);
  /** The rider chose Start at Low quality: the warning has gone for this load (L2-155 AC3). */
  private readonly lowChosen = signal(false);
  private readonly slowPercent = signal(0);
  private readonly expected: Backend = 'gpu' in navigator ? 'webgpu' : 'webgl2';

  /** "Neon Docklands · Harbour Bridges Loop · Solo", or "· Group class" in a group session (L2-151 AC2, L2-154). */
  readonly eyebrow = computed(() => {
    const world = this.world();
    return world ? `${world.name} · ${world.route} · ${this.group ? 'Group class' : 'Solo'}` : '';
  });

  /** "Telo Ride Studio · VO₂ max · 5:00 warm-up, 6 × 1:00 efforts with 1:00 recoveries, 4:00 cool-down". */
  readonly planSummary = computed(() => {
    const dto = this.dto();
    return dto ? `${dto.channel} · ${dto.focus} · ${PlanSummary.outline(dto.plan.segments)}` : '';
  });

  /** The world's panorama behind World loading, with what it shows (L2-151 AC3); `null` for a world without one. */
  readonly panorama = computed(() => {
    const world = this.world();
    const url = world ? panoramaUrl(world.id) : null;
    return world && url
      ? { url, alt: `The ${world.name} world: ${WORLD_PANORAMAS[world.id]}` }
      : null;
  });

  readonly view = computed<WorldLoadView | null>(() => {
    const world = this.world();
    const dto = this.dto();
    if (!world || !dto) return null;
    const first = dto.plan.segments[0];
    return worldLoadView({
      name: world.name,
      phase: this.phase(),
      progress: this.progress(),
      api: this.backend() ?? this.expected,
      panoramaOnly: this.panoramaOnly(),
      warmUpSeconds: first?.kind === 'warm-up' ? first.duration : null,
      startPercent: this.startPercent(),
      programs: this.programs(),
      warmed: this.warmed(),
      slow: this.slow(),
      shaderSeconds: this.shaderSeconds(),
      slowPercent: this.slowPercent(),
      bikeConnected: this.connection.ble() === 'connected',
      groupStartsAt: this.groupView()?.time ?? null,
    });
  });

  /**
   * The group's countdown once seated (L2-154 AC1, AC2): the start in the rider's time, the time left ("1:12") and the
   * fact "Group · 7:39 PM · 6 of 10"; `null` solo or before the seat.
   */
  readonly groupView = computed(() => {
    const at = this.groupAt();
    const startsAt = this.groupStartsAt();
    if (at === null || startsAt === null) return null;
    const time = LOCAL_TIME.format(new Date(startsAt));
    const seats = this.seats();
    return {
      time,
      left: formatClock(Math.max(0, Math.ceil((at - this.groupNow()) / 1000))),
      fact: `Group · ${time}${seats ? ` · ${seats.taken} of ${seats.capacity}` : ''}`,
    };
  });

  readonly failed = computed(() => this.phase() === 'failed');

  /** World loading has run 20 seconds without the world being ready, and the rider has not chosen Low (L2-155). */
  readonly slow = computed(
    () =>
      !this.group &&
      this.seconds() >= SLOW_SECONDS &&
      !this.lowChosen() &&
      this.phase() !== 'ready' &&
      this.phase() !== 'failed',
  );

  /**
   * The quality fact, "Auto quality · Low", while the world is drawn in 3D (L2-152 AC7); "Quality · Medium" when the
   * rider fixed the level in Settings (L2-159 AC5).
   */
  readonly quality = computed(() =>
    this.panoramaOnly()
      ? null
      : `${this.settings().quality === 'auto' ? 'Auto quality' : 'Quality'} · ${TIER_NAME[this.tier()]}`,
  );

  /** The bike fact: its name when connected, "No bike" otherwise (L2-152 AC7). */
  readonly bike = computed(() => {
    const bike = this.connection.bike() ?? this.remembered;
    return this.connection.ble() === 'connected' && bike
      ? { name: bike.name, ok: true }
      : { name: 'No bike', ok: false };
  });

  /** The bike is not connected and World loading has not failed: the alert with Connect bike shows (L2-157 AC1). */
  readonly noBike = computed(() => !this.bike().ok && !this.failed());

  /** The graphics fact: "WebGPU", "WebGL 2", or "Panorama" without 3D (L2-152 AC7, L2-156 AC4). */
  readonly graphics = computed(() => {
    if (this.panoramaOnly()) return 'Panorama';
    return (this.backend() ?? this.expected) === 'webgpu' ? 'WebGPU' : 'WebGL 2';
  });

  constructor() {
    const route = inject(ActivatedRoute).snapshot;
    this.classId = route.paramMap.get('id') ?? '';
    const sessionId = route.queryParamMap.get('session');
    this.group = sessionId !== null;
    this.riding = signal(false);
    inject(DestroyRef).onDestroy(() => {
      if (this.countdown !== null) clearTimeout(this.countdown);
      this.release();
    });
    if (sessionId !== null) this.joinGroup(sessionId);
    this.panoramaOnly.set(!draws3d());
    this.timer = setInterval(() => this.tick(), 1000);
    inject(CLASSES_API)
      .get(this.classId)
      .pipe(takeUntilDestroyed())
      .subscribe((dto) => {
        this.dto.set(dto);
        void this.load(dto);
      });
  }

  /** Try again: the download resumes from the bytes already received (L2-156 AC2). */
  retry(): void {
    const dto = this.dto();
    if (dto) void this.load(dto);
  }

  /**
   * Start at Low quality, for this ride only (L2-155 AC3): the warning goes and the world is built at Low. `main` starts
   * every world at Low, so a build already running is at Low and carries on; one not yet begun starts at Low.
   */
  startAtLow(): void {
    this.lowChosen.set(true);
    this.tier.set('low');
  }

  /**
   * Connect bike, keeping World loading and its world (L2-157 AC1): a connection that gave up (`idle`) tries the
   * remembered bike again, a dropped one (`disconnected`) retries at once, and one still waiting for the bike's first
   * answer is left to it.
   */
  connectBike(): void {
    const ble = this.connection.ble();
    if (ble === 'disconnected') this.connection.reconnectNow();
    else if (ble === 'idle' && this.remembered)
      void this.connection.reconnectRemembered(this.remembered);
  }

  /**
   * Start riding, or Ride with the panorama: the class ride takes World loading's place. A world that is ready goes to
   * the ride with its renderer and canvas, warm, rather than being disposed (L2-153 AC3, AC5); anything still loading is
   * stopped and released.
   */
  ride(): void {
    this.handOver();
    this.riding.set(true);
  }

  /** A ready world goes to the class ride with its renderer and canvas; then the load releases what is left. */
  private handOver(): void {
    if (this.phase() === 'ready' && this.renderer && this.canvas) {
      this.prepared.set({ renderer: this.renderer, canvas: this.canvas });
      this.renderer = null;
      this.canvas = null;
    }
    this.release();
  }

  /**
   * Joins the group's session on the page's `LiveSessionStore`, which the class ride then shares (slice 16.4), reads its
   * seats for the facts, and counts down to the session's start from the seat and the measured clock offset. A refused
   * join leaves for Class Start, which offers the next session (L2-122 AC2, L2-086 AC3), or for the Class Library when
   * the class is locked (L2-082). Without a seat or an offset (the hub cannot be reached) the ride starts at once
   * (L2-126).
   */
  private joinGroup(sessionId: string): void {
    effect(() => {
      const refused = this.live.refused();
      if (refused === null) return;
      untracked(
        () =>
          void this.router.navigate(
            refused === 'class_locked' ? ['/classes'] : ['/classes', this.classId],
            { replaceUrl: true },
          ),
      );
    });
    inject(CLASSES_API)
      .sessions(this.classId)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (sessions) => {
          const session = sessions.find((each) => each.id === sessionId);
          if (session) this.seats.set({ taken: session.seatsTaken, capacity: session.capacity });
        },
        // Without the sessions the fact reads "Group · 7:39 PM".
        error: () => undefined,
      });
    void this.live.join({ kind: 'class', classId: this.classId, sessionId }).then(() => {
      if (this.riding() || this.live.refused() !== null) return;
      const seat = this.live.seat();
      const offset = this.live.offsetMs();
      if (seat === null || offset === null) return this.startWithGroup();
      this.groupStartsAt.set(seat.startsAt);
      this.groupAt.set(Date.parse(seat.startsAt) - offset);
      this.countDown();
    });
  }

  /** Reads the time and wakes on each whole second before the group's start; at the start the ride begins. */
  private countDown(): void {
    this.countdown = null;
    const at = this.groupAt();
    if (at === null) return;
    const now = this.time.now();
    this.groupNow.set(now);
    if (now >= at) return this.startWithGroup();
    this.countdown = setTimeout(() => this.countDown(), (at - now) % 1000 || 1000);
  }

  /**
   * The group's start: the class ride takes World loading's place with everyone, whether the world is ready or not
   * (L2-154 AC3). A ready world goes with it; one still loading carries on and follows when ready (AC4).
   */
  private startWithGroup(): void {
    this.riding.set(true);
    if (this.phase() === 'ready' || this.phase() === 'failed') this.handOver();
  }

  private async load(dto: ClassDto): Promise<void> {
    const world = await import('@telo/world');
    if (this.destroyed) return;
    const drawn = world.worldForMap(dto.world);
    this.world.set(drawn);
    if (!this.lowChosen()) this.tier.set(this.drawing().tier ?? world.startTier());
    const progress = this.progress();
    this.startPercent.set(
      progress.total > 0 ? Math.floor((40 * progress.received) / progress.total) : 0,
    );
    this.phase.set('downloading');
    try {
      const size = await this.downloader.download(
        drawn.id,
        (now) => this.progress.set(now),
        this.abort.signal,
      );
      this.progress.set({ received: size, total: size });
    } catch (error) {
      if (this.destroyed) return;
      if (error instanceof WorldDownloadError) this.progress.set(error.progress);
      this.phase.set('failed');
      return;
    }
    if (this.destroyed) return;
    if (this.panoramaOnly()) {
      this.ready();
      return;
    }
    this.phase.set('building');
    this.startPercent.set(this.view()?.percent ?? 0);
    this.shadersFrom = Date.now();
    const segments = world.timedSegments(dto.plan.segments);
    const started = await startStepping(
      this.tier(),
      async (tier) => {
        this.disposeRenderer();
        this.tier.set(tier);
        this.programs.set(null);
        const renderer = await world.loadWorldRenderer();
        if (this.destroyed) {
          renderer.dispose();
          throw new Error('World loading has gone');
        }
        this.renderer = renderer;
        const canvas = document.createElement('canvas');
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        this.canvas = canvas;
        const drawing = this.drawing();
        return renderer.start(canvas, drawn, () => this.nextFrame(), segments, {
          tier,
          stepDown: drawing.stepDown,
          forceWebGL: drawing.forceWebGL,
          progress: (progress) => this.report(progress),
        });
      },
      this.abort.signal,
    );
    if (this.destroyed) return;
    if (started && this.renderer) {
      this.backend.set(this.renderer.backend);
    } else {
      this.disposeRenderer();
      this.panoramaOnly.set(true);
    }
    this.ready();
  }

  /** The world is ready; a group that has already started gets it now, faded in over its panorama (L2-154 AC4). */
  private ready(): void {
    this.phase.set('ready');
    if (this.riding()) this.handOver();
  }

  /** The renderer's progress: programs built, the warm-up starting, and the rate it held (L2-152 AC4, AC5). */
  private report(progress: WorldStartProgress): void {
    if (this.destroyed) return;
    if (progress.step === 'shaders') {
      this.programs.set({ built: progress.built, total: progress.total });
      // The programs are built for the API the renderer started with, which may be WebGL 2 where WebGPU was offered.
      this.backend.set(progress.backend);
    } else if (progress.step === 'warm-up') {
      this.phase.set('warming');
      this.startPercent.set(this.view()?.percent ?? 0);
    } else {
      this.warmed.set({ fps: progress.fps, tier: progress.tier });
    }
  }

  /** Reads the time once a second: the load turns slow at 20 seconds, and the shaders count their seconds (L2-155). */
  private tick(): void {
    const now = Date.now();
    const wasSlow = this.slow();
    this.seconds.set(Math.floor((now - this.openedAt) / 1000));
    if (this.shadersFrom !== null) {
      this.shaderSeconds.set(Math.floor((now - this.shadersFrom) / 1000));
    }
    if (!wasSlow && this.slow()) this.slowPercent.set(this.view()?.percent ?? 0);
  }

  /** The next animation frame, for the renderer's load; refused once World loading has gone. */
  private nextFrame(): Promise<void> {
    if (this.destroyed) return Promise.reject(new Error('World loading has gone'));
    return new Promise((resolve) => {
      this.frame = requestAnimationFrame(() => {
        this.frame = null;
        resolve();
      });
    });
  }

  private disposeRenderer(): void {
    this.renderer?.dispose();
    this.renderer = null;
    this.canvas = null;
  }

  /** Stops the download and the renderer's load, and disposes the renderer (L2-151 AC5). */
  private release(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abort.abort();
    if (this.timer !== null) clearInterval(this.timer);
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.disposeRenderer();
  }
}
