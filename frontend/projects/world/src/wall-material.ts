// The material a course's walls are drawn with (L2-166 AC15): what is built of brick, steel or plaster, which the
// Blender pipeline puts in the map's `Walls` group with each vertex's place on its wall in its UV (metres along the
// wall, metres above the road beside it) and the wall's kind added to the height, 1,000 m a kind. From that the
// material draws brick in courses with mortar, each brick its own shade; a container's ribs and rust; and plaster
// with stains. Far off, where a brick is less than a pixel, the courses fade into their average, so nothing shimmers.
import {
  abs,
  float,
  floor,
  fract,
  fwidth,
  mix,
  sin,
  smoothstep,
  step,
  texture,
  uv,
  vec2,
  vec3,
  vertexColor,
} from 'three/tsl';
import {
  type Color,
  type DataTexture,
  type Material,
  MeshLambertNodeMaterial,
  type Node,
} from 'three/webgpu';

/** A brick and the mortar round it, in metres: a course's height and a brick's length along it. */
const COURSE = 0.075;
const BRICK = 0.225;
const MORTAR = 0.012;
/** The pitch of a container's ribs, in metres. */
const RIB = 0.28;
/** A tower's windows: a window's bay in metres, the share of them lit, and how bright a lit one is. */
const WINDOW = { wide: 3.2, tall: 3.4, lit: 0.36, glow: 1.5 } as const;
/** How far a wall on the horizon gives way to the haze's colour. */
const HAZED = 0.5;
/** What the build adds to a wall's height for each kind (build_course.py, `WALL_KIND_STEP`). */
const KIND_STEP = 1000;

/**
 * The walls' material. `detail` is the ground's detail texture (surface-detail.ts); `light`, where the course has
 * street lamps, is their light at the surface (lamp-glow.ts), added `strength` strong. With `haze`, the walls are
 * the city on the horizon: drawn through the haze in its colour, not faded out by it.
 */
