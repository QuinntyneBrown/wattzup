// The material a course's sea is drawn with (L2-166 AC22): one flat sheet round the land. It ripples, and by the
// angle it is seen at it mirrors what is above it: the sky, paler towards the horizon; the lights of the land along
// the far shore, drawn out into columns by the ripples; and the glint of the sun or the moon. Looked straight down
// on, it is its own dark colour. All of it worked out from where the eye is: nothing is drawn twice.
import {
  atan,
  cameraPosition,
  float,
  mix,
  positionWorld,
  reflect,
  smoothstep,
  texture,
  uniform,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import { Color, type DataTexture, type Material, MeshBasicNodeMaterial } from 'three/webgpu';
import type { CourseLook } from './course';

/** How steep the ripples are, how fast they run (metres a second), and how bright the far shore's lights are. */
const RIPPLE = 0.16;
const RUN = 0.35;
const SHORE = 0.55;

/** The sea's material and the clock that moves its ripples. */
export interface Water {
  readonly material: Material;
  at(seconds: number): void;
}

/**
 * The sea's material. `sun` is where the light comes from; `detail` the ground's detail texture; `lights` whether
 * the land is lit (a night map), so the far shore's lights stand in the water.
 */
export function waterMaterial(
  look: CourseLook,
  sun: readonly [number, number, number],
  detail: DataTexture,
  lights: boolean,
): Water {
  const time = uniform(0);
  const at = positionWorld.xz;
  // Ripples: two reads of the detail texture running across each other tip the surface a little.
  const run = time.mul(RUN);
  const a = texture(detail, at.mul(0.043).add(vec2(run.mul(0.043), run.mul(0.017))));
  const b = texture(detail, at.mul(0.117).sub(vec2(run.mul(0.05), run.mul(0.09))));
  const tip = vec2(a.r.add(b.g).sub(1), a.g.add(b.r).sub(1)).mul(RIPPLE);
  const up = vec3(tip.x, 1, tip.y).normalize();
  const toEye = cameraPosition.sub(positionWorld).normalize();
  const mirrored = reflect(toEye.negate(), up);
  const rise = mirrored.y.max(0);

  // The sky in it: the haze low down, the top of the sky overhead.
  const haze = new Color(look.haze);
  const top = new Color(look.sky[look.sky.length - 1]!);
  let seen = mix(vec3(haze.r, haze.g, haze.b).mul(1.3), vec3(top.r, top.g, top.b), rise.pow(0.45));
  if (lights) {
    // The far shore's lights: where the mirrored ray runs low, a column of warm light wherever the detail
    // texture, read round the compass, says a lit building stands.
    const bearing = atan(mirrored.z, mirrored.x);
    const lit = smoothstep(0.45, 0.9, texture(detail, vec2(bearing.mul(1.3), 0.37)).r);
    const low = smoothstep(0.2, 0.01, rise);
    seen = seen.add(vec3(1, 0.74, 0.44).mul(lit.mul(low).mul(SHORE)));
  }
  // The sun or the moon on it.
  const light = new Color(look.light.colour);
  const glint = mirrored
    .dot(vec3(sun[0], sun[1], sun[2]))
    .max(0)
    .pow(420);
  seen = seen.add(vec3(light.r, light.g, light.b).mul(glint.mul(2.2)));

  // How much of that the water shows: little looked down on, nearly all at a glancing angle.
  const glance = float(1).sub(up.dot(toEye).max(0)).pow(5).mul(0.97).add(0.03);
  const material = new MeshBasicNodeMaterial();
  material.colorNode = mix(vertexColor().rgb.mul(0.3), seen, glance);
  return {
    material,
    at: (seconds) => {
      time.value = seconds;
    },
  };
}
