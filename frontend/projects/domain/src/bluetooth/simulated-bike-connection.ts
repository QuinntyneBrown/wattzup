import { Injectable, type OnDestroy, inject, signal } from '@angular/core';
import { type BikeConnection, type BikeInfo, type BleState, TICKER } from '@telo/api';
import { Subject, type Subscription } from 'rxjs';
import { EchelonProtocol } from '../protocol/echelon-protocol';
import { SimulatedRiderProfile } from './simulated-rider-profile';

/** The bike the simulator plays: an Echelon EX-5s. */
export const SIMULATED_BIKE: BikeInfo = {
  id: 'EX5S-0bf669f1',
  name: 'Echelon EX-5s',
  identifier: 'EX5S-0bf669f1',
  kind: 'echelon',
};

/**
 * A simulated Echelon EX-5s for development builds opened with `?simulate` (L2-024). It never calls
 * `navigator.bluetooth`: `requestBike()` resolves at once, with no chooser. Once connected it sends a `D1` and a `D2`
 * frame each second of the `TICKER`, encoded by `EchelonProtocol`, through `frames`, exactly as a real bike's
 * notifications arrive; a set-resistance command is parsed back and its level reported by the next `D2`.
 */
@Injectable()
export class SimulatedBikeConnection implements BikeConnection, OnDestroy {
  private readonly ticker = inject(TICKER);
  private readonly sent = new Subject<Uint8Array>();
  private ticking: Subscription | null = null;
  private elapsed = 0;
  private revolutions = 0;
  private level = 8;
  private readonly link = signal<BleState>('idle');
  private readonly chosen = signal<BikeInfo | null>(null);

  readonly frames = this.sent.asObservable();
  readonly ble = this.link.asReadonly();
  readonly bike = this.chosen.asReadonly();
  readonly lastError = signal<string | null>(null).asReadonly();

  async requestBike(): Promise<BikeInfo> {
    this.chosen.set(SIMULATED_BIKE);
    return SIMULATED_BIKE;
  }

  async connect(): Promise<void> {
    this.chosen.set(SIMULATED_BIKE);
    this.ticking ??= this.ticker.seconds.subscribe(() => this.tick());
    this.link.set('connected');
  }

  /** The simulated bike is always in reach: reconnecting starts it as `connect()` does. */
  async reconnectRemembered(): Promise<boolean> {
    await this.connect();
    return true;
  }

  /** The simulated bike never drops, so there is nothing to retry. */
  reconnectNow(): void {
    return;
  }

  async setResistance(level: number): Promise<number> {
    const parsed = EchelonProtocol.parseSetResistance(EchelonProtocol.setResistance(level));
    if (parsed !== null) this.level = parsed;
    return 0; // the simulator acknowledges at once
  }

  disconnect(): void {
    this.ticking?.unsubscribe();
    this.ticking = null;
    this.link.set('idle');
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.sent.complete();
  }

  private tick(): void {
    const cadence = SimulatedRiderProfile.cadenceAt(this.elapsed);
    this.elapsed += 1;
    this.revolutions += cadence / 60;
    this.sent.next(
      EchelonProtocol.workout({
        elapsedSeconds: this.elapsed,
        revolutions: Math.floor(this.revolutions),
        cadence,
      }),
    );
    this.sent.next(EchelonProtocol.resistance(this.level));
  }
}
