// The sky a course is drawn under (L2-166 AC17), worked out a pixel: the course's own colours from the horizon up,
// cloud drifting across it, a glow round the sun or the moon and a paler band of haze along the horizon; and when
// the sky is dark, stars that the cloud hides. It reads the ground's detail texture for the cloud, so the map's file
// carries no picture of a sky.
import {
  float,
  floor,
  fract,
  mix,
  positionLocal,
  sin,
  smoothstep,
  texture,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import {
  BackSide,
  Color,
  type DataTexture,
  type Material,
  MeshBasicNodeMaterial,
  type Node,
} from 'three/webgpu';
import type { CourseLook } from './course';

/** A sky whose top is darker than this is a night sky: it has stars. */
const NIGHT = 0.02;
/** How fast the cloud drifts, in turns of its texture a second. */
const DRIFT = 0.0012;

/** The sky's material and the clock that moves its cloud. */
export interface Sky {
  readonly material: Material;
  /** Moves the cloud on to `seconds` of the ride's clock. */
  at(seconds: number): void;
}

/**
 * The sky's material, for a dome centred on the camera. `sun` is where the light comes from, a unit vector in the
 * map's axes; `detail` is the ground's detail texture (surface-detail.ts).
 */
export function skyMaterial(
  look: CourseLook,
  sun: readonly [number, number, number],
  detail: DataTexture,
  coastalSquall = false,
  evening?: Node<'float'>,
  cloudOpacity = 1,
  nightProgress?: Node<'float'>,
): Sky {
  const colours = look.sky.map((hex) => new Color(hex));
  const stop = (i: number) => vec3(colours[i]!.r, colours[i]!.g, colours[i]!.b);
  const time = uniform(0);
  const toward = positionLocal.normalize();
  const height = toward.y.max(0);

  // The course's colours, horizon up, crowded towards the horizon.
  const band = height.pow(0.55).mul(colours.length - 1);
  let air: Node<'vec3'> = stop(0);
  for (let i = 1; i < colours.length; i++) air = mix(air, stop(i), band.sub(i - 1).clamp(0, 1));

  // Cloud: the detail texture's patches, laid on a flat ceiling and read at two scales, one drifting past the other.
  const ceiling = toward.xz.div(toward.y.add(0.16));
  const drift = vec2(time.mul(DRIFT), time.mul(DRIFT * 0.4));
  const billow = texture(detail, ceiling.mul(0.11).add(drift)).g;
  const wisp = texture(detail, ceiling.mul(0.37).sub(drift.mul(1.7))).g;
  const cover = smoothstep(0.5, 0.86, billow.mul(0.68).add(wisp.mul(0.42)))
    // No cloud in the haze on the horizon, and thinner overhead.
    .mul(smoothstep(0.015, 0.12, height))
    .mul(float(1).sub(height.mul(0.5)));
  // A cloud is lit from below by the horizon: its colour, lightened, and darker where the cloud is thick.
  const zenith = colours[colours.length - 1]!;
  const night = Math.max(zenith.r, zenith.g, zenith.b) < NIGHT;
  const lit = mix(stop(0), vec3(1, 1, 1), night ? 0.12 : 0.5).mul(mix(1.15, 0.72, billow));

  // The sun or the moon: a tight glow and a wide one, in the light's colour.
  const light = new Color(look.light.colour);
  const near = toward.dot(vec3(sun[0], sun[1], sun[2])).max(0);
  const glow = near
    .pow(350)
    .mul(0.7)
    .add(near.pow(24).mul(night ? 0.1 : 0.22));

  let sky: Node<'vec3'> = air;
  if (night) {
    // Stars: one in a few of the squares of a grid laid on the sky, each its own size and twinkling to its own beat.
    const grid = toward.xz.div(toward.y.abs().add(0.35)).mul(95);
    const square = floor(grid);
    const pick = fract(sin(square.dot(vec2(12.9898, 78.233))).mul(43758.5453));
    const at = fract(grid)
      .sub(vec2(0.5, 0.5))
      .sub(vec2(pick.mul(37).fract().sub(0.5), pick.mul(91).fract().sub(0.5)).mul(0.6));
    const size = pick.mul(53).fract().mul(0.1).add(0.05);
    const star = smoothstep(size, 0, at.length())
      .mul(smoothstep(0.86, 0.9, pick))
      .mul(
        sin(time.mul(pick.mul(3).add(1.2)).add(pick.mul(40)))
          .mul(0.3)
          .add(0.7),
      );
    sky = sky.add(vec3(0.85, 0.9, 1).mul(star.mul(smoothstep(0.03, 0.3, height)).mul(1.3)));
  }
  sky = mix(sky, lit, cover.mul((night ? 0.55 : 0.85) * cloudOpacity));
  sky = sky.add(vec3(light.r, light.g, light.b).mul(glow.mul(cover.mul(0.6).oneMinus())));
  // The haze along the horizon: the lights of the land, or the day's dust.
  const haze = new Color(look.haze);
  sky = mix(
    sky,
    vec3(haze.r, haze.g, haze.b).mul(night ? 1.5 : 1.05),
    height.mul(-9).exp().mul(0.75),
  );

  if (coastalSquall) {
    // Low, ragged North Atlantic cloud banks. Slanted gaps in the rain curtain transmit warm light.
    const bearing = toward.z.add(toward.x.mul(0.39));
    const bank = texture(
      detail,
      vec2(bearing.mul(0.61).add(time.mul(0.0065)), height.mul(2.5).add(0.31)),
    ).g;
    const baseHeight = bank
      .mul(0.12)
      .add(0.045)
      .add(sin(bearing.mul(6).add(time.mul(0.051))).mul(0.025));
    const shelf = smoothstep(baseHeight.sub(0.018), baseHeight.add(0.036), height);
    const shadow = smoothstep(0.38, 0.68, bank.mul(0.71).add(wisp.mul(0.42))).mul(shelf);
    sky = mix(sky, vec3(0.088, 0.133, 0.17), shadow.mul(0.64));
    const shafts = sin(bearing.mul(37).add(height.mul(52)).add(time.mul(0.09)))
      .mul(0.5)
      .add(0.5);
    const gap = smoothstep(0.43, 0.61, bank).mul(smoothstep(0.74, 0.58, bank));
    const rays = smoothstep(0.71, 0.97, shafts)
      .mul(gap)
      .mul(shelf.oneMinus())
      .mul(smoothstep(0.002, 0.035, height));
    sky = sky.add(vec3(0.13, 0.102, 0.059).mul(rays));
  }

  const material = new MeshBasicNodeMaterial({ side: BackSide, fog: false, depthWrite: false });
  if (evening) {
    const sunset = mix(vec3(1.0, 0.43, 0.16), vec3(0.12, 0.19, 0.39), smoothstep(0, 0.48, height));
    const lowSun = toward.dot(vec3(0.945, 0.105, 0.31).normalize()).max(0);
    const amber = sunset.add(
      vec3(1, 0.58, 0.18).mul(
        lowSun
          .pow(160)
          .mul(0.58)
          .add(smoothstep(0.9993, 0.9997, lowSun).mul(2.3)),
      ),
    );
    sky = mix(sky, mix(amber, vec3(0.62, 0.44, 0.48), cover.mul(0.57)), evening);
  }
  if (nightProgress) {
    const cityNight = mix(
      vec3(0.115, 0.072, 0.13),
      vec3(0.012, 0.023, 0.063),
      smoothstep(0, 0.42, height),
    );
    sky = mix(sky, cityNight.add(cover.mul(0.026)), nightProgress);
  }
  material.colorNode = sky;
  return {
    material,
    at: (seconds) => {
      time.value = seconds;
    },
  };
}
