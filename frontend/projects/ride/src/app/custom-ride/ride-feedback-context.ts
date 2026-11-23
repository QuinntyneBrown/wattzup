import type { FeedbackContext, SegmentKind, SentCommand } from '@telo/api';
import { RIDE_KINDS } from '@telo/components';
import { commandLabel } from '@telo/domain';

/** Where a custom ride is when Feedback opens. */
export type RideFeedbackState = 'not-started' | 'riding' | 'paused' | 'finished';

/** The ride's state as the store reads it when the rider presses Feedback, before the ride pauses. */
export interface RideFeedbackInput {
  readonly workout: string;
  /** "6:52", and the ride's length, "30:00". */
  readonly elapsed: string;
  readonly total: string;
  /** The segment and its whole seconds left; none before the plan starts. */
  readonly segment: { readonly kind: SegmentKind; readonly left: number } | null;
  readonly resistance: number | null;
  readonly planLevel: number | null;
  /** The readouts as the screen writes them: "73", or "—" without a value. */
  readonly cadence: string;
  readonly aim: number | null;
  readonly power: string;
  readonly target: number | null;
  readonly heartRate: string;
  /** "2.24 km". */
  readonly distance: string;
  readonly state: RideFeedbackState;
  readonly view: 'video' | 'chart';
  readonly machine: string | null;
  /** The bike status's words: "Connected", "Reconnecting", "No bike connected". */
  readonly bluetooth: string;
  readonly last: SentCommand | null;
}

const STATES: Record<RideFeedbackState, string> = {
  'not-started': 'Not started',
  riding: 'Riding',
  paused: 'Paused',
  finished: 'Finished',
};

const clock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const withTarget = (
  value: string,
  unit: string,
  target: number | null,
  targetUnit = unit,
): string =>
  `${value}${value === '—' ? '' : ` ${unit}`}${target === null ? '' : ` · target ${target}${targetUnit}`}`;

/**
 * What Send feedback attaches from a custom ride (L2-117 AC2): a summary, "HIIT · 8 × 0:30 · Recover · 6:52 in", and
 * the ride's workout, elapsed time, segment, resistance, plan level, cadence, power, heart rate, distance, state, view,
 * machine, Bluetooth and last command, each as text.
 */
export function rideFeedbackContext(input: RideFeedbackInput): FeedbackContext {
  const segment = input.segment ? RIDE_KINDS[input.segment.kind].label : null;
  const level = (value: number | null): string => (value === null ? '—' : `L${value}`);
  return {
    screen: 'Ride',
    summary: [input.workout, segment, `${input.elapsed} in`].filter(Boolean).join(' · '),
    facts: [
      { term: 'Workout', value: input.workout },
      { term: 'Elapsed', value: `${input.elapsed} / ${input.total}` },
      {
        term: 'Segment',
        value: input.segment ? `${segment} · ${clock(input.segment.left)} left` : '—',
      },
      { term: 'Resistance', value: level(input.resistance) },
      { term: 'Plan level', value: level(input.planLevel) },
      { term: 'Cadence', value: withTarget(input.cadence, 'rpm', input.aim, '') },
      { term: 'Power', value: withTarget(input.power, 'W', input.target, ' W') },
      { term: 'Heart rate', value: input.heartRate === '—' ? '—' : `${input.heartRate} bpm` },
      { term: 'Distance', value: input.distance },
      { term: 'Ride state', value: STATES[input.state] },
      { term: 'View', value: input.view === 'video' ? 'Video' : 'Power vs. plan' },
      { term: 'Machine', value: input.machine ?? 'None' },
      { term: 'Bluetooth', value: input.bluetooth },
      { term: 'Last command', value: input.last ? commandLabel(input.last) : 'None sent yet' },
    ],
  };
}
