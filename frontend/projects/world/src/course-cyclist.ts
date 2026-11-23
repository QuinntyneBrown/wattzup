// The rider a course is ridden by (L2-166 AC26): a cyclist with the shape of a body, on a road bike with the
// proportions of one, in place of the figure of capsules the class worlds draw (world-cyclist.ts, which is theirs and
// is left alone). The body is one connected mesh built in Blender (ADR 0036, rider-body.ts), skinned to an armature
// and played through a baked turn of the cranks; this paints it in the rider's colours and draws their kit on it.
// The helmet, the shoes and the bike are made here: the bike is its eleven tubes, bars, saddle, wheels and
// drivetrain, each part a lofted tube, the colours in the vertices, so everything that never moves against the bike
// is one mesh and one draw call, and what the pedalling moves (shoes, cranks, pedals) is a handful of meshes the
// renderer draws as one (rider-batch.ts). The bike points along -z, as the cyclist kit's. The bike's measurements
// are also tools/blender/rider.py's, which holds the rider's feet to these pedals and hands to these hoods: change
// them in both and rebuild the rider.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  AdditiveBlending,
  type AnimationAction,
  AnimationMixer,
  type Bone,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Euler,
  Group,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from 'three/webgpu';
import { type RiderBody, TURN_SECONDS, triangleMiddles } from './rider-body';
import { type KitDesign, type RiderLook, riderLook } from './rider-look';
import { occlusion } from './rider-shade';
import { type BodyRegion, regionOf, turnTime } from './rider-turn';

/** What the course's renderer asks of a rider: where it stands, and how it pedals. */
export interface RiderModel {
  readonly group: Group;
  /**
   * Turns the cranks to `angle` radians and moves the legs with them; `standing` is how far out of the saddle the
   * rider is, 0 seated to 1 standing on the pedals.
   */
  pose(angle: number, standing?: number): void;
  /** The rider's own geometries, textures and materials, to dispose with it. */
  readonly owned: readonly { dispose(): void }[];
  /** The mesh of everything that never moves against the bike: the batch of moving parts leaves it alone. */
  readonly still: Mesh;
}

// The bike, in metres: a 56 cm road frame on 700c wheels. Rear axle at +z.
const WHEEL = 0.34;
const REAR = new Vector3(0, WHEEL, 0.5);
const FRONT = new Vector3(0, WHEEL, -0.5);
const BB = new Vector3(0, 0.28, 0.09);
const SEAT = new Vector3(0, 0.8, 0.225);
const HEAD_TOP = new Vector3(0, 0.84, -0.33);
const HEAD_BOTTOM = new Vector3(0, 0.7, -0.37);
const BAR = new Vector3(0, 0.9, -0.44);
const HOOD = new Vector3(0.2, 0.955, -0.535);
const CRANK = 0.1725;
const PEDAL_OUT = 0.115;

// The rider's head, which the helmet is made about: the body itself is tools/blender/rider.py's.
const HEAD = new Vector3(0, 1.455, -0.345);

const ACROSS = new Vector3(1, 0, 0);
// What `between` works in: a pose is made every frame for every rider, and must allocate nothing.
const SCRATCH_X = new Vector3();
const SCRATCH_Y = new Vector3();
const SCRATCH_Z = new Vector3();
const SCRATCH_Q = new Quaternion();
/** How far, in metres, one part of a rider shades another, and how dark the deepest shade is. */
const SHADE_REACH = 0.14;
const SHADE_DEPTH = 0.7;
/**
 * How far the bike rocks under the rider with each pedal stroke, in radians, seated and (added to it) out of the
 * saddle: little. The rider's own sway and rise over it are in the body's baked turn (tools/blender/rider.py).
 */
const ROCK = 0.012;
const ROCK_STANDING = 0.03;
/**
 * How much of the bike's lean the head takes back out, to stay level, and how far it turns into a bend for each
 * radian the rider leans.
 */
const HEAD_LEVEL = 0.75;
const HEAD_LOOKS = 1.1;
const SKIN = new Color(0xc08a68);
const SHORTS = new Color(0x121316);
const GRIPPER = new Color(0x2c2e34);
const SOCK = new Color(0xf2f2ee);
const SHOE = new Color(0xe9e9e4);
const SOLE = new Color(0x1a1b1e);
const GLOVE = new Color(0x1c1d21);
const FRAME = new Color(0x16181d);
const TYRE = new Color(0x101114);
const RIM = new Color(0x1d1f24);
const STEEL = new Color(0xa9adb3);
const TAPE = new Color(0x202226);
const SADDLE = new Color(0x0e0f11);
const VENT = new Color(0x15161a);
const BOTTLE = new Color(0xdfe3e8);
const HAIR = new Color(0x2b2019);
const SPROCKET = new Color(0x6f747b);
const CHAIN = new Color(0x2b2d31);

/** A part's finish: how glossy it is, 0 to 1, and how much of a metal. */
type Finish = readonly [gloss: number, metal: number];
/** The gloss of the kit's lycra. */
const CLOTH_GLOSS = 0.38;
/** Cloth, and whatever is not named below. */
const MATT: Finish = [0.22, 0];
/** A helmet's shell: lacquered plastic. */
const LACQUER: Finish = [0.9, 0];
const FINISHES = new WeakMap<Color, Finish>([
  [SKIN, [0.5, 0]],
  [SHORTS, [0.38, 0]],
  [GRIPPER, [0.3, 0]],
  [SOCK, [0.08, 0]],
  [SHOE, [0.8, 0]],
  [SOLE, [0.6, 0]],
  [GLOVE, [0.25, 0]],
  [FRAME, [0.95, 0.25]],
  [TYRE, [0.12, 0]],
  [RIM, [0.85, 0.3]],
  [STEEL, [0.8, 1]],
  [TAPE, [0.1, 0]],
  [SADDLE, [0.15, 0]],
  [VENT, [0.1, 0]],
  [BOTTLE, [0.7, 0]],
  [HAIR, [0.35, 0]],
  [SPROCKET, [0.75, 1]],
  [CHAIN, [0.5, 0.8]],
]);
const finishOf = (colour: Color): Finish => FINISHES.get(colour) ?? MATT;

/** A rider's own colours (rider-look.ts), each with the finish of the part it paints. */
interface Palette {
  readonly skin: Color;
  readonly hair: Color;
  readonly frame: Color;
  readonly shoe: Color;
  readonly sock: Color;
  /** The skin where it lies in a hollow, and where it is drawn tight over a muscle or a tendon. */
  readonly skinShade: Color;
  readonly skinLight: Color;
}
function palette(look: RiderLook): Palette {
  const as = (hex: number, part: Color): Color => {
    const colour = new Color(hex);
    FINISHES.set(colour, finishOf(part));
    return colour;
  };
  return {
    skin: as(look.skin, SKIN),
    hair: as(look.hair, HAIR),
    frame: as(look.frame, FRAME),
    shoe: as(look.shoe, SHOE),
    sock: as(look.sock, SOCK),
    skinShade: as(new Color(look.skin).multiplyScalar(0.74).getHex(), SKIN),
    skinLight: as(new Color(look.skin).lerp(new Color(0xffffff), 0.14).getHex(), SKIN),
  };
}

