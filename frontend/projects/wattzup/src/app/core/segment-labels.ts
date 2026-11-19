// Labels for the interval card and the app bar badge (L2-025).
import type { Segment, SegmentKind, WorkoutStatus } from '@wattzup/api';
import { formatDuration } from './format-duration';

export type Phase = 'effort' | 'easy';
export type Tone = 'work' | 'rest' | 'easy';

const LABELS: Record<SegmentKind, string> = {
  warmup: 'Warm-up',
  work: 'Work',
  rest: 'Recover',
  cooldown: 'Cool-down',
  steady: 'Steady',
};

export function kindLabel(kind: SegmentKind): string {
  return LABELS[kind];
}

export function phaseOf(kind: SegmentKind): Phase {
  return kind === 'work' || kind === 'steady' ? 'effort' : 'easy';
}

export function toneOf(kind: SegmentKind): Tone {
  if (kind === 'work' || kind === 'steady') return 'work';
  return kind === 'rest' ? 'rest' : 'easy';
}

/** The number of rounds in a ride: its work segments (L2-025 criterion 1). */
export function roundCount(segments: readonly Segment[]): number {
  return segments.filter((s) => s.kind === 'work').length;
}

export function roundLabel(segment: Segment, segments: readonly Segment[]): string | null {
  if (segment.kind !== 'work' && segment.kind !== 'rest') return null;
  return `Round ${segment.round} of ${roundCount(segments)}`;
}

export interface NextLabel {
  kind: string;
  duration: string;
  level: number;
}

export function nextLabel(segments: readonly Segment[], index: number): NextLabel | null {
  const next = segments[index + 1];
  if (!next) return null;
  return {
    kind: kindLabel(next.kind),
    duration: formatDuration(next.duration),
    level: next.level,
  };
}

const BADGES: Record<WorkoutStatus, string | null> = {
  running: null,
  paused: 'Paused',
  'waiting for bike': 'Waiting for bike',
  'paused: bike disconnected': 'Bike disconnected',
  ended: 'Ended',
  stopped: 'Ended',
  'ended: bike shut off': 'Bike shut off',
};

export function statusBadge(status: WorkoutStatus): string | null {
  return BADGES[status];
}
