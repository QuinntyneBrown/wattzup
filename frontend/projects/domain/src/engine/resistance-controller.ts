import { Injectable, computed, inject, signal } from '@angular/core';
import {
  BIKE_CONNECTION,
  BikeConnectionError,
  type ResistanceSource,
  type SentCommand,
} from '@telo/api';
import { MAX_RESISTANCE, MIN_RESISTANCE } from '../protocol/echelon-protocol';
import { BikeTelemetry } from './bike-telemetry';
import { RideClock } from './ride-clock';
import { logSent } from './sent-log';

const clamp = (level: number): number =>
  Math.min(MAX_RESISTANCE, Math.max(MIN_RESISTANCE, Math.round(level)));

/**
 * The target resistance (docs/detailed-designs/bike/control-resistance): a plan's level, clamped to 1 to 32 and sent
 * through the connection (L2-025 AC2, L2-027 AC1), with the last command and its acknowledgement time (L2-025 AC4).
 * The target stays the plan's level whatever resistance the bike reports (L2-026 AC1). With the bike away the
 * connection keeps the target and sends it first after the reconnect (L2-027 AC4); with the bike away, or once an
 * FTMS bike refuses control, `canControl` is false (L2-028 AC4). Each command the bike took goes to the top of a log
 * of at most 50, at the ride clock's whole second when the screen has one (L2-029 AC1, AC3). Provided by each ride
 * screen.
 */
@Injectable()
export class ResistanceController {
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly telemetry = inject(BikeTelemetry, { optional: true });
  private readonly level = signal<number | null>(null);
  private readonly from = signal<ResistanceSource>('plan');
  private readonly refused = signal(false);
  private readonly sent = signal<SentCommand | null>(null);
  private readonly clock = inject(RideClock, { optional: true });
  private readonly entries = signal<readonly SentCommand[]>([]);

  readonly target = this.level.asReadonly();
  readonly source = this.from.asReadonly();
  readonly canControl = computed(() => this.connection.ble() === 'connected' && !this.refused());
  readonly last = this.sent.asReadonly();
  /** The commands the bike took, newest first, at most 50 (L2-029 AC1, AC3). */
  readonly log = this.entries.asReadonly();

  applyPlanLevel(level: number): Promise<void> {
    return this.send(level, 'plan');
  }

  /**
   * "Raise resistance" or "Lower resistance": one level from the target, or from the bike's reported resistance before
   * any target, clamped and sent as the rider's own (L2-028 AC1). Nothing is sent while it cannot control the bike
   * (AC4); the next segment's plan level replaces it (AC3).
   */
  nudge(delta: 1 | -1): Promise<void> {
    const from = this.level() ?? this.telemetry?.resistance() ?? MIN_RESISTANCE;
    return this.setManual(from + delta);
  }

  /** A "Level N" bar: N becomes the target, as the rider's own (L2-028 AC2). */
  async setManual(level: number): Promise<void> {
    if (!this.canControl()) return;
    await this.send(level, 'manual');
  }

  private async send(level: number, source: ResistanceSource): Promise<void> {
    const target = clamp(level);
    this.level.set(target);
    this.from.set(source);
    const rideTime = this.clock === null ? null : Math.floor(this.clock.elapsedMs() / 1000);
    try {
      const ackMs = await this.connection.setResistance(target);
      const command: SentCommand = { rideTime, level: target, source, ackMs };
      this.sent.set(command);
      this.entries.update((log) => logSent(log, command));
    } catch (error) {
      if (error instanceof BikeConnectionError && error.code === 'read-only')
        this.refused.set(true);
    }
  }
}
