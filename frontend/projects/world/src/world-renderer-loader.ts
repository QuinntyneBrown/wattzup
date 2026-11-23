import type { WorldRenderer } from '@telo/api';
import { MapRenderer } from './map-renderer';

/**
 * The renderer for whichever world the scene starts: it imports Three.js on demand, with `main`'s scenes or a
 * course's map, so both stay in the World Ride chunks (ADR 0020, ADR 0034).
 */
export function loadWorldRenderer(): Promise<WorldRenderer> {
  return Promise.resolve(new MapRenderer());
}
