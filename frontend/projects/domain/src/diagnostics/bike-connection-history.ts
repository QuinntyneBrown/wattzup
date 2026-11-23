import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { BIKE_CONNECTION, type BleState, type ConnectionHistory, REMEMBERED_BIKE } from '@telo/api';

/**
 * `ConnectionHistory` from the connection's `ble` state: when the link connected, and how often it came back after a
 * drop since the bike last connected from scratch (an `idle` link starts the count again). Each time the remembered
 * bike connects, it saves it again, so Diagnostics knows when it was last seen (L2-113 AC2, AC4).
 */
@Injectable()
export class BikeConnectionHistory implements ConnectionHistory {
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly remembered = inject(REMEMBERED_BIKE);
  private readonly since = signal<number | null>(null);
  private readonly count = signal(0);
  private connectedBefore = false;

  readonly connectedSince = this.since.asReadonly();
  readonly reconnects = this.count.asReadonly();

  constructor() {
    effect(() => {
      const ble = this.connection.ble();
      untracked(() => this.follow(ble));
    });
  }

  private follow(ble: BleState): void {
    if (ble !== 'connected') {
      this.since.set(null);
      if (ble === 'idle') {
        this.connectedBefore = false;
        this.count.set(0);
      }
      return;
    }
    if (this.since() !== null) return;
    if (this.connectedBefore) this.count.update((n) => n + 1);
    this.connectedBefore = true;
    this.since.set(Date.now());
    const bike = this.connection.bike();
    if (bike !== null && this.remembered.get()?.id === bike.id) this.remembered.save(bike);
  }
}
