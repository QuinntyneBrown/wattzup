import {
  afterNextRender,
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
import type { Segment } from '@wattzup/api';
import { FrameScheduler } from '../../core/frame-scheduler';
import { MotionPreference } from '../../core/motion-preference';
import { SceneDriver } from '../../core/scene-driver';
import { WORLD_RENDERER, type WorldRenderer } from '../../core/world-renderer-port';
import type { World } from '../../core/worlds';

/**
 * The class's world drawn under the World Ride HUD (L2-110). It loads the renderer on first
 * render, draws on the app's frame loop, and emits `unavailable` once when it cannot draw.
 */
@Component({
  selector: 'wz-world-scene',
  templateUrl: './world-scene.html',
  styleUrl: './world-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldScene {
  readonly world = input.required<World>();
  readonly segments = input.required<readonly Segment[]>();
  readonly elapsed = input.required<number>();
  readonly speedKmh = input.required<number | null>();
  readonly running = input.required<boolean>();
  /** Emitted once when WebGL is unavailable or the renderer fails to start (L2-110 AC4). */
  readonly unavailable = output<void>();

  private readonly load = inject(WORLD_RENDERER);
  private readonly frames = inject(FrameScheduler);
  private readonly motion = inject(MotionPreference);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly driver = signal<SceneDriver | null>(null);
  /** True while the display's frame period is measured again: the scene holds its picture. */
  private readonly measuring = signal(false);

  /** The scene's text alternative (L2-110 AC3). */
  protected readonly label = computed(
    () => `A cyclist on ${this.world().route} in ${this.world().name}`,
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    let renderer: WorldRenderer | null = null;
    let stop: (() => void) | null = null;
    let observer: ResizeObserver | null = null;
    let screen: MediaQueryList | null = null;
    let destroyed = false;

    // The tab's return or another screen may change the display's refresh rate: measure it
    // again, judging and drawing nothing meanwhile (L2-111 AC9).
    const remeasure = () => {
      const r = renderer;
      if (!r || destroyed || untracked(this.measuring)) return;
      r.pauseBudget();
      this.measuring.set(true);
      void this.frames.measurePeriod().then((period) => {
        if (destroyed) return;
        r.setFramePeriod(period);
        this.measuring.set(false);
      });
    };
    const onVisibility = () => {
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

    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      // The display's frame period is measured before the scene's own work can slow it
      // (L2-111 AC9).
      void Promise.all([this.load(), this.frames.measurePeriod()])
        .then(async ([loaded, period]) => {
          const started = await loaded.start(
            canvas,
            untracked(this.world),
            () => this.frames.nextFrame(),
            untracked(this.segments),
          );
          if (started) loaded.setFramePeriod(period);
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
            renderer = loaded;
            const resize = () =>
              loaded.resize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio);
            resize();
            observer = new ResizeObserver(resize);
            observer.observe(canvas);
            document.addEventListener('visibilitychange', onVisibility);
            watchScreen();
            this.driver.set(new SceneDriver(loaded));
          },
          () => {
            if (!destroyed) this.unavailable.emit();
          },
        );
    });

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

    // One frame per tick of the loop, and one whenever the inputs change.
    effect(() => {
      const driver = this.driver();
      if (!driver || this.measuring()) return;
      const now = this.frames.now();
      driver.frame(now, {
        segments: this.segments(),
        elapsed: this.elapsed(),
        speedKmh: this.speedKmh(),
        running: this.running(),
        reducedMotion: this.motion.reduced(),
      });
    });
  }
}
