// The worlds drawn as a course, a map built in Blender (ADR 0034), and where the Ride app serves each one's files:
// `<path>.glb` and `<path>.course.json` in its public folder. Every other world is drawn by `main`'s scenes. No
// Three.js here: the renderer loader reads this before it imports either renderer.
import type { WorldId } from '@telo/api';

export const COURSE_WORLDS: Readonly<Partial<Record<WorldId, string>>> = {
  etna: 'courses/etna',
  ibiza: 'courses/ibiza',
  cinqueterre: 'courses/cinqueterre',
  haleakala: 'courses/haleakala',
  prairie: 'courses/prairie',
  oldtown: 'courses/oldtown',
  coast: 'courses/coast',
  docklands: 'courses/docklands',
  dolomites: 'courses/dolomites',
  granite: 'courses/granite',
  // Vice City, a map with no world of its own on `main`, is drawn under South Beach's id (map-world.ts).
  southbeach: 'courses/vicecity',
  sellaronda: 'courses/sellaronda',
};

/** Where the world's course files are served, or null for a world `main`'s scenes draw. */
export function coursePath(world: WorldId): string | null {
  return COURSE_WORLDS[world] ?? null;
}
