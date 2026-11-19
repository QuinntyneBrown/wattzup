// Stub states in the L2-014 contract. Each builder starts from a response recorded from the
// backend running with --simulate (recorded/, `npm run record:api`) and lays the mocks' cast on
// top: Echelon EX-5s mid-ride on the default 8 × 40s / 20s plan at 7:07. A cast field the
// backend does not send fails the test, so the stubs cannot drift from the contract.
import recordedRunning from './recorded/status-running.json';
import recordedStarted from './recorded/workout-started.json';
import recordedVideoStarted from './recorded/video-workout-started.json';

export type Json = Record<string, unknown>;

/** The recorded response with `cast` laid over it; throws on a field the recording lacks. */
export function fromRecording<T extends Json>(recorded: T, cast: Json, what: string): T {
  for (const key of Object.keys(cast)) {
    if (!(key in recorded)) {
      throw new Error(
        `Stub ${what} sets "${key}", which the backend does not send. Re-record with npm run record:api.`,
      );
    }
  }
  return { ...recorded, ...cast };
}

function sameShape(recorded: Json, items: Json[], what: string): Json[] {
  return items.map((item) => fromRecording(recorded, item, what));
}

const RECORDED_STATE = recordedRunning as unknown as Json;
const RECORDED_WORKOUT = recordedStarted.started as unknown as Json;
const RECORDED_SEGMENT = recordedStarted.started.segments[0] as unknown as Json;
const RECORDED_COMMAND = recordedRunning.commands[0] as unknown as Json;

export const DEFAULT_PLAN = {
  kind: 'hiit',
  video: null,
  rounds: 8,
  work_seconds: 40,
  rest_seconds: 20,
  work_level: 18,
  rest_level: 6,
  warmup: true,
  cooldown: true,
} as const;

/** The plan the setup form starts with on first use (L2-029 AC1). */
export const SETUP_DEFAULT_PLAN = {
  ...DEFAULT_PLAN,
  rounds: 18,
  work_level: 26,
  rest_level: 18,
} as const;

/** The Descending recoveries plan, as the Intervals form posts it on first use (L2-029 AC11). */
export const INTERVALS_PLAN = {
  kind: 'intervals',
  video: null,
  warmup: { seconds: 300, level: 14, cadence: 80 },
  sets: [180, 150, 120, 90, 0].map((rest_seconds, i) => ({
    rounds: i === 0 || i === 4 ? 1 : 2,
    work_seconds: 30,
    work_level: 24,
    work_cadence: 100,
    rest_seconds,
    rest_level: 8,
    rest_cadence: 72,
  })),
  cooldown: { seconds: 360, level: 6, cadence: 70 },
};

export const FLAT_PLAN = {
  kind: 'flat',
  video: null,
  level: 12,
  minutes: 30,
  cadence: 85,
} as const;

export const DEFAULT_SEGMENTS = sameShape(
  RECORDED_SEGMENT,
  [
    { kind: 'warmup', start: 0, duration: 180, level: 8, cadence: 80, round: null },
    { kind: 'work', start: 180, duration: 40, level: 18, cadence: 98, round: 1 },
    { kind: 'rest', start: 220, duration: 20, level: 6, cadence: 72, round: 1 },
    { kind: 'work', start: 240, duration: 40, level: 18, cadence: 98, round: 2 },
    { kind: 'rest', start: 280, duration: 20, level: 6, cadence: 72, round: 2 },
    { kind: 'work', start: 300, duration: 40, level: 18, cadence: 98, round: 3 },
    { kind: 'rest', start: 340, duration: 20, level: 6, cadence: 72, round: 3 },
    { kind: 'work', start: 360, duration: 40, level: 18, cadence: 98, round: 4 },
    { kind: 'rest', start: 400, duration: 20, level: 6, cadence: 72, round: 4 },
    { kind: 'work', start: 420, duration: 40, level: 18, cadence: 98, round: 5 },
    { kind: 'rest', start: 460, duration: 20, level: 6, cadence: 72, round: 5 },
    { kind: 'work', start: 480, duration: 40, level: 18, cadence: 98, round: 6 },
    { kind: 'rest', start: 520, duration: 20, level: 6, cadence: 72, round: 6 },
    { kind: 'work', start: 540, duration: 40, level: 18, cadence: 98, round: 7 },
    { kind: 'rest', start: 580, duration: 20, level: 6, cadence: 72, round: 7 },
    { kind: 'work', start: 600, duration: 40, level: 18, cadence: 98, round: 8 },
    { kind: 'cooldown', start: 640, duration: 120, level: 6, cadence: 70, round: null },
  ],
  'segment',
);

