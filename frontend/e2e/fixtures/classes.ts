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
