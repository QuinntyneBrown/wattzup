import type { BleState, BluetoothSupportState } from '@telo/api';
import { bikeStatus } from '@telo/domain';

/** Profile's bike row (L2-112 AC1, AC2). */
export interface BikeRowView {
  readonly title: string;
  readonly body: string;
  /** Whether a bike is paired: the row then leads to Diagnostics (slice 25.1). */
  readonly paired: boolean;
}

/**
 * The bike row's words (docs/detailed-designs/profile/change-settings): the paired bike's name with "Connected ·
 * diagnostics" once connected and "Not connected · diagnostics" until then, or with the bike status's words where the
 * browser stops Bluetooth ("Bluetooth is off · diagnostics"); "No bike yet" with "Pair your bike" when none is paired.
 */
export function bikeRow(
  ble: BleState,
  support: BluetoothSupportState,
  name: string | null,
): BikeRowView {
  if (name === null) return { title: 'No bike yet', body: 'Pair your bike', paired: false };
  const state =
    support !== 'ready'
      ? bikeStatus(ble, support, name).rideLabel
      : ble === 'connected'
        ? 'Connected'
        : 'Not connected';
  return { title: name, body: `${state} · diagnostics`, paired: true };
}
