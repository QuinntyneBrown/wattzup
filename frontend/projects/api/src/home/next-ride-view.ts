/** The map a goal opens, as the Next ride card's reward shows it (L2-033 AC2). */
export interface NextRideReward {
  readonly name: string;
  readonly place: string;
  readonly thumbnailUrl: string;
}

/**
 * Home's Next ride card (L2-033): the map offered, its photo and tag, the goal, the map it opens (none with every map
 * open), and the rider's best there in minutes (none before a finish).
 */
export interface NextRideView {
  readonly mapId: string;
  readonly name: string;
  readonly photoUrl: string;
  /** "Old Town Criterium · 14.2 km · Easy". */
  readonly tag: string;
  readonly goal: string;
  readonly opens: NextRideReward | null;
  readonly best: string | null;
}
