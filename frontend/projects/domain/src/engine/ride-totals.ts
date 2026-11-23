import { Injectable, computed, inject, signal } from '@angular/core';
import { BikeTelemetry } from './bike-telemetry';
import { EnergyModel } from './energy-model';

/**
 * A ride's totals (docs/detailed-designs/bike/read-bike-telemetry). On each running second, which the ride screen's
 * ticker reports and a paused ride never does, it adds the live speed in km/h ÷ 3600 to distance (L2-022 AC2, AC3)
 * and the live power ÷ 1000 to output in kJ (L2-023 AC5); a second with an unknown speed or power adds nothing to
 * that total. Average power is output over running seconds, and energy follows from it (AC4). Every total is a
 * scalar, so it stays one number however long the ride.
 */
@Injectable()
export class RideTotals {
  private readonly telemetry = inject(BikeTelemetry);
  private readonly seconds = signal(0);
  private readonly distance = signal(0);
  private readonly output = signal(0);

  readonly runningSeconds = this.seconds.asReadonly();
  readonly distanceKm = this.distance.asReadonly();
  readonly outputKj = this.output.asReadonly();
  readonly avgPowerW = computed(() => {
    const seconds = this.seconds();
    return seconds === 0 ? null : (this.output() * 1000) / seconds;
  });
  readonly energyKcal = computed(() => EnergyModel.kcal(this.avgPowerW() ?? 0, this.seconds()));

  onRunningSecond(): void {
    const speedKmh = this.telemetry.speedKmh() ?? 0;
    const powerW = this.telemetry.powerW() ?? 0;
    this.seconds.update((seconds) => seconds + 1);
    this.distance.update((km) => km + speedKmh / 3600);
    this.output.update((kj) => kj + powerW / 1000);
  }
}
