/** A plan's segment as the backend sends it. */
interface Segment {
  kind: 'warm-up' | 'work' | 'recover' | 'steady' | 'cool-down';
  duration: number;
  level: number;
  cadenceAim: number;
}

const work: Segment = { kind: 'work', duration: 30, level: 24, cadenceAim: 100 };
const recover = (duration: number): Segment => ({
  kind: 'recover',
  duration,
  level: 6,
  cadenceAim: 72,
});

/**
 * 30 Minute HIIT Cardio as the catalogue serves it (L2-080): eight 30-second efforts with a recovery that shrinks each
 * round, between a 5-minute warm-up and a 6-minute cool-down, as the mock's plan profile draws it.
 */
export const hiitCardio = {
  id: 'hiit-cardio-30',
  title: '30 Minute HIIT Cardio',
  channel: 'GCN Training',
  focus: 'HIIT',
  lengthSeconds: 1800,
  opensAtLevel: 1,
  shelfId: '30-min',
  summary: 'Eight 30-second maximal efforts with a recovery that shrinks each round. The classic.',
  world: 'oldtown',
  video: { videoId: 'QUoToFsMNig', syncOffsetSeconds: 12 },
  plan: {
    segments: [
      { kind: 'warm-up', duration: 300, level: 8, cadenceAim: 80 },
      ...[180, 150, 150, 120, 120, 90, 90].flatMap((rest) => [work, recover(rest)]),
      work,
      { kind: 'cool-down', duration: 360, level: 6, cadenceAim: 68 },
    ] satisfies Segment[],
  },
};

/** A three-hour endurance class: a 10-minute warm-up, 160 minutes steady and a 10-minute cool-down. */
export const enduranceClass = {
  ...hiitCardio,
  id: 'endurance-180',
  title: '3 Hour Endurance Ride',
  focus: 'Endurance',
  lengthSeconds: 10_800,
  summary: 'Three hours at a steady, sustainable effort.',
  plan: {
    segments: [
      { kind: 'warm-up', duration: 600, level: 8, cadenceAim: 80 },
      { kind: 'steady', duration: 9_600, level: 14, cadenceAim: 85 },
      { kind: 'cool-down', duration: 600, level: 6, cadenceAim: 70 },
    ],
  },
};

/** The catalogue as `GET /api/classes` answers it: the 30-minute shelf with 30 Minute HIIT Cardio on it. */
export const catalogue = {
  shelves: [
    { id: '30-min', title: '30 min', tagline: 'Structured intervals with a proper warm-up.' },
  ],
  classes: [hiitCardio],
};

/** A rider seated in a group session, as `GET /api/classes/{id}/sessions` lists them. */
export interface SessionRider {
  readonly displayName: string;
  readonly jersey: string;
}

/** The six riders of the mocks' 7:39 PM session (docs/mocks/pages/class-start/default.html). */
export const sixRiders: readonly SessionRider[] = [
  { displayName: 'lena.k', jersey: 'lena' },
  { displayName: 'MarcoVelo', jersey: 'marco' },
  { displayName: 'priya_spins', jersey: 'priya' },
  { displayName: 'jwatts', jersey: 'jwatts' },
  { displayName: 'Ollie R.', jersey: 'ollie' },
  { displayName: 'kenji.cyc', jersey: 'kenji' },
];

/** One group session of 30 Minute HIIT Cardio starting at `startsAt` (ISO, UTC), with these riders seated. */
export function hiitSession(startsAt: string, riders: readonly SessionRider[], full = false) {
  const start = new Date(startsAt);
  const stamp = start.toISOString().replace(/[-:]/g, '').slice(0, 13);
  return {
    id: `hiit-cardio-30@${stamp}Z`,
    startsAt: start.toISOString(),
    seatsTaken: full ? 10 : riders.length,
    capacity: 10,
    full,
    riders,
  };
}

/** The clock of the group-session specs: 7:30 PM, with the mocks' next session at 7:39 and the one after at 7:54. */
export const SESSIONS_NOW = new Date('2026-11-21T19:30:00Z').getTime();

/** HIIT's next two sessions as the mocks show them: 7:39 PM with six riders, then 7:54 PM with two. */
export const hiitSessions = [
  hiitSession('2026-11-21T19:39:00Z', sixRiders),
  hiitSession('2026-11-21T19:54:00Z', sixRiders.slice(0, 2)),
];

/** The hub's answer to JoinClassSession when the rider takes a seat in the session. */
export function seated(
  session: { readonly id: string; readonly startsAt: string },
  jersey = 'lena',
) {
  return { code: null, sessionId: session.id, startsAt: session.startsAt, jersey, next: null };
}

/** One rider on a group session's board, as the hub sends it in StandingsUpdated (L2-123 AC3). */
export interface StandingRow {
  readonly position: number;
  readonly name: string;
  readonly jersey: string;
  readonly level: number | null;
  readonly kind: 'person' | 'bot';
  readonly outputKj: number;
  readonly gapKj: number;
}

/** Ranks `[name, jersey, kJ]` riders as the hub does: by output, highest first, with each gap to the leader. */
export function standings(
  session: { readonly id: string },
  riders: readonly (readonly [string, string, number])[],
) {
  const ranked = [...riders].sort((a, b) => b[2] - a[2]);
  const rows: StandingRow[] = ranked.map(([name, jersey, outputKj], i) => ({
    position: i + 1,
    name,
    jersey,
    level: name.startsWith('Pacer ') ? null : 4,
    kind: name.startsWith('Pacer ') ? 'bot' : 'person',
    outputKj,
    gapKj: Math.round((ranked[0]![2] - outputKj) * 1000) / 1000,
  }));
  return { sessionId: session.id, rows };
}

/** The board of the Class Ride mock at 7:00: nine riders, the rider ("lena.k", seat jersey lena) fifth on 65 kJ. */
export const boardAtSeven: readonly (readonly [string, string, number])[] = [
  ['kenji.cyc', 'kenji', 73.2],
  ['Pacer Nova', 'nova', 68.4],
  ['Ollie R.', 'ollie', 67.3],
  ['ana_rides', 'ana', 66.9],
  ['lena.k', 'lena', 65.1],
  ['jwatts', 'jwatts', 63.0],
  ['priya_spins', 'priya', 62.2],
  ['MarcoVelo', 'marco', 50.4],
  ['Pacer Rook', 'rook', 49.8],
];

/** The hub's answer to JoinClassSession when it refuses (session_full, session_started), with the session it offers. */
export function refused(
  code: string,
  session: { readonly id: string; readonly startsAt: string },
  next: { readonly id: string; readonly startsAt: string },
) {
  return {
    code,
    sessionId: session.id,
    startsAt: session.startsAt,
    jersey: null,
    next: { id: next.id, startsAt: next.startsAt },
  };
}
