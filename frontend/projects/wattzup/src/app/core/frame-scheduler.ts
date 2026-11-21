// The dashboard's only requestAnimationFrame caller (L2-028, L2-038). It coalesces draw
// requests to one per frame, drives the countdown's frame signal, and requests no frame
// while the tab is hidden.
import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { estimateFramePeriod } from './frame-period';

interface Measure {
  readonly frames: number;
  readonly times: number[];
  readonly done: (periodMs: number) => void;
}

@Injectable({ providedIn: 'root' })
export class FrameScheduler {
  private readonly document = inject(DOCUMENT);
  private readonly _now = signal(performance.now());
  /** The time of the latest frame while the loop runs. */
  readonly now = this._now.asReadonly();

  private readonly draws = new Set<() => void>();
  private readonly measures = new Set<Measure>();
  private loops = 0;
  private handle: number | null = null;

  constructor() {
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.hidden) this.cancel();
      else this.schedule();
    });
  }

  /** Keeps `now` ticking every frame until the returned function is called. */
  startLoop(): () => void {
    this.loops++;
    this.schedule();
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      this.loops--;
    };
  }

  /**
   * The display's frame period in ms, from `frames` intervals of back-to-back frames that draw
   * nothing of their own (L2-111 AC9). It waits while the tab is hidden.
   */
  measurePeriod(frames = 30): Promise<number> {
    return new Promise((done) => {
      this.measures.add({ frames, times: [], done });
      this.schedule();
    });
  }

  /** Resolves on the next frame: the scene's warm-up draws one frame at a time (L2-111 AC10). */
  nextFrame(): Promise<void> {
    return new Promise((next) => this.requestDraw(() => next()));
  }

  /** Runs `draw` on the next frame; several requests in one frame run it once. */
  requestDraw(draw: () => void): void {
    this.draws.add(draw);
    this.schedule();
  }

  private schedule(): void {
    if (this.handle !== null || this.document.hidden) return;
    if (this.loops === 0 && this.draws.size === 0 && this.measures.size === 0) return;
    this.handle = requestAnimationFrame((time) => this.frame(time));
  }

  private cancel(): void {
    if (this.handle !== null) cancelAnimationFrame(this.handle);
    this.handle = null;
  }

  private frame(time: number): void {
    this.handle = null;
    if (this.loops > 0) this._now.set(time);
    const draws = [...this.draws];
    this.draws.clear();
    for (const draw of draws) draw();
    for (const m of [...this.measures]) {
      m.times.push(time);
      if (m.times.length <= m.frames) continue;
      this.measures.delete(m);
      m.done(estimateFramePeriod(m.times.slice(1).map((t, i) => t - m.times[i]!)));
    }
    this.schedule();
  }
}
