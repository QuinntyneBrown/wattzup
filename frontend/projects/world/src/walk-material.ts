// The material a stroller is drawn with (L2-166 AC84): lit and coloured by vertex as the figures on the map are, and
// stepping. A stroller is built about their own feet in metres, facing +x, mid stride: one foot a stride's reach
// forward and the other back (`person(..., walk=True)` in build_course.py). Here the legs swing through that
// stride: everything below the hips moves fore and aft, more the nearer the foot, the two legs opposite; the foot
// coming forward lifts; the body rises a little twice a stride; and an arm at their side swings against its leg. Worked out in the vertex's place: nothing a pixel.
import { abs, cos, float, positionLocal, sign, sin, uniform, vec3 } from 'three/tsl';
import { type Material, MeshLambertNodeMaterial } from 'three/webgpu';

/** The height of the hips and how far a foot reaches fore and aft of them, in metres, as the figure is built. */
const HIPS = 0.9;
const REACH = 0.28;
/** How high the foot coming forward lifts, and how much the body rises twice a stride, in metres. */
const LIFT = 0.07;
const RISE = 0.025;
/** The height of the shoulders, and how far a hand at their side swings fore and aft, in metres. */
const SHOULDER = 1.37;
const ARM = 0.16;

/** A stroller's material, and where in their stride they are (radians, from `promenaders`). */
export interface Walking {
  readonly material: Material;
  at(phase: number): void;
}

export function walkMaterial(): Walking {
  const phase = uniform(0);
  const material = new MeshLambertNodeMaterial({ vertexColors: true, flatShading: true });
  // How far down the leg a corner is: 0 at the hips and above, 1 at the foot.
  const down = float(HIPS).sub(positionLocal.y).div(HIPS).clamp(0, 1);
  // The leg on +z is built forward: at phase 0 the figure is as built.
  const side = sign(positionLocal.z);
  const swing = cos(phase).sub(1).mul(side).mul(REACH).mul(down);
  // The leg whose foot is coming forward is off the ground.
  const lift = sin(phase).mul(side).max(0).mul(LIFT).mul(down);
  const rise = abs(sin(phase)).mul(RISE).mul(float(1).sub(down));
  // An arm hanging at their side swings against the leg on its side: what is out past the trunk and below the
  // shoulder, more the nearer the hand. An arm that is raised (a drink held up) is above the shoulder and is still.
  const arm = positionLocal.z
    .abs()
    .smoothstep(0.2, 0.26)
    .mul(
      float(SHOULDER)
        .sub(positionLocal.y)
        .div(SHOULDER - HIPS)
        .clamp(0, 1),
    )
    .mul(float(1).sub(down.sign()));
  const reach = cos(phase).mul(side).mul(-ARM).mul(arm);
  material.positionNode = positionLocal.add(vec3(swing.add(reach), lift.add(rise), 0));
  return {
    material,
    at: (now) => {
      phase.value = now;
    },
  };
}
