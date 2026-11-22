// Unit test
// Traces to: L2-083 AC2
// Description: a card's group chip reads the whole minutes to the next session's start, rounded up so the last minute
// reads 1, and the seats taken of the seats there are.
import type { NextGroupSessionDto } from '@telo/api';
import { groupChip } from './group-chip';

const NOW = Date.parse('2026-11-21T19:30:00Z');
const next = (startsAt: string, seatsTaken: number): NextGroupSessionDto => ({
  classId: 'hiit-cardio-30',
  sessionId: 'hiit-cardio-30@x',
  startsAt,
  seatsTaken,
  capacity: 10,
});

describe('groupChip', () => {
  it.each([
    ['2026-11-21T19:39:00Z', 6, 'Group in 9 min · 6/10'],
    ['2026-11-21T19:38:30Z', 0, 'Group in 9 min · 0/10'],
    ['2026-11-21T19:30:20Z', 9, 'Group in 1 min · 9/10'],
    ['2026-11-21T19:45:00Z', 10, 'Group in 15 min · 10/10'],
  ])('reads a session at %s with %i seats taken as "%s"', (startsAt, seats, chip) => {
    expect(groupChip(next(startsAt, seats), NOW)).toBe(chip);
  });
});
