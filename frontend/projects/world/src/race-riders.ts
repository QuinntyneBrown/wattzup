// The race's other riders on the road (L2-064 AC3): the bots, the ghost or riders online, at their places, each on a
// line of their own across the road. Built new on `main`'s pacers (pacers.ts), in their style (ADR 0030).
import type { SceneRider } from '@telo/api';

/** A race rider drawn in the scene. */
export interface RiderOnRoad {
  readonly jersey: string;
  /** Metres ahead of the rider; negative is behind. */
  readonly metres: number;
  /** Metres right of the road's centre line; negative is left. The rider rides on 0. */
  readonly lane: number;
}

/** The ghost's line: beside the rider, since it rides the rider's own best and is often level with them. */
const GHOST_LANE = 1.2;
/** The riders' lines across the road by their order in the field: clear of the rider and of each other. */
const LANES = [1.5, -0.9, 1.1, -1.7, 2.0, -1.3, 0.6, -2.1, 1.9, -0.6, 2.3, -1.9];
/** A rider alongside is still drawn; one further behind is out of the chase camera's view, as `main`'s pacers. */
const ALONGSIDE = -4;

/** The riders from 4 m behind to `far` metres ahead, from furthest ahead, each on its line (L2-064 AC3). */
export function ridersOnRoad(riders: readonly SceneRider[], far: number): RiderOnRoad[] {
  return riders
    .map((rider, order) => ({
      jersey: rider.jersey,
      metres: rider.metres,
      lane: rider.jersey === 'ghost' ? GHOST_LANE : LANES[order % LANES.length]!,
    }))
    .filter((rider) => rider.metres >= ALONGSIDE && rider.metres <= far)
    .sort((a, b) => b.metres - a.metres);
}
