import { connectionStatus } from './connection-status';
import { testState } from './test-state';

describe('connectionStatus (L2-018)', () => {
  it.each([
    ['connected', {}, 'Echelon EX-5s', 'Connected', 'bluetooth', 'ok'],
    ['scanning', { ble: 'scanning' }, 'Echelon bike', 'Scanning…', 'bluetooth-scan', 'wait'],
    ['starting', { ble: 'starting' }, 'Echelon bike', 'Scanning…', 'bluetooth-scan', 'wait'],
    ['connecting', { ble: 'connecting' }, 'Echelon EX-5s', 'Connecting…', 'bluetooth', 'wait'],
    [
      'disconnected',
      { ble: 'disconnected' },
      'Echelon EX-5s',
      'Disconnected',
      'bluetooth-off',
      'bad',
    ],
    [
      'disconnected, no label',
      { ble: 'disconnected', device_label: null },
      'Echelon bike',
      'Disconnected',
      'bluetooth-off',
      'bad',
    ],
    ['adapter off', { ble: 'error', adapter: 'off' }, 'Bluetooth', 'Off', 'bluetooth-off', 'bad'],
    ['error', { ble: 'error' }, 'Bike status', 'Error', 'bluetooth-off', 'bad'],
  ] as const)('%s', (_, change, name, label, icon, tone) => {
    expect(connectionStatus(testState(change), 'open', false)).toEqual({ name, label, icon, tone });
  });

  it('reads Server offline while the stream is down', () => {
    expect(connectionStatus(testState(), 'offline', false)).toEqual({
      name: 'Server offline',
      label: 'Retrying…',
      icon: 'wifi-off',
      tone: 'bad',
    });
  });

  it.each([
    [null, false],
    [testState(), true],
  ])('reads Unknown with no state or a failed load', (state, failed) => {
    expect(connectionStatus(state, 'connecting', failed)).toEqual({
      name: 'Bike status',
      label: 'Unknown',
      icon: 'bluetooth',
      tone: 'wait',
    });
  });
});
