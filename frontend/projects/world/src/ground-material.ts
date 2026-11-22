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

/** The ground's material, reading `detail`. */
export function groundMaterial(
  detail: DataTexture,
  roadHalfWidth: number,
  lamps: CourseLamps | null,
): Material {
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
    .add(fine.a.mul(0.035))
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
  const colour = mix(mix(beside, asphalt, onRoad), paint, painted);

  const material = new MeshStandardNodeMaterial();
  material.colorNode = colour;
  material.metalnessNode = float(0);
  material.roughnessNode = mix(float(0.92), float(0.62), worn.max(painted.mul(0.6)))
    .add(grain.sub(0.5).mul(0.2))
    .clamp(0.3, 1);

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
    material.emissiveNode = colour
      .mul(vec3(tint.r, tint.g, tint.b))
      .mul(max(light, 0).mul(LAMP_STRENGTH));
  }

  return material;
}
