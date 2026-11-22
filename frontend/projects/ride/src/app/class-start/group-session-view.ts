import type { ClassSessionDto, SessionRiderDto } from '@telo/api';

/** What Class Start says of the next group session (docs/detailed-designs/classes/start-a-class). */
export interface GroupSessionView {
  /** The group option's text: "7:39 PM · starts in 9 min · 6 of 10 riders", or the full session's. */
  readonly optionBody: string;
  /** "Join · starts in 9 min", "Join now · starting" or "Join the next session". */
  readonly joinLabel: string;
  /** The session Join opens. */
  readonly sessionId: string;
  /** Whether the next session is full, so the one after it is offered. */
  readonly full: boolean;
  /** "Riding in this session": the next session's riders; none when it is full. */
  readonly riders: readonly SessionRiderDto[];
  /** "7:54 PM · 2 of 10 riders so far", the session offered after a full one. */
  readonly next: string | null;
}

/** The rider's local time, "7:39 PM". */
const LOCAL_TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/**
 * The next session's words (L2-085 AC1–AC3, L2-086 AC1, AC2): its start, the whole minutes left rounded up, so the last
 * minute reads "1 min" and Join reads "Join now · starting", and its seats. A full session offers the one after it.
 * `null` when there is no session to offer, and the group cannot be chosen.
 */
export function groupSessionView(
  sessions: readonly ClassSessionDto[],
  now: number,
  time: Intl.DateTimeFormat = LOCAL_TIME,
): GroupSessionView | null {
  const [first, second] = sessions;
  if (first === undefined) return null;
  const at = (session: ClassSessionDto) => time.format(new Date(session.startsAt));
  if (first.full) {
    if (second === undefined) return null;
    return {
      optionBody: 'This session is full. Next one starts 15 minutes later.',
      joinLabel: 'Join the next session',
      sessionId: second.id,
      full: true,
      riders: [],
      next: `${at(second)} · ${second.seatsTaken} of ${second.capacity} riders so far`,
    };
  }
  const left = Date.parse(first.startsAt) - now;
  const minutes = Math.max(1, Math.ceil(left / 60_000));
  return {
    optionBody: `${at(first)} · starts in ${minutes} min · ${first.seatsTaken} of ${first.capacity} riders`,
    joinLabel: left <= 60_000 ? 'Join now · starting' : `Join · starts in ${minutes} min`,
    sessionId: first.id,
    full: false,
    riders: first.riders,
    next: null,
  };
}