/**
 * How finely a rider is being made, 1 for the finest: the rider the camera follows on a fast device. Every loft's and
 * every round shape's count of sides is scaled by it, so a rider up the road, or any rider on a slower device, is the
 * same shape in fewer triangles. Set while one rider is put together (`CourseCyclist`), 1 otherwise.
 */
let fineness = 1;
/** `sides` at the fineness in force, never fewer than `least`. */
const fine = (sides: number, least = 5): number => Math.max(least, Math.round(sides * fineness));

/** One section of a lofted tube: how far along it (0 to 1), its half-widths, and how far off the axis it sits. */
interface Section {
  readonly t: number;
  readonly rx: number;
  readonly rz: number;
  readonly x?: number;
  readonly z?: number;
}

/**
 * A tube along +y from 0 to `length`, its section an ellipse that changes along it, closed at both ends, with a
 * colour for each section (and, where it is wanted, for each place round it: `round` runs 0 to 1). Position, normal and colour, not indexed: every piece of the rider is made this way so
 * they can be merged.
 */
function loft(
  sections: readonly Section[],
  length: number,
  colour: (t: number, round: number) => Color,
  asked = 12,
): BufferGeometry {
  const around = fine(asked);
  const positions: number[] = [];
  const colours: number[] = [];
  const finishes: number[] = [];
  const index: number[] = [];
  for (const section of sections) {
    for (let s = 0; s < around; s++) {
      const c = colour(section.t, s / around);
      const a = (s / around) * Math.PI * 2;
      positions.push(
        (section.x ?? 0) + Math.cos(a) * section.rx,
        section.t * length,
        (section.z ?? 0) + Math.sin(a) * section.rz,
      );
      colours.push(c.r, c.g, c.b);
      finishes.push(...finishOf(c));
    }
  }
  for (let i = 0; i < sections.length - 1; i++) {
    for (let s = 0; s < around; s++) {
      const a = i * around + s;
      const b = i * around + ((s + 1) % around);
      index.push(a, a + around, b, b, a + around, b + around);
    }
  }
  // A cap at each end, a fan about its middle.
  for (const [at, flip] of [
    [0, false],
    [sections.length - 1, true],
  ] as const) {
    const section = sections[at]!;
    const c = colour(section.t, 0);
    const middle = positions.length / 3;
    positions.push(section.x ?? 0, section.t * length, section.z ?? 0);
    colours.push(c.r, c.g, c.b);
    finishes.push(...finishOf(c));
    for (let s = 0; s < around; s++) {
      const a = at * around + s;
      const b = at * around + ((s + 1) % around);
      index.push(...(flip ? [middle, b, a] : [middle, a, b]));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colours), 3));
  geometry.setAttribute('finish', new BufferAttribute(new Float32Array(finishes), 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const flat = geometry.toNonIndexed();
  geometry.dispose();
  return flat;
}

/** A plain tube of one colour between two radii. */
function tube(length: number, from: number, to: number, colour: Color, around = 8): BufferGeometry {
  return loft(
    [
      { t: 0, rx: from, rz: from },
      { t: 1, rx: to, rz: to },
    ],
    length,
    () => colour,
    around,
  );
}

/** One of Three.js's own shapes with position, normal, one colour and one finish, not indexed, ready to merge. */
function solid(shape: BufferGeometry, colour: Color, finish = finishOf(colour)): BufferGeometry {
  const geometry = shape.index ? shape.toNonIndexed() : shape.clone();
  shape.dispose();
  for (const name of Object.keys(geometry.attributes)) {
    if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
  }
  const count = geometry.getAttribute('position').count;
  const colours = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colours.set([colour.r, colour.g, colour.b], i * 3);
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  const finishes = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) finishes.set(finish, i * 2);
  geometry.setAttribute('finish', new BufferAttribute(finishes, 2));
  return geometry;
}

/** The turn and move that lay a tube made along +y from `a` to `b`, its x axis as near `across` as can be. */
function between(a: Vector3, b: Vector3, into = new Matrix4()): Matrix4 {
  const y = SCRATCH_Y.copy(b).sub(a).normalize();
  const x = SCRATCH_X.copy(ACROSS).addScaledVector(y, -ACROSS.dot(y));
  if (x.lengthSq() < 1e-8) x.set(0, 0, 1).addScaledVector(y, -y.z);
  x.normalize();
  const z = SCRATCH_Z.copy(x).cross(y);
  return into.makeBasis(x, y, z).setPosition(a);
}

/** A road shoe, heel to toe along +y, its sole dark: laid on the pedal by its ball. */
function shoeShape(look: Palette): BufferGeometry {
  const upper = loft(
    [
      // The heel is cupped and rounded; the shoe is deepest at the instep, widest at the ball and low at the toe.
      { t: 0, rx: 0.012, rz: 0.014, z: 0.016 },
      { t: 0.03, rx: 0.026, rz: 0.03, z: 0.016 },
      { t: 0.1, rx: 0.033, rz: 0.038, z: 0.018 },
      { t: 0.24, rx: 0.037, rz: 0.042, z: 0.02 },
      { t: 0.45, rx: 0.042, rz: 0.038, z: 0.014 },
      { t: 0.62, rx: 0.046, rz: 0.032, z: 0.01 },
      { t: 0.85, rx: 0.042, rz: 0.024, z: 0.005 },
      { t: 0.96, rx: 0.03, rz: 0.017, z: 0.002 },
      { t: 1, rx: 0.014, rz: 0.01, z: 0.001 },
    ],
    0.275,
    // A dark heel cup with a pale tab up its back that shows to whoever follows, a strap over the instep, a dark
    // toe cap; the rest is the shoe's own colour. (Round a shoe, a quarter of the way is its top.)
    (t, round) => {
      if (t < 0.13) return Math.abs(round - 0.25) < 0.07 ? SOCK : GRIPPER;
      if (t > 0.4 && t < 0.47 && round < 0.5) return GRIPPER;
      if (t > 0.9) return GRIPPER;
      return look.shoe;
    },
    14,
  );
  const sole = loft(
    [
      { t: 0, rx: 0.03, rz: 0.008, z: -0.016 },
      { t: 0.5, rx: 0.044, rz: 0.008, z: -0.02 },
      { t: 1, rx: 0.026, rz: 0.007, z: -0.012 },
    ],
    0.275,
    () => SOLE,
    8,
  );
  const shoe = mergeGeometries([upper, sole], false)!;
  upper.dispose();
  sole.dispose();
  // Its ball, where the cleat is, at the origin; its heel behind (+z), its toe ahead (-z), its sole down.
  shoe.applyMatrix4(
    new Matrix4().makeBasis(new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0)),
  );
  shoe.translate(0, 0.03, 0.19);
  return shoe;
}

