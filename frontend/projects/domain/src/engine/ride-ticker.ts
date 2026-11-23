import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { type Observable, Subject } from 'rxjs';
import { RideClock } from './ride-clock';

/**
 * The ride's once-a-second beat (docs/detailed-designs/performance/keep-the-ride-clock-true). It wakes at the next
 * whole second of the ride clock, a second later while paused, and publishes each new whole second once, as `second`
 * and on `ticks` (L2-134 AC2). When a hidden tab is shown again it ticks at once, so whatever the browser throttled is
 * caught up from the clock (L2-133 AC2). `stop()` and destroying its owner release the timer and the listener.
 */
@Injectable()
export class RideTicker {
  private readonly clock = inject(RideClock);
  private readonly document = inject(DOCUMENT);
  private readonly published = signal(0);
  private readonly beat = new Subject<number>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') this.tick();
  };

  readonly second = this.published.asReadonly();
  readonly ticks: Observable<number> = this.beat.asObservable();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stop();
      this.beat.complete();
    });
  }

  /** Starts ticking, publishing at once the second of a clock started in the past (L2-121 AC3). */
  start(): void {
    this.stop();
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.tick();
  }

  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private tick(): void {
    const second = Math.floor(this.clock.elapsedMs() / 1000);
    if (second !== this.published()) {
      this.published.set(second);
      this.beat.next(second);
    }
    this.scheduleNext();
  }

  private scheduleNext(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    const delay = this.clock.running() ? 1000 - (this.clock.elapsedMs() % 1000) : 1000;
    this.timer = setTimeout(() => this.tick(), delay);
  }
}
