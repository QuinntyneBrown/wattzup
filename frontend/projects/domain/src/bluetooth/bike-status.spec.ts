// Unit test
// Traces to: L2-018 AC3; L2-019 AC1, AC2, AC4
// Description: the bike status for every link state and browser, one case per row: the header's label, hidden text,
// title and tone, Custom ride's status and the Diagnostics label.
import type { BleState, BluetoothSupportState } from '@telo/api';
import { bikeStatus } from './bike-status';

const BIKE = 'Echelon EX-5s';

describe('bikeStatus', () => {
  it.each<
    [BleState, BluetoothSupportState, string | null, string, string, string | null, string, string]
  >([
    [
      'connected',
      'ready',
      BIKE,
      BIKE,
      ' connected',
      null,
      'Connected',
      'Diagnostics: Echelon EX-5s Connected',
    ],
    [
      'disconnected',
      'ready',
      BIKE,
      BIKE,
      ' not connected',
      'Bike not connected',
      'Disconnected',
      'Diagnostics: Echelon EX-5s Disconnected',
    ],
    [
      'connecting',
      'ready',
      BIKE,
      BIKE,
      ' not connected',
      'Bike not connected',
      'No bike connected',
      'Diagnostics: No bike connected',
    ],
    [
      'idle',
      'ready',
      BIKE,
      BIKE,
      ' not connected',
      'Bike not connected',
      'No bike connected',
      'Diagnostics: No bike connected',
    ],
    [
      'idle',
      'ready',
      null,
      'Bike',
      ' not connected',
      'Bike not connected',
      'No bike connected',
      'Diagnostics: No bike connected',
    ],
    [
      'disconnected',
      'ready',
      null,
      'Bike',
      ' not connected',
      'Bike not connected',
      'No bike connected',
      'Diagnostics: No bike connected',
    ],
    [
      'idle',
      'adapter-off',
      BIKE,
      BIKE,
      ' not connected',
      'Bike not connected',
      'Bluetooth is off',
      'Diagnostics: Bluetooth is off',
    ],
    [
      'disconnected',
      'adapter-off',
      null,
      'Bike',
      ' not connected',
      'Bike not connected',
      'Bluetooth is off',
      'Diagnostics: Bluetooth is off',
    ],
    [
      'idle',
      'unsupported-browser',
      null,
      'Bike',
      ' not connected',
      'Bike not connected',
      'Bluetooth unavailable in this browser',
      'Diagnostics: Bluetooth unavailable in this browser',
    ],
    [
      'idle',
      'insecure-context',
      BIKE,
      BIKE,
      ' not connected',
      'Bike not connected',
      'Bluetooth unavailable in this browser',
      'Diagnostics: Bluetooth unavailable in this browser',
    ],
  ])(
    '%s, %s, %s: "%s%s", %s, "%s"',
    (ble, support, name, label, hiddenText, title, rideLabel, diagnosticsLabel) => {
      expect(bikeStatus(ble, support, name)).toEqual({
        label,
        hiddenText,
        title,
        tone: ble === 'connected' ? 'ok' : 'alert',
        rideLabel,
        diagnosticsLabel,
      });
    },
  );

  it('never says no bike was found while Bluetooth is off (L2-018 AC3)', () => {
    for (const ble of ['idle', 'connecting', 'connected', 'disconnected'] as BleState[]) {
      expect(bikeStatus(ble, 'adapter-off', null).rideLabel).toBe('Bluetooth is off');
    }
  });
});
