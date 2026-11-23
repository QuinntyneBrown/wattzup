// Where a course's street lamps throw their light, seen from above (L2-166 AC14): a grid over the whole map, worked
// out once on the device from the road's centre line and the course file's lamps. Each cell holds the lamps' light
// at ground level and the road's height there. Whatever stands near the road (walls, posts, the land, the riders)
// reads it by where it is, so nine hundred lamps cost a frame one texture read and no lights. No Three.js here.
import type { Course, CourseLamps, CourseLight } from './course';

/** Metres a cell, the room kept beyond the road, and how far a lamp's light and the road's height reach. */
const CELL = 2.5;
const MARGIN = 48;
const LIGHT_REACH = 20;
const GROUND_REACH = 40;
/** The brightest light the grid can hold, where pools overlap: a lone lamp is 1 straight beneath it. */
export const LAMP_LIGHT_MAX = 2;

/** The grid: two bytes a cell, the light (its square root, of `LAMP_LIGHT_MAX`) and the ground's height. */
export interface LampLightMap {
  readonly texels: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly cell: number;
  /** The map's corner, in the glb's axes. */
  readonly minX: number;
  readonly minZ: number;
  /** The ground's height is `minY + byte / 255 * spanY`. */
  readonly minY: number;
  readonly spanY: number;
}

/** The grid for a course and its lamps. */
export function lampLightMap(course: Course, lamps: CourseLamps): LampLightMap {
  const { points, step, startIndex } = course.file;
  const count = points.length / 3;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < count; i++) {
    minX = Math.min(minX, points[i * 3]!);
    maxX = Math.max(maxX, points[i * 3]!);
    minY = Math.min(minY, points[i * 3 + 1]!);
    maxY = Math.max(maxY, points[i * 3 + 1]!);
    minZ = Math.min(minZ, points[i * 3 + 2]!);
    maxZ = Math.max(maxZ, points[i * 3 + 2]!);
  }
  minX -= MARGIN;
  minZ -= MARGIN;
  const width = Math.ceil((maxX + MARGIN - minX) / CELL);
  const height = Math.ceil((maxZ + MARGIN - minZ) / CELL);
  const spanY = Math.max(maxY - minY, 1);
  const light = new Float32Array(width * height);
  const ground = new Float32Array(width * height);
  const nearest = new Float32Array(width * height).fill(Infinity);

  /** Calls `visit` with each cell whose centre is within `reach` metres of a place, and its distance squared. */
  const around = (
    x: number,
    z: number,
    reach: number,
    visit: (cell: number, d2: number) => void,
  ) => {
    const x0 = Math.max(Math.floor((x - reach - minX) / CELL), 0);
    const x1 = Math.min(Math.ceil((x + reach - minX) / CELL), width - 1);
    const z0 = Math.max(Math.floor((z - reach - minZ) / CELL), 0);
    const z1 = Math.min(Math.ceil((z + reach - minZ) / CELL), height - 1);
    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) {
        const dx = minX + (cx + 0.5) * CELL - x;
        const dz = minZ + (cz + 0.5) * CELL - z;
        const d2 = dx * dx + dz * dz;
        if (d2 <= reach * reach) visit(cz * width + cx, d2);
      }
    }
  };

  // The road's height, for every cell near it: the nearest point of the centre line decides.
  for (let i = 0; i < count; i++) {
    const y = points[i * 3 + 1]!;
    around(points[i * 3]!, points[i * 3 + 2]!, GROUND_REACH, (cell, d2) => {
      if (d2 < nearest[cell]!) {
        nearest[cell] = d2;
        ground[cell] = y;
      }
    });
  }

  // Each lamp's pool: the fall-off the ground's own material uses (ground-material.ts).
  const h2 = lamps.height * lamps.height;
  const from = -startIndex * step;
  const first = lamps.first + Math.ceil((from - lamps.first) / lamps.every) * lamps.every;
  const place = { x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
  for (let metres = first; metres <= course.end; metres += lamps.every) {
    for (const lane of [lamps.across, -lamps.across]) {
      course.place(metres, lane, place);
      around(place.x, place.z, LIGHT_REACH, (cell, d2) => {
        const fall = h2 / (h2 + d2);
        light[cell] = light[cell]! + fall * fall;
      });
    }
  }

  const texels = new Uint8Array(width * height * 2);
  for (let i = 0; i < light.length; i++) {
    texels[i * 2] = Math.round(Math.sqrt(Math.min(light[i]! / LAMP_LIGHT_MAX, 1)) * 255);
    texels[i * 2 + 1] = Math.round(((ground[i]! - minY) / spanY) * 255);
  }
  return { texels, width, height, cell: CELL, minX, minZ, minY, spanY };
}

