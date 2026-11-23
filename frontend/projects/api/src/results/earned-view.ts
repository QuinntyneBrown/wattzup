/** One XP line as Results draws it: "Podium" and "+75". */
export interface XpLineView {
  readonly label: string;
  readonly xp: string;
}

/**
 * The XP panel on Results (L2-074): waiting while the ride is recorded, offline when it waits for a network, not
 * recorded when the backend refused it, or ready with the total ("+442") and each line in the order the backend returned.
 */
export interface XpEarnedView {
  readonly state: 'waiting' | 'offline' | 'notRecorded' | 'ready';
  readonly total: string | null;
  readonly lines: readonly XpLineView[];
}

/**
 * The gold card on Results for a map the ride opened (L2-076): "Neon Docklands is open", the place line ("A harbour city
 * after dark."), the map's photo, and "Ride Neon Docklands" to Race Setup for it.
 */
export interface UnlockCardView {
  readonly mapId: string;
  readonly title: string;
  readonly place: string;
  readonly photoUrl: string;
  readonly actionLabel: string;
  /** Race Setup for the map. */
  readonly path: string;
}

/** The stars panel on Results (L2-075): "Stars on {map}", the stars held of three, and "+1 new star" when some were earned. */
export interface MapStarsView {
  readonly title: string;
  readonly held: number;
  readonly newLine: string | null;
}
