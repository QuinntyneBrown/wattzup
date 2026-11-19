import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import type { BikeState } from '@wattzup/api';
import { FrameScheduler } from '../../core/frame-scheduler';
import { PowerTraceStore } from '../../core/power-trace.store';
import { ThemeService } from '../../core/theme.service';
import { traceDrawList } from '../../core/trace-draw-list';
import { traceGeometry } from '../../core/trace-geometry';
import {
  TRACE_RENDERER_FACTORY,
  type TraceColors,
  type TraceRenderer,
  canvas2d,
  readTraceColors,
} from '../../core/trace-renderer';
import { TraceRendererStatus } from '../../core/trace-renderer-status';

/** Power vs. plan (L2-026, L2-028). */
@Component({
  selector: 'wz-ride-trace',
  templateUrl: './ride-trace.html',
  styleUrl: './ride-trace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideTrace {
  readonly state = input<BikeState | null>(null);
  readonly dimmed = input(false);

  private readonly store = inject(PowerTraceStore);
  private readonly frames = inject(FrameScheduler);
  private readonly theme = inject(ThemeService);
  private readonly status = inject(TraceRendererStatus);
  private readonly factory = inject(TRACE_RENDERER_FACTORY);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly plot = viewChild<ElementRef<HTMLElement>>('plot');
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly scene = computed(() => {
    const w = this.state()?.workout;
    return w ? traceGeometry(w, w.elapsed_seconds) : null;
  });
  protected readonly summary = computed(() => {
    const scene = this.scene();
    const w = this.state()?.workout;
    if (!scene || !w) return '';
    return `Average ${this.state()?.avg_power ?? 0} W against a plan average of ${scene.planAverage} W`;
  });

  private renderer: TraceRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private colors: TraceColors | null = null;
  private size = { width: 0, height: 0, ratio: 1 };
  private observer: ResizeObserver | null = null;
  private readonly draw = (): void => this.paint();

  constructor() {
    const destroyRef = inject(DestroyRef);
    // A theme change re-reads the colours and redraws (L2-061 AC5).
    effect(() => {
      this.theme.theme();
      untracked(() => {
        this.colors = null;
        this.frames.requestDraw(this.draw);
      });
    });
    effect(() => {
      const canvas = this.canvasRef()?.nativeElement;
      const plot = this.plot()?.nativeElement;
      untracked(() => this.attach(canvas ?? null, plot ?? null));
    });
    effect(() => {
      this.scene();
      this.store.version();
      untracked(() => this.frames.requestDraw(this.draw));
    });
    afterNextRender(() => this.frames.requestDraw(this.draw));
    destroyRef.onDestroy(() => {
      this.detach();
    });
  }

  private attach(canvas: HTMLCanvasElement | null, plot: HTMLElement | null): void {
    if (canvas === this.canvas && this.renderer) return;
    this.detach();
    if (!canvas || !plot) return;
    const created = this.factory(canvas);
    this.renderer = created.renderer;
    this.canvas = created.canvas;
    this.status.set(created.renderer.kind);
    this.canvas.addEventListener('webglcontextlost', this.onContextLost);
    this.observer = new ResizeObserver(() => this.measure(plot));
    this.observer.observe(plot);
    this.measure(plot);
  }

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    if (!this.canvas) return;
    this.renderer?.dispose();
    const created = canvas2d(this.canvas);
    this.renderer = created.renderer;
    this.canvas = created.canvas;
    this.status.set('Canvas 2D');
    this.renderer.resize(this.size.width, this.size.height, this.size.ratio);
    this.frames.requestDraw(this.draw);
  };

  private measure(plot: HTMLElement): void {
    const rect = plot.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.size = { width: rect.width, height: rect.height, ratio };
    this.renderer?.resize(rect.width, rect.height, ratio);
    this.frames.requestDraw(this.draw);
  }

  private paint(): void {
    const scene = this.scene();
    if (!scene || !this.renderer || !this.canvas) return;
    this.colors ??= readTraceColors(this.host.nativeElement);
    const { width, height, ratio } = this.size;
    this.renderer.draw(
      traceDrawList(scene, this.store.history, width * ratio, height * ratio, ratio),
      this.colors,
    );
  }

  private detach(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.canvas?.removeEventListener('webglcontextlost', this.onContextLost);
    this.renderer?.dispose();
    this.renderer = null;
    this.canvas = null;
  }
}
