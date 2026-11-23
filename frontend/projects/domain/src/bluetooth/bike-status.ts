import type { BikeStatusView, BleState, BluetoothSupportState } from '@telo/api';

/**
 * The bike status every screen shows, from the link state, the browser's support and the bike's name (L2-018 AC3,
 * L2-019). The browser comes first, so with Bluetooth off it never says that no bike was found.
 */
export function bikeStatus(
  ble: BleState,
  support: BluetoothSupportState,
  bikeName: string | null,
): BikeStatusView {
  const connected = ble === 'connected';
  const rideLabel =
    support === 'unsupported-browser' || support === 'insecure-context'
      ? 'Bluetooth unavailable in this browser'
      : support === 'adapter-off'
        ? 'Bluetooth is off'
        : connected
          ? 'Connected'
          : bikeName && ble === 'disconnected'
            ? 'Disconnected'
            : 'No bike connected';
  const named = bikeName !== null && (rideLabel === 'Connected' || rideLabel === 'Disconnected');
  return {
    label: bikeName ?? 'Bike',
    hiddenText: connected ? ' connected' : ' not connected',
    title: connected ? null : 'Bike not connected',
    tone: connected ? 'ok' : 'alert',
    rideLabel,
    diagnosticsLabel: named ? `Diagnostics: ${bikeName} ${rideLabel}` : `Diagnostics: ${rideLabel}`,
  };
}
