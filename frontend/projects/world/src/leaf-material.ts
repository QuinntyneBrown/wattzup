// The material a course's leaves are drawn with (L2-166 AC77): lit and coloured by vertex as the land is, seen from
// both sides, and moved by the evening breeze. A leaf says how freely each of its corners swings in the alpha of
// that corner's colour: 1 where it is held (and for every leaf that does not sway), less towards a frond's tip
// (`leaf_face` in build_course.py). The swing is worked out in the vertex's place alone: nothing a pixel.
// Where a map has a low sun to look into (L2-166 AC98), a leaf seen against it is dark, as a palm stands against a
// sunset: the more squarely the eye looks towards the sun at it, the darker, worked out a vertex.
import {
  attribute,
  cameraPosition,
  cos,
  float,
  materialColor,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
  uniform,
  varying,
  vec2,
  vec3,
} from 'three/tsl';
import { DoubleSide, type Material, MeshLambertNodeMaterial } from 'three/webgpu';

/** How far a frond's tip swings, in metres. */
const SWING = 0.17;
/** The alpha of a frond's tip: 1 less this is as free as a corner gets. */
const FREE = 0.7;

/** The leaves' material, the clock that moves them, and the size of a mesh's own units in metres. */
export interface Leaves {
  readonly material: Material;
  at(seconds: number): void;
  /** A map's positions are steps of each mesh's own box (pack_glb.py): how many metres its box is across. */
  across(metres: number): void;
  /**
   * The sun to stand dark against: the way to it over the ground (`x`, `z`, any length) and how much of a leaf's
   * colour is lost looking straight at it, from 0 (none, as a map without a low sun) to 1.
   */
  against(x: number, z: number, depth: number): void;
}

export function leafMaterial(): Leaves {
  const time = uniform(0);
  const unit = uniform(1);
  const sun = uniform(vec2(1, 0));
  const depth = uniform(0);
  const material = new MeshLambertNodeMaterial({
    vertexColors: true,
    flatShading: true,
    side: DoubleSide,
  });
  const free = float(1).sub(attribute('color', 'vec4').a).div(FREE);
  // Where the leaf is, in metres, sets where in its swing it is: no two palms keep time.
  const x = positionLocal.x.mul(unit);
  const z = positionLocal.z.mul(unit);
  const swing = vec3(
    sin(time.mul(1.4).add(x.mul(0.21)).add(z.mul(0.13))),
    sin(time.mul(1.9).add(x.mul(0.17))).mul(0.35),
    cos(time.mul(1.1).add(z.mul(0.19))),
  );
  // A tip swings far and what is near the crown hardly at all; the swing is in metres, the place in the mesh's units.
  material.positionNode = positionLocal.add(swing.mul(free.mul(free)).mul(float(SWING).div(unit)));
  // Looking along the ground from the eye to the leaf: how squarely that is towards the sun.
  const look = positionWorld.xz.sub(cameraPosition.xz).normalize();
  const towards = varying(smoothstep(0.35, 0.95, look.dot(sun)));
  material.colorNode = materialColor.mul(float(1).sub(towards.mul(depth)));
  return {
    material,
    at: (seconds) => {
      time.value = seconds;
    },
    across: (metres) => {
      unit.value = metres;
    },
    against: (x, z, lost) => {
      const length = Math.hypot(x, z) || 1;
      sun.value.set(x / length, z / length);
      depth.value = lost;
    },
  };
}
