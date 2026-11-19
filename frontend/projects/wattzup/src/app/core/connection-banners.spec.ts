import { describe, expect, it } from 'vitest';
import { banners, isReconnect } from './connection-banners';
import { testState, testWorkout } from './test-state';

const base = {
  connection: 'open' as const,
  lastStateTime: '7:07 PM',
  reconnected: null,
  dismissed: new Set<never>(),
};

describe('banners', () => {
  it('shows nothing for a connected, local, real bike', () => {
    expect(banners({ ...base, state: testState() })).toEqual([]);
  });

  it('warns when the stream is offline, with the time of the last state', () => {
    const [b] = banners({ ...base, state: testState(), connection: 'offline' });
    expect(b.id).toBe('offline');
    expect(b.text).toBe(
      'Retrying every 2 seconds. Numbers below are from 7:07 PM and controls are paused.',
    );
    expect(b.action?.kind).toBe('retry');
  });

  it('shows Bluetooth is off with Open diagnostics', () => {
    const [b] = banners({ ...base, state: testState({ adapter: 'off' }) });
    expect(b.tone).toBe('danger');
    expect(b.action?.kind).toBe('diagnostics');
  });

  it('shows the exposed and simulated banners until dismissed', () => {
    const state = testState({ exposed: true, simulated: true, bind_address: '0.0.0.0:8787' });
    expect(banners({ ...base, state }).map((b) => b.id)).toEqual(['exposed', 'simulated']);
    expect(
      banners({ ...base, state, dismissed: new Set(['exposed' as const]) }).map((b) => b.id),
    ).toEqual(['simulated']);
  });

  it('writes the reconnected banner with elapsed and level', () => {
    const [b] = banners({
      ...base,
      state: testState(),
      reconnected: { label: 'Echelon EX-5s', elapsed: 432, level: 18 },
    });
    expect(b.text).toBe(
      'Echelon EX-5s is back. The plan picked up at 7:12 and resistance is set to 18.',
    );
  });
});

describe('isReconnect', () => {
  const active = testWorkout({ status: 'paused: bike disconnected' });
  it('is true when the bike comes back during an active workout', () => {
    expect(
      isReconnect(
        testState({ ble: 'disconnected', workout: active }),
        testState({ workout: testWorkout() }),
      ),
    ).toBe(true);
  });
  it('is false on the first state, with no workout, or when already connected', () => {
    expect(isReconnect(null, testState())).toBe(false);
    expect(
      isReconnect(testState({ ble: 'disconnected', workout: null }), testState({ workout: null })),
    ).toBe(false);
    expect(isReconnect(testState(), testState())).toBe(false);
  });
});
