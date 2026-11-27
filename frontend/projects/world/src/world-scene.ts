import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  AUTO_QUALITY,
  type Backend,
  type PreparedWorld,
  type SceneRider,
  type SceneryRequest,
  type SceneryState,
  type Segment,
  WORLD_RENDERER,
  type WorldQuality,
  type WorldRenderer,
} from '@telo/api';
import { FrameScheduler } from './frame-scheduler';
import { worldForMap } from './map-world';
import { MotionPreference } from './motion-preference';
import { timedSegments } from './timed-segments';
import { SceneDriver } from './scene-driver';

/**
 * The map's world drawn under the race HUD (L2-064, L2-065), `main`'s dashboard/world-scene. It loads the renderer on
 * first render, draws on the app's frame loop, emits `started` with the GPU API drawing it, and emits `unavailable`
 * once when it cannot draw. The race scene around it is one image for assistive technology, so the canvas is not
 * another (the race mock).
 */
@Component({
  selector: 'wz-world-scene',
  templateUrl: './world-scene.html',
  styleUrl: './world-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldScene implements AfterViewInit {
  /** The map's world (`MapDto.world`). */
  readonly sunrise = input(false);
  readonly worldId = input.required<string>();
  readonly segments = input.required<readonly Segment[]>();
  readonly raceMetres = input<number>();
  readonly elapsed = input.required<number>();
  readonly speedKmh = input.required<number | null>();
  readonly running = input.required<boolean>();
  /** The race's other riders, drawn at their places in their jerseys (L2-064 AC3); none outside a race. */
  readonly riders = input<readonly SceneRider[] | undefined>(undefined);
  /** The real place to stream as 3D Tiles beside the world, with the rider's key, once the rider asks (L2-066). */
  readonly scenery = input<SceneryRequest | null>(null);
  /** Whether Google refused the key or the tiles stream, with Google's attribution (L2-066 AC4, AC7). */
  readonly sceneryState = output<SceneryState>();
  /**
   * A renderer World loading has started and warmed up, with its canvas: the scene draws with it in place of its own
   * canvas and fades it in, rather than loading and starting another (L2-153 AC3, AC5). Read once, on first render.
   */
  readonly prepared = input<PreparedWorld | null>(null);
  /**
   * How the rider's World settings ask the world to be drawn (L2-159, L2-160, L2-161): the level, step-down and graphics
   * API when it starts, and the frame cap and the drawing buffer's scale from then on, mid-ride too.
   */
  readonly quality = input<WorldQuality>(AUTO_QUALITY);
  /**
   * Reduce motion as the rider's Settings apply it (L2-164 AC2); null follows this device's `prefers-reduced-motion`,
   * as `main` does.
   */
  readonly reducedMotion = input<boolean | null>(null);
  /** Emitted once when WebGL is unavailable or the renderer fails to start (L2-110 AC4). */
  readonly unavailable = output<void>();
  /** Emitted once the renderer has started, with the GPU API drawing the world (L2-065 AC1). */
  readonly started = output<Backend>();

  private readonly load = inject(WORLD_RENDERER);
  private readonly frames = inject(FrameScheduler);
  private readonly motion = inject(MotionPreference);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  /**
   * Set once the scene has started. Until then the canvas is busy and unseen: the load draws
   * hidden parts from a camera no frame has placed yet (L2-111 AC12, #896).
   */
  protected readonly driver = signal<SceneDriver | null>(null);
  /**
   * Whether the tab shows: a hidden tab draws no frame, not even for a change of input such as the clock's second
   * (L2-065 AC3). `main` stopped only its loop, so the race's once-a-second inputs drew a frame each second.
   */
  private readonly visible = signal(!document.hidden);
  /** True while the display's frame period is measured again: the scene holds its picture. */
  private readonly measuring = signal(false);

  private readonly world = computed(() => worldForMap(this.worldId()));
  /** The plan's segments with their start seconds, as `main`'s scene reads them. */
  private readonly timed = computed(() => timedSegments(this.segments()));

  private startOnView: () => void = () => undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let renderer: WorldRenderer | null = null;
    let stop: (() => void) | null = null;
    let observer: ResizeObserver | null = null;
    let screen: MediaQueryList | null = null;
    let destroyed = false;
    let resize: (() => void) | null = null;
    // The display's measured frame period, and when the world last drew, for a frame cap (L2-160 AC4).
    let displayPeriod = 1000 / 60;
    let lastDrawn = -Infinity;
    // Frames are judged against the cap's period at 30 fps: 33.3 ms (L2-160 AC4).
    const judged = (period: number) => {
      displayPeriod = period;
      const cap = untracked(this.quality).frameCapFps;
      return cap === null ? period : Math.max(period, 1000 / cap);
    };

    // The tab's return or another screen may change the display's refresh rate: measure it
    // again, judging and drawing nothing meanwhile (L2-111 AC9).
    const remeasure = () => {
      const r = renderer;
      if (!r || destroyed || untracked(this.measuring)) return;
      r.pauseBudget();
      this.measuring.set(true);
      void this.frames.measurePeriod().then((period) => {
        if (destroyed) return;
        r.setFramePeriod(judged(period));
        this.measuring.set(false);
      });
    };
    const onVisibility = () => {
      this.visible.set(!document.hidden);
      if (!document.hidden) remeasure();
    };
    const onScreen = () => {
      watchScreen();
      remeasure();
    };
    const watchScreen = () => {
      screen?.removeEventListener('change', onScreen);
      screen = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      screen.addEventListener('change', onScreen);
    };
    destroyRef.onDestroy(() => {
      destroyed = true;
      stop?.();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      screen?.removeEventListener('change', onScreen);
      renderer?.dispose();
    });

    // Started once the view is in place: `ngAfterViewInit` rather than `main`'s `afterNextRender`, whose render hooks
    // would grow the initial bundle (L72, L77).
    // Draws with a started renderer from now on: sized to its canvas, on the loop, until the scene goes.
    const begin = (loaded: WorldRenderer, canvas: HTMLCanvasElement) => {
      renderer = loaded;
      // The drawing buffer at the rider's resolution; the HUD over it stays sharp (L2-160 AC5).
      resize = () =>
        loaded.resize(
          canvas.clientWidth,
          canvas.clientHeight,
          devicePixelRatio * untracked(this.quality).renderScale,
        );
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(canvas);
      document.addEventListener('visibilitychange', onVisibility);
      watchScreen();
      this.driver.set(new SceneDriver(loaded));
      this.started.emit(loaded.backend);
    };

    this.startOnView = () => {
      const canvas = this.canvas().nativeElement;
      const prepared = untracked(this.prepared);
      if (prepared) {
        // World loading's canvas takes this one's place, with its attributes (so this scene's styles reach it), and
        // fades in once the frame period is measured: nothing is loaded or compiled again (slice 16.3).
        for (const { name, value } of Array.from(canvas.attributes)) {
          prepared.canvas.setAttribute(name, value);
        }
        prepared.canvas.classList.add('world-scene--handed');
        canvas.replaceWith(prepared.canvas);
        void this.frames.measurePeriod().then((period) => {
          if (destroyed) {
            prepared.renderer.dispose();
            return;
          }
          prepared.renderer.setFramePeriod(judged(period));
          begin(prepared.renderer, prepared.canvas);
          prepared.canvas.classList.remove('world-scene--busy');
        });
        return;
      }
      // The display's frame period is measured before the scene's own work can slow it
      // (L2-111 AC9).
      void Promise.all([this.load(), this.frames.measurePeriod()])
        .then(async ([loaded, period]) => {
          const quality = untracked(this.quality);
          const started = await loaded.start(
            canvas,
            untracked(this.world),
            () => this.frames.nextFrame(),
            untracked(this.timed),
            {
              catalogueWorld: untracked(this.worldId),
              tier: quality.tier ?? undefined,
              ...(untracked(this.sunrise) ? { sunrise: true } : {}),
              stepDown: quality.stepDown,
              forceWebGL: quality.forceWebGL,
            },
          );
          if (started) loaded.setFramePeriod(judged(period));
          return { loaded, started };
        })
        .then(
          ({ loaded, started }) => {
            if (destroyed) {
              loaded.dispose();
              return;
            }
            if (!started) {
              loaded.dispose();
              this.unavailable.emit();
              return;
            }
            begin(loaded, canvas);
          },
          () => {
            if (!destroyed) this.unavailable.emit();
          },
        );
    };

    // The loop runs only while the ride runs: a paused world holds still (L2-109 AC1), and the
    // app's loop requests no frame while the tab is hidden (L2-110 AC5).
    effect(() => {
      const running = this.driver() !== null && this.running();
      if (running && !stop) stop = this.frames.startLoop();
      if (!running && stop) {
        stop();
        stop = null;
      }
    });

    // The real place's tiles, streamed once the world draws and the rider has asked; a new key streams again (L2-066).
    effect(() => {
      const scenery = this.scenery();
      if (!this.driver() || !scenery) return;
      untracked(() =>
        renderer?.stream(scenery.place, scenery.key, (state) => {
          if (!destroyed) this.sceneryState.emit(state);
        }),
      );
    });

    // A new resolution or frame rate applies at once, mid-ride too (L2-158 AC3).
    // Only a new scale or cap acts, so the windows the frame budget judges are not restarted by the rest (L2-159 AC4).
    const renderScale = computed(() => this.quality().renderScale);
    const frameCap = computed(() => this.quality().frameCapFps);
    // The scene starts sized and judged; from then on, a change is applied once.
    let applied: { scale: number; cap: number | null } | null = null;
    effect(() => {
      const scale = renderScale();
      const cap = frameCap();
      if (!this.driver()) return;
      const before = applied;
      applied = { scale, cap };
      if (!before) return;
      untracked(() => {
        if (before.scale !== scale) resize?.();
        if (before.cap !== cap && !this.measuring())
          renderer?.setFramePeriod(judged(displayPeriod));
      });
    });

    // One frame per tick of the loop, and one whenever the inputs change. Under a frame cap, a frame is drawn once its
    // share of a second has passed, give or take half a display frame (L2-160 AC4).
    effect(() => {
      const driver = this.driver();
      if (!driver || this.measuring() || !this.visible()) return;
      const now = this.frames.now();
      const cap = this.quality().frameCapFps;
      if (cap !== null && now - lastDrawn < 1000 / cap - displayPeriod / 2) return;
      lastDrawn = now;
      driver.frame(now, {
        segments: this.timed(),
        raceMetres: this.raceMetres(),
        elapsed: this.elapsed(),
        speedKmh: this.speedKmh(),
        running: this.running(),
        reducedMotion: this.reducedMotion() ?? this.motion.reduced(),
        riders: this.riders(),
      });
    });
  }

  ngAfterViewInit(): void {
    this.startOnView();
  }
}
