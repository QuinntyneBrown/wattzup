import {
  DestroyRef,
  Injectable,
  type WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  BIKE_CONNECTION,
  REMEMBERED_BIKE,
  type Backend,
  CLASSES_API,
  type ClassDto,
  type World,
  WORLD_DOWNLOADER,
  WORLD_PANORAMAS,
  WorldDownloadError,
  type WorldDownloadProgress,
  type WorldRenderer,
  panoramaUrl,
} from '@telo/api';
import { PlanSummary } from '@telo/domain';
import { type WorldLoadPhase, type WorldLoadView, worldLoadView } from './world-load-view';

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
 * when it resolves. Where neither WebGPU nor WebGL 2 draws, the panorama is all there is to download. A group ride
 * (`?session=`) rides at once until slice 16.4.
 */
@Injectable()
export class WorldLoadStore {
  private readonly downloader = inject(WORLD_DOWNLOADER);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly remembered = inject(REMEMBERED_BIKE).get();
  private readonly abort = new AbortController();
  private renderer: WorldRenderer | null = null;
  private frame: number | null = null;
  private destroyed = false;

  /** The class ride replaces World loading: the rider pressed Start riding, or the ride is a group's. */
  readonly riding: WritableSignal<boolean>;
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
  private readonly expected: Backend = 'gpu' in navigator ? 'webgpu' : 'webgl2';

  /** "Neon Docklands · Harbour Bridges Loop · Solo" (L2-151 AC2). */
  readonly eyebrow = computed(() => {
    const world = this.world();
    return world ? `${world.name} · ${world.route} · Solo` : '';
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
    });
  });

  readonly failed = computed(() => this.phase() === 'failed');

  /** The bike fact: its name when connected, "No bike" otherwise (L2-152 AC7). */
  readonly bike = computed(() => {
    const bike = this.connection.bike() ?? this.remembered;
    return this.connection.ble() === 'connected' && bike
      ? { name: bike.name, ok: true }
      : { name: 'No bike', ok: false };
  });

  /** The graphics fact: "WebGPU", "WebGL 2", or "Panorama" without 3D (L2-152 AC7, L2-156 AC4). */
  readonly graphics = computed(() => {
    if (this.panoramaOnly()) return 'Panorama';
    return (this.backend() ?? this.expected) === 'webgpu' ? 'WebGPU' : 'WebGL 2';
  });

  constructor() {
    const route = inject(ActivatedRoute).snapshot;
    this.classId = route.paramMap.get('id') ?? '';
    this.riding = signal(route.queryParamMap.has('session'));
    inject(DestroyRef).onDestroy(() => this.release());
    if (this.riding()) return;
    this.panoramaOnly.set(!draws3d());
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
   * Start riding, or Ride with the panorama: the class ride takes World loading's place. The renderer World loading
   * built goes with it; slice 16.3 hands it to the ride instead.
   */
  ride(): void {
    this.release();
    this.riding.set(true);
  }

  private async load(dto: ClassDto): Promise<void> {
    const world = await import('@telo/world');
    if (this.destroyed) return;
    const drawn = world.worldForMap(dto.world);
    this.world.set(drawn);
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
      this.phase.set('ready');
      return;
    }
    this.phase.set('building');
    const renderer = await world.loadWorldRenderer();
    if (this.destroyed) return renderer.dispose();
    this.renderer = renderer;
    const canvas = document.createElement('canvas');
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const started = await renderer
      .start(canvas, drawn, () => this.nextFrame(), world.timedSegments(dto.plan.segments))
      .catch(() => false);
    if (this.destroyed) return;
    if (started) {
      this.backend.set(renderer.backend);
    } else {
      this.disposeRenderer();
      this.panoramaOnly.set(true);
    }
    this.phase.set('ready');
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
  }

  /** Stops the download and the renderer's load, and disposes the renderer (L2-151 AC5). */
  private release(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abort.abort();
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.disposeRenderer();
  }
}
