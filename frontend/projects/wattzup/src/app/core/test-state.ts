// Builders for unit tests: a full L2-014 state, mid-ride on the default plan.
import type { BikeState, IntervalsPlan, WorkoutSnapshot } from '@wattzup/api';
import { expandPlan } from './plan-expansion';

export function testWorkout(change: Partial<WorkoutSnapshot> = {}): WorkoutSnapshot {
  const plan = {
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
  return {
    plan,
    summary: 'HIIT · 8 × 40s / 20s',
    segments: expandPlan(plan),
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
}

export function testState(change: Partial<BikeState> = {}): BikeState {
  return {
    ble: 'connected',
    device: 'ECHEX-3-141844',
    device_label: 'Echelon EX-5s',
    error: null,
    resistance: 18,
    target_resistance: 18,
    workout: testWorkout(),
    cadence: 95,
    speed_kmh: 25.1,
    speed_mph: 15.6,
    packets: 2517,
    first_data_at: 1794785000,
    last_data_at: 1794787812,
    ui_clients: 1,
    displayed_since: 1794785322,
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
    commands: [],
    ...change,
  };
}

/** The Descending recoveries plan (L2-010 criterion 11): 30:00, 8 efforts in 5 sets. */
export function testIntervalsPlan(): IntervalsPlan {
  return {
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
}
