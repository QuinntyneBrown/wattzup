import { rideViewState } from './ride-view-state';
import { testState, testWorkout } from './test-state';

describe('rideViewState (L2-058)', () => {
  it('1. a failed load wins', () => {
    const v = rideViewState(testState(), 'open', true);
    expect(v.view).toBe('load-failed');
    expect(v.commandsEnabled).toBe(false);
    expect(v.controlsNote).toBe('Controls return when Wattzup can read the bike again.');
  });

  it('2. no state is loading with Pause and End disabled', () => {
    const v = rideViewState(null, 'connecting', false);
    expect(v).toMatchObject({ view: 'loading', pauseEnabled: false, endEnabled: false });
  });

  it('3. adapter off shows the adapter-off overlay', () => {
    expect(rideViewState(testState({ adapter: 'off', ble: 'error' }), 'open', false).overlay).toBe(
      'adapter-off',
    );
  });

  it('4. a shut-off ride shows bike-shut-off', () => {
    const s = testState({
      ble: 'scanning',
      workout: testWorkout({ status: 'ended: bike shut off' }),
    });
    expect(rideViewState(s, 'open', false).overlay).toBe('bike-shut-off');
  });

  it('a plan ended and saved shows ride-complete; unsaved, nothing (L2-084)', () => {
    const ended = (change: Parameters<typeof testWorkout>[0]) =>
      testWorkout({ status: 'ended', ...change });
    expect(
      rideViewState(testState({ workout: ended({ session_id: 'abc123abc123' }) }), 'open', false)
        .overlay,
    ).toBe('ride-complete');
    expect(rideViewState(testState({ workout: ended({}) }), 'open', false).overlay).toBeNull();
  });

  it('5. a disconnected ride is bike-lost, dimmed, End enabled', () => {
    const s = testState({
      ble: 'scanning',
      workout: testWorkout({ status: 'paused: bike disconnected' }),
    });
    expect(rideViewState(s, 'open', false)).toMatchObject({
      overlay: 'bike-lost',
      dimmed: true,
      endEnabled: true,
      commandsEnabled: false,
    });
  });

  it('6. scanning shows the scanning overlay', () => {
    expect(rideViewState(testState({ ble: 'scanning' }), 'open', false).overlay).toBe('scanning');
  });

  it('7. connected with no workout: no overlay, commands on, Pause and End off', () => {
    expect(rideViewState(testState({ workout: null }), 'open', false)).toMatchObject({
      view: 'ride',
      overlay: null,
      commandsEnabled: true,
      pauseEnabled: false,
      endEnabled: false,
      controlsNote: null,
    });
  });

  it('disables commands and Pause while the stream is offline', () => {
    expect(rideViewState(testState(), 'offline', false)).toMatchObject({
      commandsEnabled: false,
      pauseEnabled: false,
      endEnabled: true,
      dimmed: true,
    });
  });

  it('notes that controls wake up when the bike is not connected', () => {
    expect(rideViewState(testState({ ble: 'connecting' }), 'open', false).controlsNote).toBe(
      'Resistance controls wake up once the bike connects.',
    );
  });

  it.each([
    ['running', true],
    ['waiting for bike', true],
    ['paused', true],
    ['ended', false],
    ['stopped', false],
  ] as const)('Pause/Resume enabled for %s: %s', (status, enabled) => {
    expect(
      rideViewState(testState({ workout: testWorkout({ status }) }), 'open', false).pauseEnabled,
    ).toBe(enabled);
  });
});
