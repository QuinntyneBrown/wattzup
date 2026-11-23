/** The kind of a plan's segment, as the segment card shows it ("Warm-up", "Work", "Recover", "Steady", "Cool-down"). */
export type SegmentKind = 'warm-up' | 'work' | 'recover' | 'steady' | 'cool-down';

/** One timed part of a plan: its kind, how long it lasts, the level it sends and the cadence it aims for. */
export interface Segment {
  readonly kind: SegmentKind;
  /** Whole seconds. */
  readonly duration: number;
  /** The target resistance, 1 to 32. */
  readonly level: number;
  /** In rpm. */
  readonly cadenceAim: number;
}

/** A class's or custom ride's segments, ridden in order from 0:00. */
export interface Plan {
  readonly segments: readonly Segment[];
}