export function wallMaterial(
  detail: DataTexture,
  light: Node<'vec3'> | null,
  strength: number,
  haze: Color | null = null,
): Material {
  const along = uv().x;
  // glTF keeps a UV's second number upside down.
  const raised = float(1).sub(uv().y);
  const kind = floor(raised.add(KIND_STEP / 2).div(KIND_STEP));
  const up = raised.sub(kind.mul(KIND_STEP));
  const place = vec2(along, up);
  const base = vertexColor().rgb;
  const fine = texture(detail, place.mul(0.9));
  // Read tall and narrow: patches that are also the streaks the rain has run down the wall.
  const broad = texture(detail, place.mul(vec2(0.21, 0.018)).add(vec2(0.3, 0.7)));
  // How many of a pattern's repeats one pixel covers: past one, the pattern is drawn as its average.
  const blur = (pitch: number) => smoothstep(0.18, 0.6, fwidth(place).length().div(pitch));

  // Brick: courses half a brick out of step, a mortar joint round each, and each brick a shade of its own.
  const row = floor(up.div(COURSE));
  const run = along.div(BRICK).add(row.mul(0.5));
  const brickId = vec2(floor(run), row);
  const shade = fract(sin(brickId.dot(vec2(12.9898, 78.233))).mul(43758.5453));
  const toJoint = (at: Node<'float'>) => abs(fract(at).sub(0.5)).oneMinus().sub(0.5);
  const joint = smoothstep(MORTAR / 2 / BRICK, 0, toJoint(run))
    .max(smoothstep(MORTAR / 2 / COURSE, 0, toJoint(up.div(COURSE))))
    .mul(0.85);
  const far = blur(COURSE);
  const bricks = base.mul(mix(mix(float(0.62), float(1.3), shade), float(0.96), far));
  const mortar = mix(base, vec3(0.42, 0.4, 0.37), 0.55);
  const brick = mix(bricks, mortar, mix(joint, float(0.2), far)).mul(fine.r.mul(0.5).add(0.75));

  // Steel: a container's ribs, upright, lit on one flank and dark on the other; rust where the paint has gone.
  const rib = sin(along.mul((2 * Math.PI) / RIB));
  const ribbed = base.mul(mix(rib.mul(0.22).add(0.9), float(0.9), blur(RIB)));
  const rusty = smoothstep(0.62, 0.8, broad.g.mul(0.7).add(fine.r.mul(0.3)));
  const steel = mix(ribbed, vec3(0.19, 0.075, 0.03), rusty.mul(0.75));

  // Plaster and concrete: mottled, cracked where it is tired.
  const plaster = base
    .mul(fine.r.mul(0.35).add(0.8))
    .mul(mix(0.78, 1.1, broad.g))
    .mul(fine.b.mul(0.5).oneMinus());

  // Dolomite coursed rubble & ashlar masonry (kind 5): larger irregular stone courses with pale lime mortar.
  const stoneRow = floor(up.div(0.26));
  const stoneRun = along.div(0.54).add(stoneRow.mul(0.37));
  const stoneId = vec2(floor(stoneRun), stoneRow);
  const stoneShade = fract(sin(stoneId.dot(vec2(27.13, 91.7))).mul(31415.926));
  const stoneJoint = smoothstep(0.028, 0, toJoint(stoneRun))
    .max(smoothstep(0.055, 0, toJoint(up.div(0.26))))
    .mul(0.8);
  const farStone = blur(0.26);
  const stoneBlocks = base.mul(
    mix(mix(float(0.74), float(1.22), stoneShade), float(0.98), farStone),
  );
  const stoneMortar = mix(base, vec3(0.56, 0.54, 0.5), 0.5);
  const alpineStone = mix(stoneBlocks, stoneMortar, mix(stoneJoint, float(0.16), farStone)).mul(
    fine.r.mul(0.38).add(0.8),
  );

  // Alpine larch horizontal log boarding (kind 6): rounded timber courses with shadow grooves and wood grain.
  const logPitch = 0.22;
  const logPhase = fract(up.div(logPitch));
  const logRound = sin(logPhase.mul(Math.PI)).mul(0.26).add(0.82);
  const logGrain = texture(detail, place.mul(vec2(0.14, 1.8)))
    .r.mul(0.22)
    .add(0.89);
  const alpineTimber = base.mul(mix(logRound, float(0.96), blur(logPitch))).mul(logGrain);

  const isBrick = smoothstep(0.5, 0.6, kind).mul(smoothstep(1.5, 1.4, kind));
  const isSteel = smoothstep(1.5, 1.6, kind).mul(smoothstep(2.5, 2.4, kind));
  const isAlpineStone = smoothstep(4.5, 4.6, kind).mul(smoothstep(5.5, 5.4, kind));
  const isAlpineTimber = smoothstep(5.5, 5.6, kind).mul(smoothstep(6.5, 6.4, kind));
  const surface = mix(
    mix(mix(mix(plaster, brick, isBrick), steel, isSteel), alpineStone, isAlpineStone),
    alpineTimber,
    isAlpineTimber,
  );
  // Every wall: streaks the rain has run down it, and dirt splashed up its foot. Roofs and floors (kind 0) have none.
  const upright = smoothstep(0.4, 0.6, kind);
  const streaks = broad.g;
  const weathered = surface
    .mul(mix(float(1), mix(float(0.72), float(1.08), streaks), upright))
    .mul(mix(float(1), mix(float(0.55), float(1), smoothstep(0, 1.6, up)), upright));

  // A tower of the skyline (kind 4): a grid of windows, some lit, warm or cool, each its own brightness. Far off,
  // where a window is less than a pixel, a tower glows with its windows' average.
  const isTower = smoothstep(3.5, 3.6, kind).mul(smoothstep(4.5, 4.4, kind));
  const pane = place.div(vec2(WINDOW.wide, WINDOW.tall));
  const window = floor(pane);
  const within = fract(pane);
  const chance = fract(sin(window.dot(vec2(12.9898, 78.233))).mul(43758.5453));
  const tone = fract(sin(window.dot(vec2(39.346, 11.135))).mul(24634.6345));
  const glass = step(0.16, within.x)
    .mul(step(within.x, 0.84))
    .mul(step(0.3, within.y))
    .mul(step(within.y, 0.86));
  const farOff = smoothstep(0.7, 1.6, fwidth(place).length().div(WINDOW.tall));
  const lamp = mix(vec3(1, 0.72, 0.4), vec3(0.7, 0.85, 1), step(0.72, tone)).mul(
    tone.mul(0.9).add(0.45),
  );
  const shining = mix(
    lamp.mul(glass).mul(step(1 - WINDOW.lit, chance)),
    vec3(0.95, 0.76, 0.5).mul(WINDOW.lit * 0.22),
    farOff,
  ).mul(isTower.mul(WINDOW.glow));
  const walled = mix(weathered, weathered.mul(0.45), glass.mul(isTower).mul(farOff.oneMinus()));

  const material = new MeshLambertNodeMaterial({ flatShading: true });
  // Far walls stand in the haze: their own colour gives way to it, and their windows shine through.
  material.colorNode = haze ? mix(walled, vec3(haze.r, haze.g, haze.b), HAZED) : walled;
  if (haze) material.fog = false;
  material.emissiveNode = light ? walled.mul(light).mul(strength).add(shining) : shining;
  return material;
}
