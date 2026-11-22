// Unit test
// Traces to: L2-083 AC2; L2-085 AC1, AC2, AC3; L2-086 AC1, AC2
// Description: the group option and Join read the next session: its start, the whole minutes left (rounded up, so the
// last minute reads 1) and its seats; within a minute Join reads "Join now · starting"; a full session offers the one
// after it. No session to offer means the group cannot be chosen.
import type { ClassSessionDto } from '@telo/api';
import { groupSessionView as viewIn } from './group-session-view';

/** The views of these specs, read in UTC whatever the machine's time zone. */
const UTC = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
});
const groupSessionView = (sessions: readonly ClassSessionDto[], now: number) =>
  viewIn(sessions, now, UTC);

const NOW = Date.parse('2026-11-21T19:30:00Z');
const riders = [
  { displayName: 'lena.k', jersey: 'lena' },
  { displayName: 'MarcoVelo', jersey: 'marco' },
];

function session(startsAt: string, seatsTaken: number, full = false): ClassSessionDto {
  return {
    id: `s@${startsAt}`,
    startsAt,
    seatsTaken,
    capacity: 10,
    full,
    riders: riders.slice(0, Math.min(seatsTaken, 2)),
  };
}

describe('groupSessionView', () => {
  it('offers the next session with its start, the minutes left and its riders', () => {
    const view = groupSessionView(
      [session('2026-11-21T19:39:00Z', 6), session('2026-11-21T19:54:00Z', 2)],
      NOW,
    );

    expect(view).toEqual({
      optionBody: '7:39 PM · starts in 9 min · 6 of 10 riders',
      joinLabel: 'Join · starts in 9 min',
      sessionId: 's@2026-11-21T19:39:00Z',
      full: false,
      riders,
      next: null,
    });
  });

  it('rounds the minutes up, so 8 min 30 s reads 9', () => {
    expect(groupSessionView([session('2026-11-21T19:38:30Z', 1)], NOW)?.joinLabel).toBe(
      'Join · starts in 9 min',
    );
  });

  it.each([
    ['2026-11-21T19:31:00Z', '7:31 PM · starts in 1 min · 3 of 10 riders'],
    ['2026-11-21T19:30:05Z', '7:30 PM · starts in 1 min · 3 of 10 riders'],
  ])('reads a session at %s as starting, with Join now', (startsAt, body) => {
    const view = groupSessionView([session(startsAt, 3)], NOW);

    expect(view?.optionBody).toBe(body);
    expect(view?.joinLabel).toBe('Join now · starting');
  });

  it('offers the session after a full one, 15 minutes later', () => {
    const view = groupSessionView(
      [session('2026-11-21T19:39:00Z', 10, true), session('2026-11-21T19:54:00Z', 2)],
      NOW,
    );

    expect(view).toEqual({
      optionBody: 'This session is full. Next one starts 15 minutes later.',
      joinLabel: 'Join the next session',
      sessionId: 's@2026-11-21T19:54:00Z',
      full: true,
      riders: [],
      next: '7:54 PM · 2 of 10 riders so far',
    });
  });

  it('counts one rider of ten', () => {
    expect(groupSessionView([session('2026-11-21T19:39:00Z', 1)], NOW)?.optionBody).toBe(
      '7:39 PM · starts in 9 min · 1 of 10 riders',
    );
  });

  it.each([
    ['no session', []],
    ['a full session with none after it', [session('2026-11-21T19:39:00Z', 10, true)]],
  ])('has nothing to offer with %s', (_, sessions) => {
    expect(groupSessionView(sessions as ClassSessionDto[], NOW)).toBeNull();
  });
});
