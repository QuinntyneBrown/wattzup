import { Injectable, signal } from '@angular/core';
import type { BluetoothSupport, BluetoothSupportState } from '@telo/api';

/** The simulated bike needs no Bluetooth (L2-024), so with `?simulate` every browser can ride. */
@Injectable()
export class SimulatedBluetoothSupport implements BluetoothSupport {
  readonly state = signal<BluetoothSupportState>('ready').asReadonly();

  async recheck(): Promise<BluetoothSupportState> {
    return 'ready';
  }

  secureUrl(): string {
    return location.href.replace(/^http:/, 'https:');
  }
}
