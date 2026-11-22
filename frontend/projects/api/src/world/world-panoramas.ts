import type { WorldId } from './world';

/**
 * What each world's panorama shows, for its alternative text (L2-151 AC3): `/worlds/<id>/panorama.webp`, which `main`
 * draws behind its scene. A world `main` gives no panorama has none here.
 */
export const WORLD_PANORAMAS: Readonly<Partial<Record<WorldId, string>>> = {
  docklands: 'a harbour city after dark, its bridges lit over the water',
  granite: 'a mountain pass at first light, the road climbing its north face',
  oldtown: 'cobbled streets on race day, the cathedral at the top of the climb',
  prairie: 'open farmland at golden hour, wind turbines along the road',
  dolomites: 'a valley road under limestone peaks',
  coast: 'a clifftop road at sunset, the sea on the right and headlands ahead',
};

/** The panorama's address, or `null` for a world without one. */
export function panoramaUrl(world: WorldId): string | null {
  return WORLD_PANORAMAS[world] === undefined ? null : `/worlds/${world}/panorama.webp`;
}
