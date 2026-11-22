// World Ride music: which file is a world's track, and when it plays (L2-128).
import type { WorkoutStatus, WorldId } from '@telo/api';

/** The world's own track, relative to the document's base (L2-128 AC2). */
export function worldTrack(id: WorldId): string {
  return `music/${id}.ogg`;
}

/** The track plays only while the ride runs and the rider has music on (L2-128 AC2, AC3). */
export function musicPlays(status: WorkoutStatus | null | undefined, on: boolean): boolean {
  return on && status === 'running';
}
