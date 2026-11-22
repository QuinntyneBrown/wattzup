// The rider a course is ridden by (L2-166 AC26): a cyclist with the shape of a body, on a road bike with the
// proportions of one, in place of the figure of capsules the class worlds draw (world-cyclist.ts, which is theirs and
// is left alone). Every limb is a lofted tube whose section follows the muscle under it; the trunk is one loft from
// the pelvis to the neck along the curve of a bent back; the bike is its eleven tubes, bars, saddle, wheels and
// drivetrain. The colours are in the vertices: skin, bib shorts with their grippers, socks, shoes, gloves and the
// rider's jersey, so everything that never moves against the bike is one mesh and one draw call, and what the
// pedalling moves (thighs, shins, feet, cranks, pedals) is a handful of meshes the renderer draws as one
// (rider-batch.ts). The bike points along -z, as the cyclist kit's.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from 'three/webgpu';

/** What the course's renderer asks of a rider: where it stands, and how it pedals. */
export interface RiderModel {
  readonly group: Group;
  /** Turns the cranks to `angle` radians and moves the legs with them. */
  pose(angle: number): void;
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

// The rider: hips on the saddle, back at some forty degrees, hands on the hoods.
const HIP = new Vector3(0, 0.975, 0.21);
const SHOULDER = new Vector3(0, 1.3, -0.2);
const HEAD = new Vector3(0, 1.455, -0.345);
const THIGH = 0.43;
const SHIN = 0.43;
const UPPER_ARM = 0.29;
const FOREARM = 0.265;

const ACROSS = new Vector3(1, 0, 0);
/** The line from the hips to the hands, which the rider's sway turns about. */
const SPINE = new Vector3(0, HOOD.y - HIP.y, HOOD.z - HIP.z).normalize();
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

/** A part's finish: how glossy it is, 0 to 1, and how much of a metal. */
type Finish = readonly [gloss: number, metal: number];
/** Cloth, and whatever is not named below. */
const MATT: Finish = [0.22, 0];
/** A helmet's shell: lacquered plastic. */
const LACQUER: Finish = [0.9, 0];
const FINISHES = new Map<Color, Finish>([
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
  [SADDLE, [0.45, 0]],
  [VENT, [0.1, 0]],
  [BOTTLE, [0.7, 0]],
]);
const finishOf = (colour: Color): Finish => FINISHES.get(colour) ?? MATT;

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
 * colour for each section. Position, normal and colour, not indexed: every piece of the rider is made this way so
 * they can be merged.
 */
function loft(
  sections: readonly Section[],
  length: number,
  colour: (t: number) => Color,
  around = 12,
): BufferGeometry {
  const positions: number[] = [];
  const colours: number[] = [];
  const finishes: number[] = [];
  const index: number[] = [];
  for (const section of sections) {
    const c = colour(section.t);
    for (let s = 0; s < around; s++) {
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
    const c = colour(section.t);
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

/**
 * A tube as `loft` makes, open at both ends, with a UV in place of a colour: round the tube from `u0` to `u1`
 * (the back three quarters of the way from `u0`) and along it from 0 to 1. For what is drawn
 * with the kit's texture.
 */
function wrap(
  sections: readonly Section[],
  length: number,
  u0: number,
  u1: number,
  around = 16,
): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  const columns = around + 1;
  for (const section of sections) {
    // The seam's column is made twice, so the texture does not run backwards across the last strip.
    for (let s = 0; s < columns; s++) {
      const a = (s / around) * Math.PI * 2;
      positions.push(
        (section.x ?? 0) + Math.cos(a) * section.rx,
        section.t * length,
        (section.z ?? 0) + Math.sin(a) * section.rz,
      );
      // Round the other way from the angle, so what is written on the texture reads from outside the tube.
      uvs.push(u1 - (s / around) * (u1 - u0), section.t);
    }
  }
  for (let i = 0; i < sections.length - 1; i++) {
    for (let s = 0; s < around; s++) {
      const a = i * columns + s;
      index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  // The two copies of the seam share one normal, so no crease shows down it.
  const normal = geometry.getAttribute('normal');
  for (let i = 0; i < sections.length; i++) {
    const first = i * columns;
    const last = first + around;
    const x = normal.getX(first) + normal.getX(last);
    const y = normal.getY(first) + normal.getY(last);
    const z = normal.getZ(first) + normal.getZ(last);
    const size = Math.hypot(x, y, z) || 1;
    normal.setXYZ(first, x / size, y / size, z / size);
    normal.setXYZ(last, x / size, y / size, z / size);
  }
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
function between(a: Vector3, b: Vector3, across = ACROSS): Matrix4 {
  const y = b.clone().sub(a).normalize();
  const x = across.clone().addScaledVector(y, -across.dot(y));
  if (x.lengthSq() < 1e-8) x.set(0, 0, 1).addScaledVector(y, -y.z);
  x.normalize();
  const z = x.clone().cross(y);
  return new Matrix4().makeBasis(x, y, z).setPosition(a);
}

/** The middle joint of a two-bone limb from `a` to `c` (a knee, an elbow), bent towards `hint`. */
function bend(a: Vector3, c: Vector3, upper: number, lower: number, hint: Vector3): Vector3 {
  const ac = c.clone().sub(a);
  const d = Math.min(ac.length(), upper + lower - 1e-4);
  const along = (upper * upper - lower * lower + d * d) / (2 * d);
  const out = Math.sqrt(Math.max(upper * upper - along * along, 0));
  const dir = ac.normalize();
  const side = hint.clone().addScaledVector(dir, -hint.dot(dir)).normalize();
  return a.clone().addScaledVector(dir, along).addScaledVector(side, out);
}

// The legs' parts are the same for every rider, so they are made once.
/** The thigh, hip to knee: thick with the quadriceps at the top, narrowing to the knee; shorts to above the knee. */
const thighShape = () =>
  loft(
    [
      { t: 0, rx: 0.078, rz: 0.092 },
      { t: 0.12, rx: 0.086, rz: 0.098, z: -0.006 },
      { t: 0.4, rx: 0.08, rz: 0.09, z: -0.01 },
      { t: 0.74, rx: 0.062, rz: 0.068, z: -0.006 },
      { t: 0.78, rx: 0.061, rz: 0.066 },
      { t: 0.8, rx: 0.057, rz: 0.062 },
      { t: 0.93, rx: 0.052, rz: 0.058 },
      { t: 1, rx: 0.05, rz: 0.054 },
    ],
    THIGH,
    (t) => (t < 0.74 ? SHORTS : t < 0.8 ? GRIPPER : SKIN),
    14,
  );
/** The shin, knee to ankle: the kneecap, the calf swelling behind, the thin ankle; a sock to mid-calf. */
const shinShape = () =>
  loft(
    [
      { t: 0, rx: 0.05, rz: 0.055 },
      { t: 0.06, rx: 0.053, rz: 0.058, z: -0.004 },
      { t: 0.28, rx: 0.052, rz: 0.062, z: 0.014 },
      { t: 0.5, rx: 0.044, rz: 0.05, z: 0.01 },
      { t: 0.68, rx: 0.036, rz: 0.04, z: 0.004 },
      { t: 0.7, rx: 0.038, rz: 0.042, z: 0.004 },
      { t: 0.92, rx: 0.034, rz: 0.037 },
      { t: 1, rx: 0.036, rz: 0.04 },
    ],
    SHIN,
    (t) => (t < 0.69 ? SKIN : SOCK),
    12,
  );
/** A road shoe, heel to toe along +y, its sole dark: laid on the pedal by its ball. */
function shoeShape(): BufferGeometry {
  const upper = loft(
    [
      { t: 0, rx: 0.03, rz: 0.03, z: 0.012 },
      { t: 0.2, rx: 0.038, rz: 0.04, z: 0.018 },
      { t: 0.55, rx: 0.045, rz: 0.036, z: 0.012 },
      { t: 0.85, rx: 0.042, rz: 0.026, z: 0.006 },
      { t: 1, rx: 0.026, rz: 0.016, z: 0.002 },
    ],
    0.275,
    () => SHOE,
    10,
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
  private readonly thigh = thighShape();
  private readonly shin = shinShape();
  private readonly shoe = shoeShape();
  private readonly crank = tube(CRANK, 0.016, 0.012, STEEL);
  private readonly pedal = solid(new CylinderGeometry(0.012, 0.012, 0.09, 6), SOLE);
  private readonly spokeDisc = new CircleGeometry(WHEEL - 0.05, 32);
  private readonly spokeTexture = spokeTexture();
  private readonly spokes = new MeshBasicMaterial({
    color: 0x80868d,
    alphaMap: this.spokeTexture,
    alphaTest: 0.35,
    side: DoubleSide,
  });
  private readonly bibPlane = new PlaneGeometry(0.2, 0.15);

  /** `plain` draws everything coloured by vertex: the renderer's own material for the riders. */
  constructor(private readonly plain: Material) {}

  /** A rider in `jersey`, race `number` pinned to their back. */
  make(jersey: Color, number: number): RiderModel {
    return new CourseCyclist(this, this.plain, jersey, number);
  }

  /** The shared shapes a rider is put together from. */
  shapes() {
    return {
      thigh: this.thigh,
      shin: this.shin,
      shoe: this.shoe,
      crank: this.crank,
      pedal: this.pedal,
      spokeDisc: this.spokeDisc,
      spokes: this.spokes,
      bibPlane: this.bibPlane,
    };
  }

  dispose(): void {
    for (const d of [
      this.thigh,
      this.shin,
      this.shoe,
      this.crank,
      this.pedal,
      this.spokeDisc,
      this.spokeTexture,
      this.spokes,
      this.bibPlane,
    ]) {
      d.dispose();
    }
  }
}

class CourseCyclist implements RiderModel {
  readonly group = new Group();
  readonly owned: { dispose(): void }[] = [];
  readonly still: Mesh;
  /** Bike and rider together: it rocks under the pedalling, inside the group the renderer places and leans. */
  private readonly rig = new Group();
  /** The rider from the hips up: it sways against the bike about the line from the hips to the hands. */
  private readonly torso = new Group();
  private readonly legs: {
    thigh: Mesh;
    shin: Mesh;
    foot: Mesh;
    crank: Mesh;
    pedal: Mesh;
    side: number;
  }[] = [];
  private readonly pedalAt = new Vector3();
  private readonly ankle = new Vector3();
  private readonly hip = new Vector3();

  constructor(kit: CourseCyclistKit, plain: Material, jersey: Color, number: number) {
    const shapes = kit.shapes();
    const rider = body(jersey);
    this.group.add(this.rig);
    this.rig.add(this.torso);
    this.torso.position.copy(HIP);
    const still = mergeGeometries(bike(), false)!;
    this.still = new Mesh(still, plain);
    this.rig.add(this.still);
    const trunk = mergeGeometries(rider.still, false)!;
    trunk.translate(-HIP.x, -HIP.y, -HIP.z);
    this.torso.add(new Mesh(trunk, plain));
    this.owned.push(still, trunk);
    // The jersey and the shorts' seat: one mesh, drawn with the rider's own kit (its panels, pockets and lettering).
    const worn = mergeGeometries(rider.kit, false)!;
    const fabric = new MeshStandardMaterial({ map: kitTexture(jersey), roughness: 0.62 });
    worn.translate(-HIP.x, -HIP.y, -HIP.z);
    this.torso.add(new Mesh(worn, fabric));
    this.owned.push(worn, fabric, fabric.map!);
    for (const piece of [...rider.still, ...rider.kit]) piece.dispose();

    // Spokes: a disc a wheel, drawn through a mask of thirty-two of them.
    for (const axle of [FRONT, REAR]) {
      const disc = new Mesh(shapes.spokeDisc, shapes.spokes);
      disc.rotation.y = Math.PI / 2;
      disc.position.copy(axle);
      this.rig.add(disc);
    }

    // The race number, pinned low on the back.
    const up = SHOULDER.clone().sub(HIP).normalize();
    const back = new Vector3(0, -up.z, up.y);
    const cloth = new MeshStandardMaterial({ map: bibTexture(number), roughness: 0.85 });
    const bib = new Mesh(shapes.bibPlane, cloth);
    bib.position.set(0, 0, 0).addScaledVector(up, 0.2).addScaledVector(back, 0.153);
    bib.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), back);
    this.torso.add(bib);
    this.owned.push(cloth, cloth.map!);

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
        thigh: part(shapes.thigh),
        shin: part(shapes.shin),
        foot: part(shapes.shoe),
        crank: part(shapes.crank),
        pedal: part(shapes.pedal),
        side,
      });
    }
    this.pose(0);
  }

  pose(angle: number): void {
    // The bike rocks a little under each pedal stroke, about where the tyres meet the road; the rider's shoulders
    // sway the other way over it, about the line from the hips to the hands, and the back rises and falls a touch
    // twice a turn.
    const stroke = Math.sin(angle);
    this.rig.rotation.z = stroke * 0.03;
    this.torso.quaternion.setFromAxisAngle(SPINE, -stroke * 0.07);
    this.torso.position.copy(HIP).setY(HIP.y + Math.cos(angle * 2) * 0.004);
    this.legs.forEach((leg, i) => {
      const a = angle + i * Math.PI;
      const pedal = this.pedalAt.set(
        leg.side * PEDAL_OUT,
        BB.y - Math.cos(a) * CRANK,
        BB.z - Math.sin(a) * CRANK,
      );
      leg.crank.matrix.copy(
        between(BB.clone().setX(leg.side * 0.075), pedal.clone().setX(leg.side * 0.075)),
      );
      leg.pedal.matrix
        .makeRotationZ(Math.PI / 2)
        .setPosition(leg.side * (PEDAL_OUT - 0.005), pedal.y, pedal.z);
      // The foot rides the pedal by its ball, toe dipping through the bottom of the stroke and lifting over the
      // top, as a rider ankles; the ankle is above and behind the ball.
      const pitch = -0.22 - 0.2 * Math.cos(a - 0.5);
      leg.foot.matrix.makeRotationX(pitch).setPosition(pedal.x, pedal.y + 0.012, pedal.z);
      const ankle = this.ankle
        .set(0, 0.085, 0.115)
        .applyAxisAngle(ACROSS, pitch)
        .add(pedal)
        .setX(leg.side * (PEDAL_OUT - 0.01));
      const hip = this.hip.copy(HIP).add(new Vector3(leg.side * 0.085, -0.035, 0.005));
      // The knee tracks over the pedal, a touch out at the top of the stroke.
      const knee = bend(hip, ankle, THIGH, SHIN, new Vector3(leg.side * 0.05, 0.25, -1));
      leg.thigh.matrix.copy(between(hip, knee));
      leg.shin.matrix.copy(between(knee, ankle));
    });
  }
}

/** The bike's still parts, in the rider's own axes. */
function bike(): BufferGeometry[] {
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
  stick(BB, SEAT, 0.02, 0.017, FRAME);
  stick(SEAT, HEAD_TOP, 0.019, 0.017, FRAME);
  stick(BB, HEAD_BOTTOM, 0.027, 0.023, FRAME, 10);
  stick(
    HEAD_BOTTOM.clone().add(new Vector3(0, -0.02, -0.006)),
    HEAD_TOP.clone().add(new Vector3(0, 0.02, 0.006)),
    0.024,
    0.024,
    FRAME,
    10,
  );
  for (const x of [-1, 1]) {
    stick(BB.clone().setX(x * 0.03), REAR.clone().setX(x * 0.066), 0.014, 0.01, FRAME, 6);
    stick(
      SEAT.clone().add(new Vector3(x * 0.02, -0.03, 0)),
      REAR.clone().setX(x * 0.066),
      0.01,
      0.008,
      FRAME,
      6,
    );
    const crown = HEAD_BOTTOM.clone().add(new Vector3(x * 0.045, -0.035, -0.012));
    stick(crown, FRONT.clone().setX(x * 0.052), 0.016, 0.009, FRAME, 6);
    stick(HEAD_BOTTOM.clone().add(new Vector3(0, -0.02, -0.006)), crown, 0.02, 0.016, FRAME, 6);
  }
  // Seat post, saddle: a narrow nose widening to the tail.
  stick(SEAT, SEAT.clone().add(new Vector3(0, 0.115, 0.033)), 0.0135, 0.0135, FRAME);
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
  stick(HEAD_TOP.clone().add(new Vector3(0, 0.035, 0.008)), BAR, 0.017, 0.015, FRAME);
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
    placed(new TorusGeometry(WHEEL - 0.013, 0.0135, 8, 40), TYRE, wheelAt(axle));
    const rim = solid(new TorusGeometry(WHEEL - 0.046, 0.022, 6, 40), RIM);
    rim.applyMatrix4(new Matrix4().makeScale(1, 1, 0.5));
    rim.applyMatrix4(wheelAt(axle));
    parts.push(rim);
    placed(new CylinderGeometry(0.018, 0.018, 0.1, 8), STEEL, acrossAt(axle));
  }
  // The drivetrain, on the right: chainring, cassette, the derailleur hanging below it, the chain's two runs.
  placed(new CylinderGeometry(0.098, 0.098, 0.005, 28), RIM, acrossAt(BB.clone().setX(0.052)));
  placed(new CylinderGeometry(0.03, 0.03, 0.09, 10), FRAME, acrossAt(BB));
  placed(new CylinderGeometry(0.052, 0.034, 0.036, 16), STEEL, acrossAt(REAR.clone().setX(0.045)));
  const cage = REAR.clone().add(new Vector3(0.055, -0.1, -0.012));
  stick(REAR.clone().setX(0.055), cage, 0.012, 0.009, SOLE, 6);
  stick(
    new Vector3(0.052, BB.y + 0.097, BB.z),
    REAR.clone().add(new Vector3(0.05, 0.045, 0)),
    0.004,
    0.004,
    STEEL,
    4,
  );
  stick(new Vector3(0.052, BB.y - 0.097, BB.z), cage.clone().setX(0.05), 0.004, 0.004, STEEL, 4);
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
 * The rider from the hips up. `still` is coloured by vertex: neck, head and helmet, the bare arms and gloved hands,
 * the seat. `kit` is what the kit's texture is drawn on: the trunk and the sleeves.
 */
function body(jersey: Color): { still: BufferGeometry[]; kit: BufferGeometry[] } {
  const parts: BufferGeometry[] = [];
  const kit: BufferGeometry[] = [];
  const up = SHOULDER.clone().sub(HIP).normalize();
  const placed = (piece: BufferGeometry, matrix: Matrix4) => {
    piece.applyMatrix4(matrix);
    parts.push(piece);
  };
  const ball = (at: Vector3, size: Vector3, colour: Color, lat = 10) => {
    const piece = solid(new SphereGeometry(1, 14, lat), colour);
    piece.applyMatrix4(new Matrix4().makeScale(size.x, size.y, size.z));
    return { piece, at };
  };

  // The trunk, pelvis to the base of the neck: hips, a narrower waist, the chest, the shoulders' width, along a
  // back that rounds as a rider's does. The kit's texture is wrapped round it: shorts to the waist, the jersey
  // above.
  const base = HIP.clone().addScaledVector(up, -0.085);
  const neckBase = SHOULDER.clone().addScaledVector(up, 0.035);
  const trunk = wrap(
    [
      { t: 0, rx: 0.1, rz: 0.085, z: 0.012 },
      { t: 0.1, rx: 0.15, rz: 0.118, z: 0.016 },
      { t: 0.24, rx: 0.158, rz: 0.118, z: 0.02 },
      { t: 0.27, rx: 0.156, rz: 0.116, z: 0.022 },
      { t: 0.45, rx: 0.142, rz: 0.106, z: 0.034 },
      { t: 0.68, rx: 0.164, rz: 0.116, z: 0.036 },
      { t: 0.82, rx: 0.186, rz: 0.11, z: 0.028 },
      { t: 0.9, rx: 0.172, rz: 0.096, z: 0.02 },
      { t: 0.96, rx: 0.11, rz: 0.074, z: 0.01 },
      { t: 1, rx: 0.062, rz: 0.058, z: 0.004 },
    ],
    base.distanceTo(neckBase),
    0,
    KIT_TRUNK,
    20,
  );
  trunk.applyMatrix4(between(base, neckBase));
  kit.push(trunk);

  // Neck and head; the helmet over the skull, its vents dark from front to back, its tail drawn out behind.
  const skull = HEAD.clone();
  const nape = neckBase.clone().addScaledVector(up, -0.03);
  const neck = loft(
    [
      { t: 0, rx: 0.058, rz: 0.056 },
      { t: 1, rx: 0.05, rz: 0.052 },
    ],
    nape.distanceTo(skull) - 0.05,
    () => SKIN,
    10,
  );
  placed(neck, between(nape, skull));
  const head = ball(skull, new Vector3(0.076, 0.098, 0.092), SKIN, 12);
  placed(head.piece, new Matrix4().makeRotationX(0.25).setPosition(head.at));
  const shellShape = new SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.56);
  const shell = solid(shellShape, jersey, LACQUER);
  // Vents: every other stripe round the crown is dark, away from the rim.
  const place = shell.getAttribute('position');
  const tint = shell.getAttribute('color');
  for (let i = 0; i < place.count; i += 3) {
    const x = (place.getX(i) + place.getX(i + 1) + place.getX(i + 2)) / 3;
    const y = (place.getY(i) + place.getY(i + 1) + place.getY(i + 2)) / 3;
    const band = Math.floor((x + 1) * 3.5);
    const dark = band % 2 === 1 && y > 0.25 && y < 0.93;
    const rim = y < 0.06;
    const c = dark ? VENT : rim ? VENT : jersey;
    for (let k = 0; k < 3; k++) tint.setXYZ(i + k, c.r, c.g, c.b);
  }
  placed(
    shell,
    new Matrix4()
      .makeRotationX(-0.2)
      .multiply(new Matrix4().makeScale(0.094, 0.088, 0.142))
      .setPosition(skull.x, skull.y + 0.022, skull.z + 0.022),
  );

  // Arms: the shoulder rounding over the joint, the upper arm in its sleeve, the forearm, a gloved hand on the hood.
  for (const side of [-1, 1]) {
    const shoulder = SHOULDER.clone().add(new Vector3(side * 0.158, -0.018, 0.004));
    const hand = HOOD.clone()
      .setX(side * 0.2)
      .add(new Vector3(0, 0.022, 0.02));
    const elbow = bend(shoulder, hand, UPPER_ARM, FOREARM, new Vector3(side * 0.55, -0.5, 0.45));
    // The sleeve, from the shoulder to above the elbow, in the kit; the bare arm below it.
    const cuff = shoulder.clone().lerp(elbow, 0.62);
    const sleeve = wrap(
      [
        { t: 0, rx: 0.058, rz: 0.06 },
        { t: 0.12, rx: 0.056, rz: 0.058 },
        { t: 0.5, rx: 0.05, rz: 0.054 },
        { t: 0.95, rx: 0.045, rz: 0.048 },
        { t: 1, rx: 0.043, rz: 0.046 },
      ],
      shoulder.distanceTo(cuff),
      KIT_TRUNK,
      1,
      12,
    );
    sleeve.applyMatrix4(between(shoulder, cuff));
    kit.push(sleeve);
    const upper = loft(
      [
        { t: 0, rx: 0.04, rz: 0.043 },
        { t: 1, rx: 0.038, rz: 0.04 },
      ],
      cuff.distanceTo(elbow),
      () => SKIN,
      12,
    );
    placed(upper, between(cuff, elbow));
    const fore = loft(
      [
        { t: 0, rx: 0.039, rz: 0.041 },
        { t: 0.25, rx: 0.04, rz: 0.044 },
        { t: 0.8, rx: 0.028, rz: 0.03 },
        { t: 1, rx: 0.027, rz: 0.03 },
      ],
      FOREARM,
      (t) => (t < 0.86 ? SKIN : GLOVE),
      10,
    );
    placed(fore, between(elbow, hand));
    const fist = ball(hand, new Vector3(0.036, 0.034, 0.05), GLOVE, 8);
    placed(
      fist.piece,
      new Matrix4()
        .makeRotationX(0.5)
        .setPosition(fist.at.clone().add(new Vector3(0, -0.012, -0.028))),
    );
  }
  // The seat: the glutes either side of the saddle, in the shorts.
  for (const side of [-1, 1]) {
    const glute = ball(
      HIP.clone().add(new Vector3(side * 0.072, -0.03, 0.035)),
      new Vector3(0.092, 0.1, 0.11),
      SHORTS,
    );
    placed(glute.piece, new Matrix4().setPosition(glute.at));
  }
  return { still: parts, kit };
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
function kitTexture(jersey: Color): CanvasTexture {
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
    ctx.fillStyle = dark;
    ctx.fillRect(trunk, 0, size - trunk, y(0.8));
    ctx.fillStyle = pale;
    ctx.fillRect(trunk, y(0.8), size - trunk, 6);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A race number: black digits on white cloth, with a safety pin at each corner. */
function bibTexture(n: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f4f4f0';
    ctx.fillRect(0, 0, 128, 96);
    ctx.fillStyle = '#16171a';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), 64, 52);
    ctx.fillStyle = '#9aa0a6';
    for (const [x, y] of [
      [8, 8],
      [120, 8],
      [8, 88],
      [120, 88],
    ] as const) {
      ctx.fillRect(x - 3, y - 2, 6, 4);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Spokes for a wheel's disc: twenty-four thin lines from the hub to the rim, as a mask. */
function spokeTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.6;
    const c = size / 2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const hub = a + (i % 2 ? 0.45 : -0.45);
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(hub) * 9, c + Math.sin(hub) * 9);
      ctx.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c);
      ctx.stroke();
    }
  }
  return new CanvasTexture(canvas);
}
