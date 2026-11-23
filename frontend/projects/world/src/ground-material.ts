// The material a course's ground is drawn with (L2-166 AC13): the asphalt, its paint and kerbs, the pavements and the
// shoulders, which the Blender pipeline puts in the map's `Ground` group with each vertex's place on the road in its
// UV (metres left of the centre line, metres from the start line). From that place alone the material draws the
// surface: the grain of the aggregate, patches, wheel tracks, cracks, worn paint, and the pool of light under each
// street lamp. One material and one small texture worked out on the device (surface-detail.ts): no picture in the
// map's file, no light for the GPU to add up.
import {
  abs,
  float,
  max,
  mix,
  mod,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  type Material,
  MeshStandardNodeMaterial,
  type Node,
  RepeatWrapping,
  RGBAFormat,
  UnsignedByteType,
} from 'three/webgpu';
import type { CourseLamps } from './course';
import { SURFACE_DETAIL_SIZE, surfaceDetail } from './surface-detail';

type FloatNode = Node<'float'>;

/** Metres from the centre line to each wheel track's middle, and how wide a track is worn. */
const TRACKS = [1.3, 3.7] as const;
const TRACK_WIDTH = 0.5;
/** How bright the ground is straight under a lamp, against its colour in daylight. */
const LAMP_STRENGTH = 4.2;

/** The detail texture the ground and the walls read (surface-detail.ts): repeating, mipped, to be disposed. */
export function surfaceTexture(): DataTexture {
  const size = SURFACE_DETAIL_SIZE;
  const detail = new DataTexture(surfaceDetail(), size, size, RGBAFormat, UnsignedByteType);
  detail.wrapS = detail.wrapT = RepeatWrapping;
  detail.magFilter = LinearFilter;
  detail.minFilter = LinearMipmapLinearFilter;
  detail.generateMipmaps = true;
  detail.anisotropy = 8;
  detail.needsUpdate = true;
  return detail;
}

/** Where the ground is seen from, in the road's own measure, kept up to date a frame: wet ground mirrors by it. */
export interface GroundEye {
  /** Sets the eye: metres from the start line, metres left of the centre line, metres above the road. */
  at(along: number, left: number, height: number): void;
}

/** How bright a coloured light is on the dry ground against the ground's colour, and mirrored in water. */
const COLOURED = { ground: 7.5, mirrored: 0.22 } as const;
/** How bright a lamp's reflection in standing water is, and the sky's, against the lamp itself. */
const MIRROR = { lamp: 2.6, sky: 0.4 } as const;

/**
 * The ground's material, reading `detail`. `wet` is how wet the ground is, 0 to 1: above 0 the ground is darker and
 * smoother in patches, and those patches mirror the lamps and the sky's `haze` as seen from the eye. `coloured` is
 * the coloured lights' light at the surface (lamp-glow.ts), where the course has any.
 */
