// The materials a course's people are drawn with (L2-166 AC78): what stands on the map and what glows on it, as
// they were, and moved to the music where a figure says it moves. A figure says how freely each of its corners
// moves in the alpha of that corner's colour: 1 where it is planted (its feet, and everything on the map that is
// not a figure), less the higher up a figure it is, and less still on a dancer than on someone standing
// (`person` in build_course.py). The move is worked out in the vertex's place alone: nothing a pixel.
import {
  abs,
  smoothstep,
  vec2,
  attribute,
  cos,
  float,
  modelWorldMatrix,
  positionGeometry,
  positionLocal,
  sin,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import {
  type Material,
  MeshBasicNodeMaterial,
  MeshLambertNodeMaterial,
  type NodeMaterial,
} from 'three/webgpu';
import { CHEER_FROM, CHEER_FULL, CHEER_HOP, CHEER_REACH } from './crowd-cheer';

/** The music's beats a second, and how far a dancer's head hops and sways to them, in metres. */
const BEATS = 1.9;
const HOP = 0.04;
const SWAY = 0.07;
/** The alpha of a dancer's head: 1 less this is as free as a corner gets. */
const FREE = 0.7;

/** The two materials, the clock that moves them, and the size of a mesh's own units in metres. */
export interface Dancing {
  /** What stands on the map: lit, coloured by vertex, shaded flat. */
  readonly solid: Material;
  /** What glows on it: a figure's drink goes with their hand. */
  readonly glow: Material;
  at(seconds: number): void;
  /** Where the rider is, in the map's metres: the figures near them cheer (crowd-cheer.ts). */
  rider(x: number, z: number): void;
  /** A map's positions are steps of each mesh's own box (pack_glb.py): how many metres its box is across. */
  across(metres: number): void;
}

export function danceMaterials(): Dancing {
  const time = uniform(0);
  const unit = uniform(1);
  const rider = uniform(vec2(1e6, 1e6));
  const move = (material: NodeMaterial): void => {
    const free = float(1).sub(attribute('color', 'vec4').a).div(FREE);
    // Where a figure stands, in the map's metres, sets where in the beat they are: a crowd, not a chorus line.
    // It is the same for a figure's body and for the drink in their hand, which are in different meshes.
    const stood = modelWorldMatrix.mul(vec4(positionGeometry, 1));
    const where = stood.x.mul(0.33).add(stood.z.mul(0.27));
    const beat = time.mul(Math.PI * BEATS);
    // And how near the rider is sets how they cheer: hopping higher, twice as fast, and stretching up (cheer in
    // crowd-cheer.ts is this sum).
    const cheering = smoothstep(CHEER_FROM, CHEER_FULL, stood.xz.sub(rider).length());
    const hop = abs(sin(beat.mul(cheering.add(1)).add(where))).mul(HOP);
    const dance = vec3(
      sin(beat.mul(0.5).add(where.mul(1.3))).mul(SWAY),
      hop.mul(cheering.mul(CHEER_HOP - 1).add(1)).add(cheering.mul(CHEER_REACH)),
      cos(beat.mul(0.5).add(where)).mul(SWAY * 0.65),
    );
    material.positionNode = positionLocal.add(dance.mul(free).div(unit));
  };
  const solid = new MeshLambertNodeMaterial({ vertexColors: true, flatShading: true });
  const glow = new MeshBasicNodeMaterial({ vertexColors: true, toneMapped: false });
  move(solid);
  move(glow);
  return {
    solid,
    glow,
    at: (seconds) => {
      time.value = seconds;
    },
    rider: (x, z) => {
      rider.value.set(x, z);
    },
    across: (metres) => {
      unit.value = metres;
    },
  };
}