/** Default plan, work round 5 of 8, 0:33 left, 7:07 of 12:40. */
export function workout(change: Json = {}): Json {
  const cast = {
    plan: DEFAULT_PLAN,
    summary: 'HIIT · 8 × 40s / 20s',
    segments: DEFAULT_SEGMENTS,
    segment: 9,
    remaining: 33,
    elapsed_seconds: 427,
    total_seconds: 760,
    mode: 'plan',
    plan_level: 18,
    status: 'running',
    ended_reason: null,
    session_id: null,
    ...change,
  };
  return fromRecording(RECORDED_WORKOUT, cast, 'workout');
}

/** The ride-along video of a plan, as the backend reports it (L2-014). */
export const RIDE_VIDEO = recordedVideoStarted.started.plan.video;

/** The default plan with the GCN video synced from 0:12.0 (L2-076). */
export function videoWorkout(change: Json = {}): Json {
  return workout({ plan: { ...DEFAULT_PLAN, video: RIDE_VIDEO }, ...change });
}

export function flatWorkout(change: Json = {}): Json {
  return workout({
    plan: FLAT_PLAN,
    summary: 'Flat · Level 12 · 30 min',
    segments: [
      {
        kind: 'steady',
        start: 0,
        duration: 1800,
        level: 12,
        cadence: 85,
        round: null,
      },
    ],
    segment: 0,
    remaining: 938,
    elapsed_seconds: 862,
    total_seconds: 1800,
    plan_level: 12,
    ...change,
  });
}

/** Today in the mocks is 2026-11-15, about 7:10 PM (UTC in the tests). */
export const NOW = Date.UTC(2026, 10, 15, 19, 10, 12);
export const NOW_S = NOW / 1000;

export function state(change: Json = {}): Json {
  const cast = {
    ble: 'connected',
    device: 'ECHEX-3-141844',
    device_label: 'Echelon EX-5s',
    error: null,
    resistance: 18,
    target_resistance: 18,
    workout: workout(),
    cadence: 95,
    speed_kmh: 25.1,
    speed_mph: 15.6,
    packets: 2517,
    first_data_at: NOW_S - 2700,
    last_data_at: NOW_S,
    ui_clients: 2,
    displayed_since: NOW_S - 2490,
    displayed_seconds: 2490,
    adapter: 'on',
    transport: 'Simulated',
    simulated: false,
    exposed: false,
    bind_address: '127.0.0.1:8787',
    connection_id: '0bf669f1',
    power: 317,
    target_power: 327,
    avg_power: 208,
    distance_km: 2.53,
    kcal: 89,
    heart_rate: null,
    commands: sameShape(
      RECORDED_COMMAND,
      [
        {
          at: NOW_S - 6,
          ride_seconds: 421,
          level: 18,
          source: 'plan',
          status: 'ack',
          ack_ms: 40,
        },
        {
          at: NOW_S - 27,
          ride_seconds: 400,
          level: 6,
          source: 'plan',
          status: 'ack',
          ack_ms: 34,
        },
        {
          at: NOW_S - 67,
          ride_seconds: 360,
          level: 18,
          source: 'plan',
          status: 'ack',
          ack_ms: 41,
        },
      ],
      'command',
    ),
    ...change,
  };
  return fromRecording(RECORDED_STATE, cast, 'state');
}

/** Connected with no workout: a free ride. */
export function freeRide(change: Json = {}): Json {
  return state({
    workout: null,
    resistance: 8,
    target_resistance: 8,
    cadence: 72,
    power: 96,
    target_power: null,
    avg_power: 0,
    distance_km: 0,
    kcal: 0,
    speed_kmh: 0,
    speed_mph: 0,
    commands: [],
    ...change,
  });
}

/** The backend's initial state (L2-014 AC1). */
export function startingState(change: Json = {}): Json {
  return state({
    ble: 'starting',
    device: null,
    device_label: null,
    resistance: null,
    target_resistance: null,
    workout: null,
    cadence: null,
    speed_kmh: null,
    speed_mph: null,
    packets: 0,
    first_data_at: null,
    last_data_at: null,
    ui_clients: 0,
    displayed_since: null,
    displayed_seconds: 0,
    adapter: 'unknown',
    power: null,
    target_power: null,
    avg_power: null,
    distance_km: null,
    kcal: null,
    commands: [],
    ...change,
  });
}
