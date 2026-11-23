// The material a flock of birds is drawn with (L2-166 AC79): dark against the sky, seen from both sides, each bird
// beating its wings. A bird says how far each of its corners is from its body in the alpha of that corner's colour:
// 1 on the body, less to the wing's tip (`gulls` in build_course.py). The beat is worked out in the vertex's place.
import { attribute, float, positionGeometry, positionLocal, sin, uniform, vec3 } from 'three/tsl';
import { DoubleSide, type Material, MeshBasicNodeMaterial } from 'three/webgpu';

/** Wing beats a second, how far a wing's tip beats up and down in metres, and the alpha of a tip. */
const BEATS = 2.6;
const BEAT = 0.34;
const FREE = 0.7;

/** The flock's material, the clock that beats its wings, and the size of the mesh's own units in metres. */
export interface Flapping {
  readonly material: Material;
  at(seconds: number): void;
  across(metres: number): void;
}

export function flapMaterial(): Flapping {
  const time = uniform(0);
  const unit = uniform(1);
  // Birds crossing a sunset are dark against it: their painted greys are drawn at a quarter of their brightness.
  const material = new MeshBasicNodeMaterial({
    color: 0x4a3d46,
    vertexColors: true,
    side: DoubleSide,
    fog: false,
    transparent: true,
  });
  const free = float(1).sub(attribute('color', 'vec4').a).div(FREE);
  // Where a bird is in the flock sets where in its beat it is: they do not beat together. Its wings spend longer
  // up than down, as a gull does when it glides between beats.
  const beat = sin(time.mul(Math.PI * 2 * BEATS).add(positionGeometry.x.mul(unit).mul(1.7)));
  const lift = beat.mul(0.7).add(0.3);
  material.positionNode = positionLocal.add(vec3(0, lift.mul(free).mul(BEAT), 0).div(unit));
  return {
    material,
    at: (seconds) => {
      time.value = seconds;
    },
    across: (metres) => {
      unit.value = metres;
    },
  };
}
