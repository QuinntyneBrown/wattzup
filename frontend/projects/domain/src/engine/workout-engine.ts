import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Plan } from '@telo/api';
import { type PlanState, planStateAt } from './plan-state';
import { ResistanceController } from './resistance-controller';
import { RideClock } from './ride-clock';
import { RideTicker } from './ride-ticker';

/**
 * Follows a plan on the ride clock (docs/detailed-designs/classes/ride-a-class): on each of the ticker's seconds it
 * finds the plan's state, and when a new segment starts it sends that segment's level as the target resistance, within
 * 500 ms of the boundary since ticks land on whole seconds (L2-027 AC1). A paused clock publishes no second, so no
 * segment changes and nothing is sent (AC3); after a hidden tab only the current segment's level is sent (L2-133 AC2).
 * Provided by each ride screen with `RideClock`, `RideTicker` and `ResistanceController`.
 */
@Injectable()
export class WorkoutEngine {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly resistance = inject(ResistanceController);
  private readonly destroyRef = inject(DestroyRef);
  private readonly current = signal<PlanState | null>(null);
  private plan: Plan | null = null;

  readonly state = this.current.asReadonly();

  follow(plan: Plan): void {
    const first = this.plan === null;
    this.plan = plan;
    if (first)
      this.ticker.ticks.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.step());
    this.step();
  }

  private step(): void {
    if (this.plan === null) return;
    const before = this.current();
    const now = planStateAt(this.plan, this.clock.elapsedMs());
    this.current.set(now);
    if (now !== null && now.index !== before?.index)
      void this.resistance.applyPlanLevel(now.segment.level);
  }
}