/** The lamps' light on the ground at a place (a lone lamp gives 1 beneath it) and the road's height there. */
export function lampLightAt(
  map: LampLightMap,
  x: number,
  z: number,
): { light: number; ground: number } {
  const cx = Math.floor((x - map.minX) / map.cell);
  const cz = Math.floor((z - map.minZ) / map.cell);
  if (cx < 0 || cz < 0 || cx >= map.width || cz >= map.height) {
    return { light: 0, ground: map.minY };
  }
  const at = (cz * map.width + cx) * 2;
  const root = map.texels[at]! / 255;
  return {
    light: root * root * LAMP_LIGHT_MAX,
    ground: map.minY + (map.texels[at + 1]! / 255) * map.spanY,
  };
}

/** Metres a cell of the coloured lights' grid: their pools are broad. */
const COLOUR_CELL = 4;
/** The brightest a channel of the coloured grid can hold, where pools overlap. */
export const COLOUR_LIGHT_MAX = 1.5;

/** The coloured lights' grid: four bytes a cell, the light's red, green and blue (their square roots) and a spare. */
export interface ColourLightMap {
  readonly texels: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly cell: number;
  readonly minX: number;
  readonly minZ: number;
}

/**
 * Where a course's coloured lights (course.ts, `courseLights`) throw their light, seen from above: each light's
 * colour, strongest beneath it and gone at its reach, summed where pools overlap. It covers the same ground as the
 * lamps' grid.
 */
export function colourLightMap(course: Course, lights: readonly CourseLight[]): ColourLightMap {
  const { points } = course.file;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < points.length; i += 3) {
    minX = Math.min(minX, points[i]!);
    maxX = Math.max(maxX, points[i]!);
    minZ = Math.min(minZ, points[i + 2]!);
    maxZ = Math.max(maxZ, points[i + 2]!);
  }
  minX -= MARGIN;
  minZ -= MARGIN;
  const width = Math.ceil((maxX + MARGIN - minX) / COLOUR_CELL);
  const height = Math.ceil((maxZ + MARGIN - minZ) / COLOUR_CELL);
  const sum = new Float32Array(width * height * 3);
  for (const light of lights) {
    const red = ((light.colour >> 16) & 255) / 255;
    const green = ((light.colour >> 8) & 255) / 255;
    const blue = (light.colour & 255) / 255;
    const x0 = Math.max(Math.floor((light.x - light.reach - minX) / COLOUR_CELL), 0);
    const x1 = Math.min(Math.ceil((light.x + light.reach - minX) / COLOUR_CELL), width - 1);
    const z0 = Math.max(Math.floor((light.z - light.reach - minZ) / COLOUR_CELL), 0);
    const z1 = Math.min(Math.ceil((light.z + light.reach - minZ) / COLOUR_CELL), height - 1);
    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) {
        const dx = minX + (cx + 0.5) * COLOUR_CELL - light.x;
        const dz = minZ + (cz + 0.5) * COLOUR_CELL - light.z;
        const near = 1 - Math.hypot(dx, dz) / light.reach;
        if (near <= 0) continue;
        const fall = near * near * light.strength;
        const at = (cz * width + cx) * 3;
        sum[at] = sum[at]! + red * fall;
        sum[at + 1] = sum[at + 1]! + green * fall;
        sum[at + 2] = sum[at + 2]! + blue * fall;
      }
    }
  }
  const texels = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    for (let c = 0; c < 3; c++) {
      texels[i * 4 + c] = Math.round(
        Math.sqrt(Math.min(sum[i * 3 + c]! / COLOUR_LIGHT_MAX, 1)) * 255,
      );
    }
    texels[i * 4 + 3] = 255;
  }
  return { texels, width, height, cell: COLOUR_CELL, minX, minZ };
}

/** The coloured light on the ground at a place: red, green and blue. */
export function colourLightAt(map: ColourLightMap, x: number, z: number): [number, number, number] {
  const cx = Math.floor((x - map.minX) / map.cell);
  const cz = Math.floor((z - map.minZ) / map.cell);
  if (cx < 0 || cz < 0 || cx >= map.width || cz >= map.height) return [0, 0, 0];
  const at = (cz * map.width + cx) * 4;
  const channel = (c: number) => (map.texels[at + c]! / 255) ** 2 * COLOUR_LIGHT_MAX;
  return [channel(0), channel(1), channel(2)];
}
