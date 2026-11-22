// Unit test
// Traces to: L2-122 AC1, AC2; L2-086 AC3; L2-082
// Description: the hub answers every join; a seat becomes the rider's seat assignment, and a refusal a RideHubError
// with its code and the session offered instead. A code the app does not know reads as session_not_found.
import { RideHubError, seatFrom } from './join-class-session';

const next = { id: 'hiit-cardio-30@20261121T2000Z', startsAt: '2026-11-21T20:00:00+00:00' };

describe('seatFrom', () => {
  it('takes a seat as the rider’s seat assignment', () => {
    expect(
      seatFrom({
        code: null,
        sessionId: 'hiit-cardio-30@20261121T1945Z',
        startsAt: '2026-11-21T19:45:00+00:00',
        jersey: 'lena',
        next: null,
      }),
    ).toEqual({
      sessionId: 'hiit-cardio-30@20261121T1945Z',
      startsAt: '2026-11-21T19:45:00+00:00',
      jersey: 'lena',
    });
  });

  it.each([
    ['session_full', next],
    ['session_started', next],
    ['class_locked', null],
    ['session_not_found', null],
  ] as const)('refuses %s with the session it offers', (code, offered) => {
    const refusal = () =>
      seatFrom({
        code,
        sessionId: 'hiit-cardio-30@20261121T1945Z',
        startsAt: null,
        jersey: null,
        next: offered,
      });

    expect(refusal).toThrow(RideHubError);
    try {
      refusal();
    } catch (error) {
      expect(error).toMatchObject({ code, next: offered });
    }
  });

  it('reads a code it does not know as session_not_found', () => {
    expect(() =>
      seatFrom({ code: 'session_moved', sessionId: 's', startsAt: null, jersey: null, next: null }),
    ).toThrow(expect.objectContaining({ code: 'session_not_found' }));
  });
});
