// The world a map's race draws (L2-064). A map names its world as `main`'s worlds do; Vice City, a Telo Ride map
// with no world of its own on `main`, rides South Beach's, whose terrain its catalogue entry already takes.
import type { World, WorldId } from '@telo/api';
import { WORLDS, worldById } from './worlds';

/** Telo Ride's map worlds that `main` draws under another world's id. */
const DRAWN_AS: Readonly<Record<string, WorldId>> = { vicecity: 'southbeach' };

/** The world drawn for a map's `world`. */
export function worldForMap(world: string): World {
  const id = DRAWN_AS[world] ?? world;
  if (!WORLDS.some((w) => w.id === id)) throw new Error(`Unknown world ${world}`);
  return worldById(id as WorldId);
}