/** The geometry, textures and materials every course rider shares. */
export class CourseCyclistKit {
  private readonly crank = tube(CRANK, 0.016, 0.012, RIM);
  private readonly pedal = solid(new CylinderGeometry(0.012, 0.012, 0.09, 6), SOLE);
  // The wheels' sides: the deep rim with its decals and the spokes inside it, both wheels' discs as one shape
  // drawn through one picture. The picture is turned about its middle as the bikes roll (`roll`), which turns
  // every wheel of every rider at once: one draw call a rider for two wheels, and nothing to place each frame.
  private readonly spokeDisc = wheelSides();
  private readonly spokeTexture = wheelTexture();
  private readonly spokes = new MeshStandardMaterial({
    map: this.spokeTexture,
    alphaTest: 0.5,
    side: DoubleSide,
    roughness: 0.35,
  });
  // The bikes' lights, where the course is ridden at night: the glow of the rear lamp, and the pools the rear and
  // front lamps throw on the road.
  private readonly glowTexture: CanvasTexture | null = null;
  private readonly glow: MeshBasicMaterial | null = null;
  private readonly lampGlow: BufferGeometry | null = null;
  private readonly roadGlow: BufferGeometry | null = null;

  /**
   * `plain` draws everything coloured by vertex: the renderer's own material for the riders. With `lights` the bikes
   * carry lights that are on: a course ridden at night.
   */
  constructor(
    private readonly plain: Material,
    /** The riders' body, loaded from its file (rider-body.ts). */
    readonly body: RiderBody,
    lights = false,
    /** A simple build, for a slow device: the lamps throw no pools on the road. */
    readonly simple = false,
  ) {
    this.spokeTexture.center.set(0.5, 0.5);
    if (!lights) return;
    this.glowTexture = glowTexture();
    this.glow = new MeshBasicMaterial({
      map: this.glowTexture,
      vertexColors: true,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    this.lampGlow = lampGlowShape();
    this.roadGlow = roadGlowShape();
  }

  /**
   * A rider in `jersey`, race `number` pinned to their back; `lit` false leaves their bike's lights off. `detail`
   * is how finely they are made, 1 for the finest: less for a rider seen from further off or on a slower device.
   */
  make(jersey: Color, number: number, lit = true, detail = 1): RiderModel {
    return new CourseCyclist(this, this.plain, jersey, number, lit, detail);
  }

  /** How shaded each vertex of a rider's still meshes is (rider-shade.ts), by the meshes' sizes. */
  private readonly shades = new Map<string, Float32Array[]>();

  /**
   * Darkens the colours of a rider's still meshes where the parts stand close over one another. Every rider has the
   * same shape, so the shade is worked out once.
   */
  shade(meshes: readonly BufferGeometry[]): void {
    const counts = meshes.map((mesh) => mesh.getAttribute('position').count);
    // One working-out for each fineness riders are made at: the shape is the same, its vertices are not.
    const key = counts.join(',');
    let shades = this.shades.get(key);
    if (!shades) {
      const total = counts.reduce((sum, count) => sum + count, 0);
      const positions = new Float32Array(total * 3);
      const normals = new Float32Array(total * 3);
      let at = 0;
      for (const mesh of meshes) {
        positions.set(mesh.getAttribute('position').array, at);
        normals.set(mesh.getAttribute('normal').array, at);
        at += mesh.getAttribute('position').count * 3;
      }
      // One sample a triangle, at its middle.
      const middles = meshes.map(triangleMiddles);
      const samples = new Float32Array(middles.reduce((sum, part) => sum + part.length, 0));
      let filled = 0;
      for (const part of middles) {
        samples.set(part, filled);
        filled += part.length;
      }
      const all = occlusion(positions, normals, SHADE_REACH, samples);
      let from = 0;
      shades = counts.map((count) => all.slice(from, (from += count)));
      this.shades.set(key, shades);
    }
    const made = shades;
    meshes.forEach((mesh, m) => {
      const colour = mesh.getAttribute('color');
      const shade = made[m]!;
      for (let i = 0; i < shade.length; i++) {
        const lit = 1 - SHADE_DEPTH * shade[i]!;
        colour.setXYZ(i, colour.getX(i) * lit, colour.getY(i) * lit, colour.getZ(i) * lit);
      }
    });
  }

  /** Turns every rider's wheels to where they are after `metres` of road. */
  roll(metres: number): void {
    this.spokeTexture.rotation = (metres / WHEEL) % (Math.PI * 2);
  }

  /** The shared shapes a rider is put together from. */
  shapes() {
    return {
      crank: this.crank,
      pedal: this.pedal,
      spokeDisc: this.spokeDisc,
      spokes: this.spokes,
      glow: this.glow,
      lampGlow: this.lampGlow,
      roadGlow: this.roadGlow,
    };
  }

  dispose(): void {
    for (const d of [
      this.crank,
      this.pedal,
      this.spokeDisc,
      this.spokeTexture,
      this.spokes,
      this.glowTexture,
      this.glow,
      this.lampGlow,
      this.roadGlow,
    ]) {
      d?.dispose();
    }
  }
}

class CourseCyclist implements RiderModel {
  readonly group = new Group();
  readonly owned: { dispose(): void }[] = [];
  readonly still: Mesh;
  /** Bike and rider together: it rocks under the pedalling, inside the group the renderer places and leans. */
  private readonly rig = new Group();
  private readonly legs: { foot: Mesh; crank: Mesh; pedal: Mesh; side: number }[] = [];
  private readonly pedalAt = new Vector3();
  /** Plays the body's baked turn of the cranks: in the saddle, and out of it. */
  private readonly mixer: AnimationMixer;
  private readonly seated: AnimationAction;
  private readonly standing: AnimationAction;
  /** The bone the head turns with, and how it lies at rest in the rider's own axes. */
  private readonly head: Bone;
  private readonly headRest = new Quaternion();
  private readonly headTurn = new Quaternion();
  private readonly headAngles = new Euler(0, 0, 0, 'YXZ');
  /** The pools the bike's lights throw on the road, at night. */
  private road: Mesh | null = null;
  private readonly from = new Vector3();
  private readonly to = new Vector3();

  constructor(
    kit: CourseCyclistKit,
    plain: Material,
    jersey: Color,
    number: number,
    lit: boolean,
    detail: number,
  ) {
    // Everything made from here to the end of this rider is made this finely.
    fineness = detail;
    const shapes = kit.shapes();
    const look = riderLook(number);
    const colours = palette(look);
    // Taller and shorter riders, each on a bike their size.
    // And slighter and broader ones: a rider's build is their width for their height. The bike is as narrow as
    // a bike is, so the difference shows in the rider.
    this.rig.scale.set(look.scale * look.build, look.scale, look.scale);
    this.group.add(this.rig);
    const still = mergeGeometries(bike(colours), false)!;
    this.still = new Mesh(still, plain);
    this.rig.add(this.still);
    this.owned.push(still);

    // The body: one skin on its own bones, the finer of its two finenesses for a rider made at the finest. Its
    // trunk and sleeves are drawn with the rider's own kit (its panels, pockets and lettering); the rest is painted
    // in their skin, their shorts, their socks, their gloves and their hair.
    const body = kit.body.make(detail >= 1);
    const fabric = new MeshStandardMaterial({
      map: kitTexture(jersey, look.design, new Color(look.trim), number),
      roughness: 0.62,
      vertexColors: true,
    });
    paint(body.plain.geometry, colours);
    paint(body.kit.geometry, colours);
    body.plain.material = plain;
    body.kit.material = fabric;
    this.rig.add(body.root);
    this.owned.push(...body.owned, fabric, fabric.map!);
    // The helmet, with its cradle and straps: it turns with the head.
    const shell = helmet(jersey);
    const worn = mergeGeometries(shell, false)!;
    for (const piece of shell) piece.dispose();
    this.owned.push(worn);
    // Where the parts meet they shade one another: worked out once for the shape every rider shares.
    kit.shade([still, body.plain.geometry, body.kit.geometry, worn]);
    // The head's bone as the body was made, in the rider's own axes: the helmet is hung on it where it was made.
    body.root.updateMatrixWorld(true);
    this.head = body.head;
    this.head.getWorldQuaternion(this.headRest);
    const hat = new Mesh(worn, plain);
    hat.matrixAutoUpdate = false;
    hat.matrix.copy(this.head.matrixWorld).invert();
    this.head.add(hat);

    this.mixer = new AnimationMixer(body.root);
    this.seated = this.mixer.clipAction(kit.body.seated).play();
    this.standing = this.mixer.clipAction(kit.body.standing).play();
    const mixer = this.mixer;
    this.owned.push({
      dispose: () => {
        mixer.stopAllAction();
        mixer.uncacheRoot(body.root);
      },
    });

    // The wheels' sides: both wheels' discs, with their rims, decals and spokes, as one mesh (the kit turns them).
    this.rig.add(new Mesh(shapes.spokeDisc, shapes.spokes));

    // The bike's lights: the rear lamp's glow rides with the bike; the pools of light lie on the road, so they
    // are kept level when the rider leans.
    if (lit && shapes.glow && shapes.lampGlow && shapes.roadGlow) {
      this.rig.add(new Mesh(shapes.lampGlow, shapes.glow));
      if (!kit.simple) {
        this.road = new Mesh(shapes.roadGlow, shapes.glow);
        this.group.add(this.road);
      }
    }
    // The shoes are the rider's own.
    const shoe = shoeShape(colours);
    this.owned.push(shoe);
    for (const side of [-1, 1]) {
      const part = (shape: BufferGeometry) => {
        const mesh = new Mesh(shape, plain);
        // The pedalling moves it: the renderer draws every rider's such parts as one (rider-batch.ts).
        mesh.userData['moving'] = true;
        mesh.matrixAutoUpdate = false;
        this.rig.add(mesh);
        return mesh;
      };
      this.legs.push({
        foot: part(shoe),
        crank: part(shapes.crank),
        pedal: part(shapes.pedal),
        side,
      });
    }
    this.pose(0);
    fineness = 1;
  }

  pose(angle: number, standing = 0): void {
    // The bike rocks a little under each pedal stroke, about where the tyres meet the road. The rider's own
    // movement over it (the legs' turn, the shoulders' sway, the back's rise and fall, and out of the saddle the
    // hips lifting and the shoulders coming forward over the bars) is the body's baked turn of the cranks, in the
    // saddle and out of it, mixed by how far out of the saddle the rider is.
    const stroke = Math.sin(angle);
    const out = Math.min(Math.max(standing, 0), 1);
    const at = turnTime(angle, TURN_SECONDS);
    this.seated.time = at;
    this.standing.time = at;
    this.seated.setEffectiveWeight(1 - out);
    this.standing.setEffectiveWeight(out);
    this.mixer.update(0);
    // The head stays level while the bike leans and rocks under it, as a rider's does, and looks into the bend.
    const lean = this.group.rotation.z;
    this.headAngles.set(
      0,
      Math.min(Math.max(lean * HEAD_LOOKS, -0.5), 0.5),
      -(lean + stroke * (ROCK + ROCK_STANDING * out)) * HEAD_LEVEL,
    );
    // That turn is in the rider's own axes; the bone takes it in its own.
    this.headTurn
      .setFromEuler(this.headAngles)
      .multiply(this.headRest)
      .premultiply(SCRATCH_Q.copy(this.headRest).invert());
    this.head.quaternion.multiply(this.headTurn);
    // The renderer has leant the rider into the bend; the light on the road stays flat on it.
    if (this.road) this.road.rotation.z = -this.group.rotation.z;
    // Out of the saddle the bike is thrown from side to side under the rider, who stays over it.
    this.rig.rotation.z = stroke * (ROCK + ROCK_STANDING * out);
    this.legs.forEach((leg, i) => this.pedal(leg, angle + i * Math.PI));
  }

  /** One crank, its pedal and the shoe on it, with the crank at `a`. */
  private pedal(leg: (typeof this.legs)[number], a: number): void {
    const pedal = this.pedalAt.set(
      leg.side * PEDAL_OUT,
      BB.y - Math.cos(a) * CRANK,
      BB.z - Math.sin(a) * CRANK,
    );
    between(
      this.from.copy(BB).setX(leg.side * 0.075),
      this.to.copy(pedal).setX(leg.side * 0.075),
      leg.crank.matrix,
    );
    leg.pedal.matrix
      .makeRotationZ(Math.PI / 2)
      .setPosition(leg.side * (PEDAL_OUT - 0.005), pedal.y, pedal.z);
    // The foot rides the pedal by its ball, toe dipping through the bottom of the stroke and lifting over the
    // top, as a rider ankles (tools/blender/rider.py holds the body's ankle to the same).
    const pitch = -0.22 - 0.2 * Math.cos(a - 0.5);
    leg.foot.matrix.makeRotationX(pitch).setPosition(pedal.x, pedal.y + 0.012, pedal.z);
  }
}

/** The finish of each part of the body, by the part of the kit it is. */
const BODY_FINISH: Readonly<Record<BodyRegion, Color>> = {
  skin: SKIN,
  shorts: SHORTS,
  gripper: GRIPPER,
  sock: SOCK,
  glove: GLOVE,
  hair: HAIR,
  kit: SHORTS,
};

/**
 * Paints a body's mesh in a rider's colours: each vertex's marker (rider-turn.ts) names its part, and is given that
 * part's colour and finish. What the kit's texture is drawn on is left white, for the texture to colour.
 */
function paint(geometry: BufferGeometry, look: Palette): void {
  const marker = geometry.getAttribute('color');
  const count = geometry.getAttribute('position').count;
  const colours = new Float32Array(count * 3);
  const finishes = new Float32Array(count * 2);
  const white = new Color(1, 1, 1);
  const own: Readonly<Record<BodyRegion, Color>> = {
    skin: look.skin,
    shorts: SHORTS,
    gripper: GRIPPER,
    sock: look.sock,
    glove: GLOVE,
    hair: look.hair,
    kit: white,
  };
  for (let i = 0; i < count; i++) {
    const region = regionOf(marker.getX(i), marker.getY(i), marker.getZ(i));
    const colour = own[region];
    colours.set([colour.r, colour.g, colour.b], i * 3);
    if (region === 'kit') finishes[i * 2] = CLOTH_GLOSS;
    else finishes.set(finishOf(BODY_FINISH[region]), i * 2);
  }
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  geometry.setAttribute('finish', new BufferAttribute(finishes, 2));
}

/** The bike's still parts, in the rider's own axes. */
function bike(look: Palette): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  const stick = (a: Vector3, b: Vector3, from: number, to: number, colour: Color, around = 8) => {
    const piece = tube(a.distanceTo(b), from, to, colour, around);
    piece.applyMatrix4(between(a, b));
    parts.push(piece);
  };
  const placed = (shape: BufferGeometry, colour: Color, matrix: Matrix4) => {
    const piece = solid(shape, colour);
    piece.applyMatrix4(matrix);
    parts.push(piece);
  };
  const acrossAt = (at: Vector3) => new Matrix4().makeRotationZ(Math.PI / 2).setPosition(at);
  const wheelAt = (at: Vector3) => new Matrix4().makeRotationY(Math.PI / 2).setPosition(at);

  // The frame's main triangle, the stays and the fork.
  stick(BB, SEAT, 0.02, 0.017, look.frame);
  stick(SEAT, HEAD_TOP, 0.019, 0.017, look.frame);
  stick(BB, HEAD_BOTTOM, 0.027, 0.023, look.frame, 10);
  stick(
    HEAD_BOTTOM.clone().add(new Vector3(0, -0.02, -0.006)),
    HEAD_TOP.clone().add(new Vector3(0, 0.02, 0.006)),
    0.024,
    0.024,
    look.frame,
    10,
  );
  for (const x of [-1, 1]) {
    stick(BB.clone().setX(x * 0.03), REAR.clone().setX(x * 0.066), 0.014, 0.01, look.frame, 6);
    stick(
      SEAT.clone().add(new Vector3(x * 0.02, -0.03, 0)),
      REAR.clone().setX(x * 0.066),
      0.01,
      0.008,
      look.frame,
      6,
    );
    const crown = HEAD_BOTTOM.clone().add(new Vector3(x * 0.045, -0.035, -0.012));
    stick(crown, FRONT.clone().setX(x * 0.052), 0.016, 0.009, look.frame, 6);
    stick(
      HEAD_BOTTOM.clone().add(new Vector3(0, -0.02, -0.006)),
      crown,
      0.02,
      0.016,
      look.frame,
      6,
    );
  }
  // Seat post, saddle: a narrow nose widening to the tail.
  stick(SEAT, SEAT.clone().add(new Vector3(0, 0.115, 0.033)), 0.0135, 0.0135, look.frame);
  const saddle = loft(
    [
      { t: 0, rx: 0.016, rz: 0.012 },
      { t: 0.35, rx: 0.026, rz: 0.014 },
      { t: 0.7, rx: 0.062, rz: 0.017 },
      { t: 1, rx: 0.07, rz: 0.012 },
    ],
    0.27,
    () => SADDLE,
    10,
  );
  saddle.applyMatrix4(between(new Vector3(0, 0.928, 0.1), new Vector3(0, 0.936, 0.37)));
  parts.push(saddle);
  // Stem and drop bars: the tops, the reach to the hoods, the drops curling down and back; the brake hoods.
  stick(HEAD_TOP.clone().add(new Vector3(0, 0.035, 0.008)), BAR, 0.017, 0.015, look.frame);
  stick(BAR.clone().setX(-0.2), BAR.clone().setX(0.2), 0.0125, 0.0125, TAPE);
  for (const x of [-1, 1]) {
    const top = BAR.clone().setX(x * 0.2);
    const reach = top.clone().add(new Vector3(0, 0.002, -0.075));
    const curve = reach.clone().add(new Vector3(0, -0.06, -0.025));
    const drop = reach.clone().add(new Vector3(0, -0.125, 0.015));
    const end = reach.clone().add(new Vector3(0, -0.132, 0.1));
    stick(top, reach, 0.0125, 0.0125, TAPE);
    stick(reach, curve, 0.0125, 0.0125, TAPE);
    stick(curve, drop, 0.0125, 0.0125, TAPE);
    stick(drop, end, 0.0125, 0.0125, TAPE);
    const hood = HOOD.clone().setX(x * 0.2);
    stick(reach.clone().add(new Vector3(0, 0.005, 0.01)), hood, 0.019, 0.015, SOLE, 8);
    stick(
      hood.clone().add(new Vector3(0, -0.01, -0.012)),
      hood.clone().add(new Vector3(0, -0.115, 0.004)),
      0.007,
      0.006,
      STEEL,
      6,
    );
  }
  // Wheels: tyre, a deep rim, the hub.
  for (const axle of [FRONT, REAR]) {
    placed(new TorusGeometry(WHEEL - 0.013, 0.0135, fine(8), fine(40, 18)), TYRE, wheelAt(axle));
    const rim = solid(new TorusGeometry(WHEEL - 0.046, 0.022, 6, fine(40, 18)), RIM);
    rim.applyMatrix4(new Matrix4().makeScale(1, 1, 0.5));
    rim.applyMatrix4(wheelAt(axle));
    parts.push(rim);
    // The hub: a slim dark shell between the fork's ends, its skewer's steel ends showing either side.
    placed(new CylinderGeometry(0.014, 0.014, 0.1, 8), RIM, acrossAt(axle));
    for (const x of [-0.058, 0.058]) {
      placed(new CylinderGeometry(0.007, 0.007, 0.012, 6), STEEL, acrossAt(axle.clone().setX(x)));
    }
  }
  // The drivetrain, on the right: chainring, cassette, the derailleur hanging below it, the chain's two runs.
  placed(new CylinderGeometry(0.098, 0.098, 0.005, 28), RIM, acrossAt(BB.clone().setX(0.052)));
  placed(new CylinderGeometry(0.03, 0.03, 0.09, 10), look.frame, acrossAt(BB));
  // The cassette: seven sprockets, each a thin disc, the largest against the wheel.
  for (let i = 0; i < 7; i++) {
    const radius = 0.054 - i * 0.0042;
    placed(
      new CylinderGeometry(radius, radius, 0.0022, fine(20, 8)),
      SPROCKET,
      acrossAt(REAR.clone().setX(0.026 + i * 0.0048)),
    );
  }
  // The rear derailleur: its body behind the axle, and the cage hanging forward of it with a jockey wheel at each
  // end, which the chain runs round.
  const hanger = REAR.clone().add(new Vector3(0.062, -0.03, 0.012));
  const upper = REAR.clone().add(new Vector3(0.05, -0.065, -0.004));
  const lower = REAR.clone().add(new Vector3(0.05, -0.132, -0.03));
  stick(REAR.clone().setX(0.062), hanger, 0.01, 0.012, SOLE, 6);
  stick(hanger, upper.clone().setX(0.06), 0.012, 0.009, SOLE, 6);
  stick(upper.clone().setX(0.058), lower.clone().setX(0.058), 0.006, 0.006, SOLE, 5);
  for (const wheel of [upper, lower]) {
    placed(new CylinderGeometry(0.02, 0.02, 0.005, 12), CHAIN, acrossAt(wheel));
  }
  // The chain: over the chainring to the cassette, back under from the lower jockey wheel.
  stick(
    new Vector3(0.052, BB.y + 0.097, BB.z),
    REAR.clone().add(new Vector3(0.045, 0.044, 0)),
    0.0045,
    0.0045,
    CHAIN,
    4,
  );
  stick(
    new Vector3(0.052, BB.y - 0.097, BB.z),
    lower.clone().add(new Vector3(0, -0.018, 0)),
    0.0045,
    0.0045,
    CHAIN,
    4,
  );
  // The lamps: one on the seat post facing back, one under the stem facing ahead.
  stick(
    REAR_LAMP.clone().add(new Vector3(0, -0.02, -0.02)),
    REAR_LAMP.clone().add(new Vector3(0, 0.02, -0.005)),
    0.016,
    0.016,
    SOLE,
    6,
  );
  stick(
    BAR.clone().add(new Vector3(0, -0.03, -0.01)),
    BAR.clone().add(new Vector3(0, -0.03, -0.07)),
    0.016,
    0.02,
    SOLE,
    6,
  );
  // A bottle in its cage on the down tube.
  const down = HEAD_BOTTOM.clone().sub(BB).normalize();
  const foot = BB.clone()
    .addScaledVector(down, 0.2)
    .add(new Vector3(0, 0.04, 0.012));
  stick(foot, foot.clone().addScaledVector(down, 0.17), 0.035, 0.035, BOTTLE, 10);
  stick(
    foot.clone().addScaledVector(down, 0.17),
    foot.clone().addScaledVector(down, 0.21),
    0.035,
    0.018,
    SOLE,
    10,
  );
  return parts;
}

/**
 * The helmet, coloured by vertex, which turns with the head: a road helmet's shell, its cradle on the nape and its
 * straps down past each ear to the chin.
 */
function helmet(jersey: Color): BufferGeometry[] {
  const parts: BufferGeometry[] = [];
  const placed = (piece: BufferGeometry, matrix: Matrix4) => {
    piece.applyMatrix4(matrix);
    parts.push(piece);
  };
  const ball = (at: Vector3, size: Vector3, colour: Color, lat = 10) => {
    const piece = solid(new SphereGeometry(1, fine(14, 7), fine(lat, 4)), colour);
    piece.applyMatrix4(new Matrix4().makeScale(size.x, size.y, size.z));
    return { piece, at };
  };
  const skull = HEAD.clone();
  const cradle = ball(
    skull.clone().add(new Vector3(0, -0.04, 0.094)),
    new Vector3(0.036, 0.016, 0.012),
    VENT,
    6,
  );
  placed(cradle.piece, new Matrix4().setPosition(cradle.at));
  for (const side of [-1, 1]) {
    for (const z of [0.03, -0.035]) {
      const top = skull.clone().add(new Vector3(side * 0.082, 0.022, z));
      const chin = skull.clone().add(new Vector3(side * 0.058, -0.088, -0.03));
      const strap = tube(top.distanceTo(chin), 0.005, 0.005, VENT, 4);
      placed(strap, between(top, chin));
    }
  }
  // The helmet: a road helmet's long low shell from the brow to a tail raised behind, in the rider's colour with a
  // pale tail, lacquered; five vents run along its crown, dark, and a dark rim under its edge. A loft from front to
  // back: laid that way its +z points down, so the crown is three quarters of the way round it.
  const lacquer = jersey.clone();
  const tail = jersey.clone().lerp(new Color(0xffffff), 0.8);
  FINISHES.set(lacquer, LACQUER);
  FINISHES.set(tail, LACQUER);
  const brow = skull.clone().add(new Vector3(0, 0.03, -0.138));
  const stern = skull.clone().add(new Vector3(0, 0.066, 0.168));
  const shell = loft(
    [
      { t: 0, rx: 0.03, rz: 0.018, z: 0.012 },
      { t: 0.07, rx: 0.068, rz: 0.044, z: 0.006 },
      { t: 0.24, rx: 0.09, rz: 0.068 },
      { t: 0.48, rx: 0.097, rz: 0.078 },
      { t: 0.72, rx: 0.09, rz: 0.07, z: 0.004 },
      { t: 0.9, rx: 0.064, rz: 0.046, z: 0.008 },
      { t: 1, rx: 0.026, rz: 0.018, z: 0.012 },
    ],
    brow.distanceTo(stern),
    (t, round) => {
      // How far round from the crown, 0 at the crown to 0.25 at either edge.
      const off = Math.abs(round - 0.75);
      if (off > 0.25) return VENT;
      if (off > 0.215) return VENT;
      const vent = [0, 0.075, 0.15].some((at) => Math.abs(off - at) < 0.018);
      if (vent && t > 0.14 && t < 0.88) return VENT;
      return t > 0.93 ? tail : lacquer;
    },
    28,
  );
  placed(shell, between(brow, stern));

  return parts;
}

/** The share of the kit's texture, from its left, that wraps the trunk; the rest is the sleeve. */
const KIT_TRUNK = 0.7;

/**
 * A rider's kit, drawn in their colour: the trunk's wrap on the left (the middle of the chest a quarter of the
 * way across it and the middle of the back three quarters, the pelvis at the bottom and the collar at the top) and the sleeve
 * on the right (the shoulder at the bottom, the cuff at the top). Bib shorts to the waist; a pale hem; darker side
 * panels; three pockets across the small of the back; the team's name between the shoulders; a pale collar; a
 * dark cuff with a pale line.
 */
function kitTexture(
  jersey: Color,
  design: KitDesign,
  second: Color,
  number: number,
): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const css = (c: Color) => `#${c.getHexString()}`;
    const main = css(jersey);
    const dark = css(jersey.clone().multiplyScalar(0.5));
    const deep = css(jersey.clone().multiplyScalar(0.72));
    const pale = css(jersey.clone().lerp(new Color(0xffffff), 0.62));
    const trunk = size * KIT_TRUNK;
    /** Canvas y for a height up the trunk or along the sleeve, 0 to 1. */
    const y = (v: number) => (1 - v) * size;
    const back = trunk * 0.75;
    ctx.fillStyle = main;
    ctx.fillRect(0, 0, size, size);
    // Side panels, under each arm from the hem to the armpit.
    ctx.fillStyle = deep;
    for (const x of [0, trunk * 0.5, trunk]) ctx.fillRect(x - 24, y(0.78), 48, y(0.266) - y(0.78));
    // The design the jersey is cut to, in the rider's second colour: a hoop round the chest and back, bold panels
    // down each side, or a sash from one hip to the other shoulder, on the back and on the chest. (A yoke is drawn
    // on every design, below.)
    const trim = css(second);
    ctx.fillStyle = trim;
    if (design === 'hoop') {
      ctx.fillRect(0, y(0.66), trunk, y(0.5) - y(0.66));
      ctx.fillStyle = pale;
      ctx.fillRect(0, y(0.665), trunk, 3);
      ctx.fillRect(0, y(0.5) - 3, trunk, 3);
    } else if (design === 'panels') {
      for (const x of [0, trunk * 0.5, trunk]) ctx.fillRect(x - 44, y(0.9), 88, y(0.266) - y(0.9));
    } else if (design === 'sash') {
      for (const middle of [back, trunk * 0.25]) {
        ctx.beginPath();
        ctx.moveTo(middle - 80, y(0.3));
        ctx.lineTo(middle - 48, y(0.3));
        ctx.lineTo(middle + 80, y(0.86));
        ctx.lineTo(middle + 48, y(0.86));
        ctx.closePath();
        ctx.fill();
      }
    }
    // A darker yoke over the shoulders, and the name under it.
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, trunk, y(0.9));
    ctx.fillStyle = '#f6f6f2';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TELO', back, y(0.76));
    ctx.fillRect(back - 40, y(0.7), 80, 5);
    ctx.fillRect(back - 40, y(0.675), 80, 2);
    // The same on the chest.
    ctx.fillText('TELO', trunk * 0.25, y(0.7));
    // Three pockets across the small of the back: their top edge, and the seams between them.
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(back - 62, y(0.44));
    ctx.lineTo(back + 62, y(0.44));
    for (const x of [-62, -21, 21, 62]) {
      ctx.moveTo(back + x, y(0.44));
      ctx.lineTo(back + x, y(0.285));
    }
    ctx.stroke();
    // The collar, the hem, and the shorts below it with a pale mark on the seat.
    ctx.fillStyle = pale;
    ctx.fillRect(0, 0, trunk, y(0.965));
    ctx.fillRect(0, y(0.266), trunk, y(0.24) - y(0.266));
    ctx.fillStyle = '#121316';
    ctx.fillRect(0, y(0.24), trunk, size - y(0.24));
    ctx.fillStyle = '#3a3d44';
    ctx.fillRect(back - 16, y(0.17), 32, 7);
    // The sleeve: the cuff dark, a pale line above it.
    ctx.fillStyle = main;
    ctx.fillRect(trunk, 0, size - trunk, size);
    // A yoke's sleeve ends in a dark cuff; the other designs' sleeves are in the second colour from the elbow
    // side of the shoulder down.
    ctx.fillStyle = design === 'yoke' ? dark : trim;
    ctx.fillRect(trunk, 0, size - trunk, y(design === 'yoke' ? 0.8 : 0.45));
    ctx.fillStyle = pale;
    ctx.fillRect(trunk, y(design === 'yoke' ? 0.8 : 0.45), size - trunk, 6);
    cloth(ctx, size, trunk, back, y);
    // The race number, pinned over the pockets where a number is worn: painted on the kit, so it follows the back
    // and costs nothing to draw. 16 cm by 11.5 cm; the trunk's wrap is some 420 px a metre round it and 800 px a
    // metre up it, so the plate is drawn 67 px by 92 px and its digits stretched to match.
    const plate = { wide: 67, tall: 92, at: y(0.345) };
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(back - plate.wide / 2, plate.at - plate.tall / 2, plate.wide, plate.tall);
    ctx.fillStyle = '#9aa0a6';
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        ctx.fillRect(
          back + sx * (plate.wide / 2 - 5) - 2,
          plate.at + sy * (plate.tall / 2 - 7) - 3,
          4,
          6,
        );
      }
    }
    ctx.save();
    ctx.translate(back, plate.at + 4);
    ctx.scale(1, 1.9);
    ctx.fillStyle = '#16171a';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), 0, 0);
    ctx.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * What makes the painted kit cloth on a body: the back's own shape showing through (the spine's hollow, the
 * shoulder blades), folds drawn in at the waist and the armpits, the shadow under the pockets' top edge and the
 * swell of what is in them, mesh in the side panels, the shorts' seams and sheen, and the grain of the knit. Light
 * and dark only, laid over the colours already there.
 */
