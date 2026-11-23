import type { SegmentKind } from '../workout/plan';

/** How the road reads at the rider's place: downhill, flat, a climb or a steep climb (block race-route). */
export type GradeTone = 'down' | 'flat' | 'climb' | 'steep';

/** One rectangle of the segment strip under the terrain, in seconds of the plan. */
export interface RouteStripBar {
  readonly x: number;
  readonly width: number;
  readonly kind: SegmentKind;
}

/**
 * What the race's route panel draws at one second (L2-062): the grade ("+0.5%") and its tone, the metres climbed, the
 * profile's description, and the profile itself in a viewBox one unit per second wide and 100 high, with the part
 * ridden, the segment strip and the rider's place.
 */
export interface RouteProfileView {
  readonly gradeText: string;
  readonly gradeTone: GradeTone;
  readonly climbedText: string;
  readonly label: string;
  readonly width: number;
  readonly area: string;
  readonly doneWidth: number;
  readonly strip: readonly RouteStripBar[];
  readonly playhead: { readonly x: number; readonly y: number };
}
