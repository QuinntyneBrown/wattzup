import type { SegmentKind } from '@telo/api';

/** Each kind of segment's words and its ride-kind modifier, which colours it (design-system ride-kind--*). */
export const RIDE_KINDS: Record<
  SegmentKind,
  { readonly label: string; readonly modifier: string }
> = {
  'warm-up': { label: 'Warm-up', modifier: 'warmup' },
  work: { label: 'Work', modifier: 'work' },
  recover: { label: 'Recover', modifier: 'rest' },
  steady: { label: 'Steady', modifier: 'steady' },
  'cool-down': { label: 'Cool-down', modifier: 'cooldown' },
};

/** A plan's segment as the trace draws it: its kind, its length in seconds and its target power in watts. */
export interface TraceSegment {
  readonly kind: SegmentKind;
  readonly duration: number;
  readonly target: number;
}