function cloth(
  ctx: CanvasRenderingContext2D,
  size: number,
  trunk: number,
  back: number,
  y: (v: number) => number,
): void {
  const soft = (blur: number) => (ctx.filter = `blur(${blur}px)`);
  const dark = (alpha: number) => `rgba(0, 0, 0, ${alpha})`;
  const light = (alpha: number) => `rgba(255, 255, 255, ${alpha})`;
  const blob = (x: number, at: number, rx: number, ry: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, at, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const stroke = (points: readonly (readonly [number, number])[], width: number, style: string) => {
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach(([x, at], i) => (i ? ctx.lineTo(x, at) : ctx.moveTo(x, at)));
    ctx.stroke();
  };
  ctx.save();
  // Only the trunk's share of the canvas for what belongs to the trunk.
  ctx.beginPath();
  ctx.rect(0, 0, trunk, size);
  ctx.clip();

  // The back under the jersey: the spine's hollow, the shoulder blades either side, the small of the back.
  soft(7);
  stroke(
    [
      [back, y(0.9)],
      [back, y(0.46)],
    ],
    9,
    dark(0.22),
  );
  for (const side of [-1, 1]) {
    blob(back + side * 44, y(0.8), 26, 34, light(0.13));
    blob(back + side * 30, y(0.56), 20, 40, light(0.07));
    // Under each arm the cloth is in shade, on the back and on the chest.
    blob(back + side * 86, y(0.74), 16, 50, dark(0.2));
    blob(trunk * 0.25 + side * 86, y(0.74), 16, 50, dark(0.2));
  }
  // The chest: a hollow down the breastbone, the zip in it.
  stroke(
    [
      [trunk * 0.25, y(0.95)],
      [trunk * 0.25, y(0.3)],
    ],
    7,
    dark(0.14),
  );
  // Folds: the jersey gathers at the waist as the rider bends, and pulls from the armpits towards the spine.
  soft(2.5);
  for (const side of [-1, 1]) {
    for (const [from, to, rise, alpha] of [
      [78, 30, 0.035, 0.2],
      [72, 22, 0.02, 0.16],
      [80, 44, 0.05, 0.14],
    ] as const) {
      const at = 0.3 + rise;
      stroke(
        [
          [back + side * from, y(at + 0.03)],
          [back + side * (from + to) * 0.5, y(at + 0.012)],
          [back + side * to, y(at)],
        ],
        3.5,
        dark(alpha),
      );
      stroke(
        [
          [back + side * from, y(at + 0.042)],
          [back + side * to, y(at + 0.012)],
        ],
        2.5,
        light(alpha * 0.6),
      );
    }
    stroke(
      [
        [back + side * 84, y(0.8)],
        [back + side * 60, y(0.7)],
        [back + side * 40, y(0.66)],
      ],
      3,
      dark(0.16),
    );
    stroke(
      [
        [back + side * 82, y(0.72)],
        [back + side * 56, y(0.62)],
      ],
      3,
      dark(0.12),
    );
  }
  // The pockets: shade under their top edge, and each one filled out by what it holds.
  soft(3);
  ctx.fillStyle = dark(0.3);
  ctx.fillRect(back - 62, y(0.44) + 2, 124, 7);
  for (const [x, alpha] of [
    [-41, 0.12],
    [0, 0.16],
    [41, 0.1],
  ] as const) {
    blob(back + x, y(0.355), 15, 24, light(alpha));
    blob(back + x, y(0.3), 16, 8, dark(0.18));
  }
  // The shorts: a sheen over each side of the seat, the seam down the middle and the panels' seams beside it.
  soft(6);
  for (const side of [-1, 1]) blob(back + side * 34, y(0.13), 20, 30, light(0.1));
  soft(0.6);
  stroke(
    [
      [back, y(0.238)],
      [back, y(0)],
    ],
    1.5,
    light(0.16),
  );
  for (const side of [-1, 1]) {
    stroke(
      [
        [back + side * 52, y(0.238)],
        [back + side * 40, y(0.12)],
        [back + side * 46, y(0)],
      ],
      1.5,
      light(0.14),
    );
  }
  // Mesh in the side panels: rows of small holes.
  ctx.filter = 'none';
  ctx.fillStyle = dark(0.3);
  for (const x of [0, trunk * 0.5, trunk]) {
    for (let px = x - 21; px < x + 22; px += 5) {
      for (let py = y(0.77); py < y(0.275); py += 5) {
        ctx.fillRect(px + ((py / 5) % 2 ? 2 : 0), py, 2, 2);
      }
    }
  }
  ctx.restore();

  // The sleeve: its seam along the arm, and the cloth drawn in just above the cuff.
  soft(2);
  const sleeve = (trunk + size) / 2;
  stroke(
    [
      [sleeve, y(0.05)],
      [sleeve, y(0.8)],
    ],
    2,
    dark(0.16),
  );
  for (const v of [0.66, 0.72, 0.5]) {
    stroke(
      [
        [trunk + 14, y(v)],
        [size - 14, y(v + 0.04)],
      ],
      3,
      dark(0.12),
    );
  }
  ctx.filter = 'none';

  // The knit's grain: every pixel a little lighter or darker, the same for every rider.
  const image = ctx.getImageData(0, 0, size, size);
  const data = image.data;
  let seed = 1234567;
  for (let i = 0; i < data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const grain = 1 + ((seed >>> 16) / 65536 - 0.5) * 0.09;
    data[i] = Math.min(data[i]! * grain, 255);
    data[i + 1] = Math.min(data[i + 1]! * grain, 255);
    data[i + 2] = Math.min(data[i + 2]! * grain, 255);
  }
  ctx.putImageData(image, 0, 0);
}

/** A soft round glow, bright at its middle, for a lamp and for the light it throws. */
function glowTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const fade = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    fade.addColorStop(0, '#ffffff');
    fade.addColorStop(0.18, '#9a9a9a');
    fade.addColorStop(0.5, '#2a2a2a');
    fade.addColorStop(1, '#000000');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A flat piece of glow of one colour: a plane with its UV, coloured by vertex. */
function glowPlane(width: number, height: number, colour: Color, matrix: Matrix4): BufferGeometry {
  const plane = new PlaneGeometry(width, height);
  const geometry = plane.toNonIndexed();
  plane.dispose();
  geometry.deleteAttribute('normal');
  const count = geometry.getAttribute('position').count;
  const colours = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) colours.set([colour.r, colour.g, colour.b], i * 3);
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  geometry.applyMatrix4(matrix);
  return geometry;
}