export function groundMaterial(
  detail: DataTexture,
  roadHalfWidth: number,
  lamps: CourseLamps | null,
  wet = 0,
  haze: Color | null = null,
  coloured: Node<'vec3'> | null = null,
): { material: Material; eye: GroundEye } {
  // glTF keeps a UV's second number upside down: the metres from the start line come back as 1 - v.
  const left = uv().x;
  const along = float(1).sub(uv().y);
  const place = vec2(left, along);
  const base = vertexColor().rgb;
  // The same texels at three scales: a tile 1.2 m, 5.3 m and 37 m across.
  const fine = texture(detail, place.mul(0.83));
  const middle = texture(detail, place.mul(0.19).add(vec2(0.37, 0.11)));
  const broad = texture(detail, place.mul(0.027).add(vec2(0.11, 0.53)));

  const onRoad = smoothstep(roadHalfWidth + 0.05, roadHalfWidth - 0.05, abs(left));
  // Paint is the only pale thing on the ground.
  const painted = smoothstep(0.25, 0.45, base.g);
  const grain = fine.r.mul(0.6).add(middle.r.mul(0.4));
  const patch = mix(0.62, 1.32, broad.g);
  const cracks = middle.b.mul(broad.g.mul(0.9).add(0.45)).min(1);
  // Where the wheels run the surface is polished: a little paler and smoother.
  let worn: FloatNode = float(0);
  for (const track of TRACKS) {
    const off = abs(left).sub(track).div(TRACK_WIDTH);
    worn = worn.add(off.mul(off).negate().exp());
  }
  worn = worn.mul(onRoad);

  const asphalt = base
    .mul(grain.mul(1.1).add(0.45))
    .mul(patch)
    .mul(worn.mul(0.16).add(1))
    .add(fine.a.mul(mix(float(0.035), float(0.055), worn)))
    .mul(cracks.mul(0.8).oneMinus());
  // Paint wears thin where the surface under it is rough, and breaks with the cracks.
  const chipped = smoothstep(0.5, 0.85, middle.g.mul(0.7).add(fine.r.mul(0.5)));
  const paint = mix(base.mul(grain.mul(0.3).add(0.7)), asphalt.mul(0.1), chipped.mul(0.7)).mul(
    cracks.mul(0.6).oneMinus(),
  );
  // Pavements and shoulders: their own colour, mottled.
  const beside = base
    .mul(grain.mul(0.7).add(0.5))
    .mul(mix(0.6, 1.05, broad.g))
    .mul(middle.b.mul(0.5).oneMinus());
  const dry = mix(mix(beside, asphalt, onRoad), paint, painted);
  // Standing water: it lies in the broad patches and the wheel tracks' hollows, more of it the wetter the ground.
  const water =
    wet > 0
      ? smoothstep(
          1 - wet,
          1.12 - wet * 0.6,
          broad.g.mul(0.75).add(middle.g.mul(0.35)).add(worn.mul(0.12)),
        )
      : float(0);
  // Wet ground is darker.
  const colour = dry.mul(mix(float(1), float(0.55), water.mul(painted.oneMinus())));

  const material = new MeshStandardNodeMaterial();
  material.colorNode = colour;
  material.metalnessNode = float(0);
  material.roughnessNode = mix(
    mix(float(0.92), float(0.62), worn.max(painted.mul(0.6))).add(grain.sub(0.5).mul(0.2)),
    float(0.12),
    water,
  ).clamp(0.08, 1);

  const eyeAt = uniform(vec3(0, 2, 0));
  let emitted: Node<'vec3'> = vec3(0, 0, 0);
  if (lamps) {
    // The light under the lamps: each kerb's nearest lamp and the one after it, falling off a little faster than
    // light does on flat ground, as under a lamp with a shade.
    const { every, first, across, height } = lamps;
    const span = mod(along.sub(first).add(every / 2), every).sub(every / 2);
    const next = float(every).sub(abs(span));
    const h2 = height * height;
    let light: FloatNode = float(0);
    for (const run of [span, next]) {
      for (const side of [across, -across]) {
        const dl = left.sub(side);
        const d2 = dl.mul(dl).add(run.mul(run)).add(h2);
        light = light.add(float(h2 * h2).div(d2.mul(d2)));
      }
    }
    const tint = new Color(lamps.colour);
    const lampColour = vec3(tint.r, tint.g, tint.b);
    emitted = colour.mul(lampColour).mul(max(light, 0).mul(LAMP_STRENGTH));

    if (wet > 0) {
      // The lamps in the water. All in the road's own measure (metres left, up, along), where the road is
      // straight enough near the eye: a lamp mirrors at the point a share `eye height / (eye height + lamp
      // height)` of the way from the eye to it, so the row of lamps whose mirror this point could be is known, and
      // only that row and the one either side of it are worked out, on both kerbs. Blinn's highlight, on water that ripples a
      // little with the grain, draws each as a streak towards the eye.
      const point = vec3(left, 0, along);
      const toEye = eyeAt.sub(point).normalize();
      const reach = eyeAt.y.add(height).div(eyeAt.y);
      const mirrored = eyeAt.z.add(along.sub(eyeAt.z).mul(reach));
      const row = mirrored.sub(first).div(every).round();
      const gloss = mix(float(260), float(1100), fine.r);
      let streaks: FloatNode = float(0);
      for (const step of [-1, 0, 1]) {
        const at = row.add(step).mul(every).add(first);
        for (const side of [across, -across]) {
          const toLamp = vec3(float(side), float(height), at).sub(point).normalize();
          streaks = streaks.add(toLamp.add(toEye).normalize().y.max(0).pow(gloss));
        }
      }
      emitted = emitted.add(lampColour.mul(streaks.mul(water).mul(MIRROR.lamp)));
    }
  }
  if (wet > 0 && haze) {
    // And the sky in it, most at a glancing angle.
    const glance = float(1)
      .sub(
        eyeAt
          .sub(vec3(left, 0, along))
          .normalize()
          .y.max(0),
      )
      .pow(5);
    emitted = emitted.add(vec3(haze.r, haze.g, haze.b).mul(glance.mul(water).mul(MIRROR.sky)));
  }
  if (coloured) {
    // Neon and the bridges' cables: their colour on the ground, and brighter where it lies in water.
    emitted = emitted.add(
      colour
        .mul(coloured)
        .mul(COLOURED.ground)
        .add(coloured.mul(water.mul(COLOURED.mirrored))),
    );
  }
  if (lamps || wet > 0 || coloured) material.emissiveNode = emitted;

  return {
    material,
    eye: {
      at: (alongMetres, leftMetres, height) => {
        eyeAt.value.set(leftMetres, height, alongMetres);
      },
    },
  };
}
