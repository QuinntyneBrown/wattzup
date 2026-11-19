import { describe, expect, it } from 'vitest';
import { rideOverlayText } from './ride-overlay-text';
import { testState, testWorkout } from './test-state';

describe('rideOverlayText', () => {
  it('adds the waiting ride while scanning', () => {
    const o = rideOverlayText(
      'scanning',
      testState({ ble: 'scanning', workout: testWorkout({ status: 'waiting for bike' }) }),
    );
    expect(o.lines).toHaveLength(2);
    expect(o.lines[1]).toMatch(/^Your ride starts as soon as the bike connects: /);
  });

  it('names the bike and the saved time when the bike is lost', () => {
    const o = rideOverlayText(
      'bike-lost',
      testState({ device_label: 'Echelon EX-5s', workout: testWorkout({ elapsed_seconds: 427 }) }),
    );
    expect(o.lines[0]).toBe(
      'Echelon EX-5s stopped answering. Wake it with a pedal stroke, then reconnect — your ride is saved at 7:07.',
    );
    expect(o.role).toBe('alert');
  });

  it('says when the ride ended after the bike shut off', () => {
    const o = rideOverlayText(
      'bike-shut-off',
      testState({ device_label: 'Echelon EX-5s', workout: testWorkout({ elapsed_seconds: 582 }) }),
    );
    expect(o.lines[0]).toContain('ended the workout at 9:42');
    expect(o.sessionId).toBeNull();
  });

  it('offers the saved ride: Ride complete with the summary and total (L2-084)', () => {
    const s = testState({
      workout: testWorkout({
        status: 'ended',
        summary: 'HIIT · 8 × 40s / 20s',
        total_seconds: 760,
        session_id: 'abc123abc123',
      }),
    });
    const o = rideOverlayText('ride-complete', s);
    expect(o).toMatchObject({ title: 'Ride complete', role: 'status', sessionId: 'abc123abc123' });
    expect(o.lines).toEqual(['HIIT · 8 × 40s / 20s · 12:40. Your ride is saved.']);
    expect(rideOverlayText('bike-shut-off', s).sessionId).toBe('abc123abc123');
  });
});