/** Where the rear lamp is: on the seat post below the saddle, clear of the rider's seat. */
const REAR_LAMP = new Vector3(0, SEAT.y + 0.03, SEAT.z + 0.045);
const REAR_LIGHT = new Color(1, 0.06, 0.04);
const FRONT_LIGHT = new Color(1, 0.95, 0.82);

/** The rear lamp's glow, on the seat post, facing back. */
function lampGlowShape(): BufferGeometry {
  return glowPlane(
    0.3,
    0.3,
    REAR_LIGHT,
    new Matrix4().setPosition(REAR_LAMP.x, REAR_LAMP.y, REAR_LAMP.z + 0.03),
  );
}

/** The light the lamps throw on the road: a red pool behind the rear wheel, a pale one ahead of the front. */
function roadGlowShape(): BufferGeometry {
  const flat = new Matrix4().makeRotationX(-Math.PI / 2);
  const rear = glowPlane(
    1.3,
    2.6,
    REAR_LIGHT.clone().multiplyScalar(0.3),
    flat.clone().setPosition(0, 0.03, 1.7),
  );
  const front = glowPlane(
    2.2,
    6,
    FRONT_LIGHT.clone().multiplyScalar(0.22),
    flat.clone().setPosition(0, 0.03, -3.6),
  );
  const both = mergeGeometries([rear, front], false)!;
  rear.dispose();
  front.dispose();
  return both;
}

