import type { MapDto } from '@telo/api';

/** The unlocked banner's words (L2-036 AC1). */
export interface UnlockBannerView {
  readonly mapId: string;
  /** "Neon Docklands is open." */
  readonly title: string;
  /** "A harbour city after dark, 21.6 km." */
  readonly detail: string;
}

/** The banner for the map a ride opened, or nothing while the catalogue does not hold it. */
export function unlockBannerView(mapId: string, maps: readonly MapDto[]): UnlockBannerView | null {
  const map = maps.find((candidate) => candidate.id === mapId);
  return map
    ? {
        mapId: map.id,
        title: `${map.name} is open.`,
        detail: `${map.place}, ${map.distanceKm} km.`,
      }
    : null;
}