/** Both wheels' sides as one shape: a disc at each axle, standing in the bike's plane, each with the whole picture. */
function wheelSides(): BufferGeometry {
  const discs = [FRONT, REAR].map((axle) => {
    const disc = new CircleGeometry(WHEEL - 0.024, 40);
    disc.rotateY(Math.PI / 2);
    disc.translate(axle.x, axle.y, axle.z);
    return disc;
  });
  const both = mergeGeometries(discs, false)!;
  for (const disc of discs) disc.dispose();
  return both;
}

/**
 * A wheel's side, as a picture with holes: a deep carbon rim round the edge with two pale decals opposite one
 * another (so the eye can see it turn), twenty-four steel spokes laced to a hub, and nothing between the spokes.
 */
function wheelTexture(): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    ctx.clearRect(0, 0, size, size);
    // Spokes, hub to rim.
    ctx.strokeStyle = '#b9bdc2';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const hub = a + (i % 2 ? 0.45 : -0.45);
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(hub) * 16, c + Math.sin(hub) * 16);
      ctx.lineTo(c + Math.cos(a) * c * 0.86, c + Math.sin(a) * c * 0.86);
      ctx.stroke();
    }
    ctx.fillStyle = '#8f949a';
    ctx.beginPath();
    ctx.arc(c, c, 18, 0, Math.PI * 2);
    ctx.fill();
    // The rim: a band from 0.8 of the disc's radius to its edge.
    ctx.strokeStyle = '#17181c';
    ctx.lineWidth = c * 0.2;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    // Its decals: two pale arcs opposite one another, and a thin line round the brake track.
    ctx.strokeStyle = '#d9dbde';
    ctx.lineWidth = c * 0.075;
    for (const at of [0.3, 0.3 + Math.PI]) {
      ctx.beginPath();
      ctx.arc(c, c, c * 0.9, at, at + 0.62);
      ctx.stroke();
    }
    ctx.strokeStyle = '#3a3d44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.985, 0, Math.PI * 2);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
